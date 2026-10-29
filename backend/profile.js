// Unified child profile: one synced snapshot of everything we know about a child.
//
//   GET /api/children/:id/profile?days=90
//
// Nothing is copied or cached: every request reads the live collections (episodes, routines,
// goals, progress, worksheets, notes...), so data logged later shows up on the next fetch.
// Access control comes from auth.js (the guard checks /children/:id for parent/therapist).
// The `analytics` block is the same input the AI insights feature will use later.
const mongoose = require('mongoose');
const {
  Child, Episode, Routine, RoutineLog, Note, Contact, Goal, Progress, Milestone,
  ActivityFeedback, Activity, TeachingSubmission, LearningProgress
} = require('./models');

const DAY = 24 * 60 * 60 * 1000;
const avg = (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);
const r1 = (n) => (n === null || n === undefined ? null : Math.round(n * 10) / 10);
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
const counts = (items) => {
  const m = new Map();
  items.filter(Boolean).forEach((i) => m.set(i, (m.get(i) || 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
};
const ageFrom = (dob) => {
  const d = new Date(dob), n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
  return a;
};

// ---------- episode analytics ----------
function episodeStats(eps) {
  if (!eps.length) return { total: 0 };
  const sorted = [...eps].sort((a, b) => new Date(a.ts) - new Date(b.ts));
  const half = Math.floor(sorted.length / 2);
  const first = sorted.slice(0, half || 1), last = sorted.slice(half || 1);
  const firstAvg = avg(first.map((e) => e.intensity)), lastAvg = avg(last.map((e) => e.intensity));
  const change = lastAvg !== null && firstAvg !== null ? lastAvg - firstAvg : 0;
  return {
    total: eps.length,
    avgIntensity: r1(avg(eps.map((e) => e.intensity))),
    avgDuration: r1(avg(eps.filter((e) => e.durationMinutes != null).map((e) => e.durationMinutes))),
    avgRecovery: r1(avg(eps.filter((e) => e.recoveryMinutes != null).map((e) => e.recoveryMinutes))),
    firstHalfAvgIntensity: r1(firstAvg),
    recentAvgIntensity: r1(lastAvg),
    trend: change <= -0.5 ? 'improving' : change >= 0.5 ? 'worsening' : 'stable',
    lastEpisodeAt: sorted[sorted.length - 1].ts,
    daysSinceLast: Math.floor((Date.now() - new Date(sorted[sorted.length - 1].ts)) / DAY)
  };
}

function weeklySeries(eps) {
  const weeks = new Map();
  eps.forEach((e) => {
    const d = new Date(e.ts);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
    const k = dayKey(d);
    const w = weeks.get(k) || { week: k, count: 0, sum: 0, minutes: 0 };
    w.count++; w.sum += e.intensity; w.minutes += e.durationMinutes || 0;
    weeks.set(k, w);
  });
  return [...weeks.values()].sort((a, b) => a.week.localeCompare(b.week))
    .map((w) => ({ week: w.week, episodes: w.count, avgIntensity: r1(w.sum / w.count), totalMinutes: w.minutes }));
}

function partOfDay(h) {
  if (h < 6) return 'Night'; if (h < 11) return 'Morning'; if (h < 14) return 'Midday';
  if (h < 17) return 'Afternoon'; if (h < 21) return 'Evening'; return 'Night';
}

function breakdowns(eps) {
  const byTriggerIntensity = {};
  eps.forEach((e) => { if (e.trigger) (byTriggerIntensity[e.trigger] ||= []).push(e.intensity); });
  const hunger = {}, sleep = { 'under 7h': [], '7h or more': [] };
  eps.forEach((e) => {
    if (e.hungerLevel) (hunger[e.hungerLevel] ||= []).push(e.intensity);
    if (typeof e.sleepHours === 'number') sleep[e.sleepHours < 7 ? 'under 7h' : '7h or more'].push(e.intensity);
  });
  const mapAvg = (o) => Object.entries(o).filter(([, v]) => v.length)
    .map(([name, v]) => ({ name, count: v.length, avgIntensity: r1(avg(v)) }));
  return {
    triggers: counts(eps.map((e) => e.trigger)).map((t) => ({ ...t, avgIntensity: r1(avg(byTriggerIntensity[t.name])) })),
    locations: counts(eps.map((e) => e.location)),
    environments: counts(eps.map((e) => e.sensoryEnvironment)),
    behaviors: counts(eps.flatMap((e) => e.behaviors || [])),
    timeOfDay: counts(eps.map((e) => partOfDay(new Date(e.ts).getHours()))),
    hourly: counts(eps.map((e) => new Date(e.ts).getHours())).map((h) => ({ hour: Number(h.name), count: h.count }))
      .sort((a, b) => a.hour - b.hour),
    weekday: counts(eps.map((e) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(e.ts).getDay()])),
    byHunger: mapAvg(hunger),
    bySleep: mapAvg(sleep)
  };
}

// which calming strategies go with the shortest recovery (relative to episode length)
function strategyEffectiveness(eps) {
  const m = {};
  eps.forEach((e) => (e.calmingInterventions || []).forEach((s) => {
    const x = (m[s] ||= { used: 0, intensity: [], recovery: [] });
    x.used++; x.intensity.push(e.intensity);
    if (e.recoveryMinutes != null) x.recovery.push(e.recoveryMinutes);
  }));
  return Object.entries(m).map(([name, x]) => ({
    name, timesUsed: x.used, avgIntensity: r1(avg(x.intensity)), avgRecoveryMinutes: r1(avg(x.recovery))
  })).sort((a, b) => b.timesUsed - a.timesUsed);
}

// ---------- routines ----------
async function routineSection(childId) {
  const routines = await Routine.find({ childId }).sort({ scheduleTime: 1 }).lean();
  const since = dayKey(Date.now() - 13 * DAY);
  const logs = routines.length
    ? await RoutineLog.find({ routineId: { $in: routines.map((r) => r._id) }, date: { $gte: since } }).lean() : [];
  const days = Array.from({ length: 7 }, (_, i) => dayKey(Date.now() - i * DAY)); // today first
  const items = routines.map((r) => {
    const mine = logs.filter((l) => String(l.routineId) === String(r._id));
    const week = days.map((d) => mine.find((l) => l.date === d)?.status || 'none');
    const done = week.filter((s) => s === 'completed').length;
    const tracked = week.filter((s) => s === 'completed' || s === 'skipped').length;
    return {
      _id: r._id, title: r.title, category: r.category, scheduleTime: r.scheduleTime, completedToday: r.completed,
      last7Days: week, completed7d: done, skipped7d: week.filter((s) => s === 'skipped').length,
      adherencePct: tracked ? Math.round((done / tracked) * 100) : null
    };
  });
  const rated = items.filter((i) => i.adherencePct !== null);
  return {
    items,
    days,
    overallAdherencePct: rated.length ? Math.round(avg(rated.map((i) => i.adherencePct))) : null,
    mostSkipped: (() => { const t = [...items].sort((a, b) => b.skipped7d - a.skipped7d)[0]; return t && t.skipped7d ? t.title : null; })()
  };
}

// ---------- goals / progress ----------
async function progressSection(childId) {
  const [goals, progress, milestones, subs] = await Promise.all([
    Goal.find({ childId }).lean(),
    Progress.find({ childId }).sort({ ts: 1 }).lean(),
    Milestone.find({ childId }).sort({ ts: -1 }).lean(),
    TeachingSubmission.find({ childId }).select('-file -marks').sort({ ts: -1 }).lean()
  ]);
  const goalList = goals.map((g) => {
    const inArea = progress.filter((p) => p.area === g.area && typeof p.score === 'number');
    const latest = inArea[inArea.length - 1];
    const current = latest ? latest.score : 0;
    return {
      _id: g._id, area: g.area, title: g.title, targetScore: g.targetScore, currentScore: current,
      percentOfTarget: g.targetScore ? Math.min(100, Math.round((current / g.targetScore) * 100)) : null,
      history: inArea.map((p) => ({ ts: p.ts, score: p.score }))
    };
  });
  const byArea = {};
  progress.forEach((p) => { if (p.area && typeof p.score === 'number') (byArea[p.area] ||= []).push({ ts: p.ts, score: p.score }); });
  return {
    goals: goalList,
    progressByArea: Object.entries(byArea).map(([area, series]) => ({ area, series })),
    milestones: milestones.map((m) => ({ _id: m._id, title: m.title, ts: m.ts })),
    worksheets: {
      total: subs.length,
      avgPercent: subs.length ? Math.round(avg(subs.map((s) => s.percent))) : null,
      avgEngagement: r1(avg(subs.filter((s) => s.engagement).map((s) => s.engagement))),
      totalMinutes: subs.reduce((a, s) => a + (s.minutes || 0), 0),
      recent: subs.slice(0, 8).map((s) => ({
        _id: s._id, worksheetId: s.worksheetId, area: s.area, ts: s.ts, percent: s.percent,
        engagement: s.engagement, minutes: s.minutes, notes: s.notes
      }))
    }
  };
}

// ---------- builder (shared with insights.js) ----------
async function buildProfile(childId, days = 90) {
      const since = new Date(Date.now() - days * DAY);

      const child = await Child.findById(childId).populate('parentId', 'name email').populate('grants', 'name email').lean();
      if (!child) return null;

      const [allEpisodes, notes, contacts, feedback, routines, progress] = await Promise.all([
        Episode.find({ childId }).sort({ ts: -1 }).lean(),
        Note.find({ childId }).sort({ ts: -1 }).lean(),
        Contact.find({ childId }).sort({ role: 1 }).lean(),
        ActivityFeedback.find({ childId }).sort({ ts: -1 }).limit(20).lean(),
        routineSection(childId),
        progressSection(childId)
      ]);
      const episodes = allEpisodes.filter((e) => new Date(e.ts) >= since);

      const activityDocs = feedback.length
        ? await Activity.find({ _id: { $in: feedback.map((f) => f.activityId) } }).lean() : [];
      const activityById = Object.fromEntries(activityDocs.map((a) => [String(a._id), a]));

      let learning = null;
      if (child.parentId) {
        const lps = await LearningProgress.find({ parentId: child.parentId._id }).lean();
        learning = {
          modules: lps.length,
          lessonsDone: lps.reduce((a, l) => a + l.lessons.length, 0),
          quizzesTaken: lps.reduce((a, l) => a + l.quizzes.reduce((x, q) => x + (q.attempts || 0), 0), 0),
          activeDays: new Set(lps.flatMap((l) => l.activityDays)).size,
          lastActiveAt: lps.map((l) => l.lastActiveAt).filter(Boolean).sort((a, b) => b - a)[0] || null
        };
      }

      const stamps = [
        ...allEpisodes.slice(0, 1).map((e) => e.ts), ...notes.slice(0, 1).map((n) => n.ts),
        ...progress.milestones.slice(0, 1).map((m) => m.ts), ...feedback.slice(0, 1).map((f) => f.ts)
      ].map((t) => new Date(t).getTime());

      return {
        generatedAt: new Date().toISOString(),
        // changes whenever new episodes / notes / milestones / feedback arrive; the AI layer can use it as a cache key
        dataVersion: `${progress.goals.length}-${allEpisodes.length}-${notes.length}-${progress.worksheets.total}-${progress.milestones.length}-${feedback.length}-${progress.progressByArea.reduce((a, x) => a + x.series.length, 0)}-${routines.items.reduce((a, r) => a + r.completed7d, 0)}-${Math.max(0, ...stamps)}`,
        rangeDays: days,
        child: {
          _id: child._id, name: child.name, dob: child.dob, age: ageFrom(child.dob), interests: child.interests || [],
          notes: child.notes || '', primaryTriggers: child.primaryTriggers || [], calmingStrategies: child.calmingStrategies || []
        },
        team: { parent: child.parentId || null, therapists: child.grants || [] },
        contacts,
        episodes: {
          stats: episodeStats(episodes),
          allTimeTotal: allEpisodes.length,
          weekly: weeklySeries(episodes),
          breakdowns: breakdowns(episodes),
          strategies: strategyEffectiveness(episodes),
          recent: episodes.slice(0, 15)
        },
        routines,
        goals: progress.goals,
        progress: { byArea: progress.progressByArea, milestones: progress.milestones, worksheets: progress.worksheets },
        activities: feedback.map((f) => ({
          _id: f._id, ts: f.ts, rating: f.rating, notes: f.notes,
          title: activityById[String(f.activityId)]?.title || 'Activity',
          category: activityById[String(f.activityId)]?.category || null
        })),
        notes: notes.slice(0, 20),
        learning
      };
}

// ---------- route ----------
function registerProfile(app) {
  app.get('/api/children/:id/profile', async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid child id' });
      const days = Math.min(Math.max(parseInt(req.query.days, 10) || 90, 7), 365);
      const profile = await buildProfile(req.params.id, days);
      if (!profile) return res.status(404).json({ error: 'Child not found' });
      res.json(profile);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}
module.exports = registerProfile;
module.exports.buildProfile = buildProfile;