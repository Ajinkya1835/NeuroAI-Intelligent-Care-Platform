// Routines, episodes (edit / search) and activities (library, favourites, plan) + patterns.
// Registered after the original routes; paths here are new or intentionally richer.
//
//  GET    /api/children/:id/routines/week        routines with a 7-day grid, streaks, adherence
//  POST   /api/children/:id/routines             create
//  PUT    /api/routines/:id                      edit (title, time, steps, days, active ...)
//  DELETE /api/routines/:id
//  POST   /api/routines/:id/log                  { date?, status } -> upserts the log, keeps `completed` in sync
//  GET    /api/children/:id/episodes/search      ?q&min&max&trigger&from&to
//  PUT    /api/episodes/:id   DELETE /api/episodes/:id
//  GET    /api/children/:id/activities           library + fit score + favourite/planned flags + history
//  POST   /api/children/:id/activity-plan        { activityId, kind:'favorite'|'planned', date? } (favourite toggles)
//  PATCH  /api/activity-plan/:id                 { done }
//  GET    /api/children/:id/patterns/full        rich pattern analytics
const mongoose = require('mongoose');
const { Child, Episode, Routine, RoutineLog, Activity, ActivityPlan, ActivityFeedback } = require('./models');

const DAY = 864e5;
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
const avg = (v) => (v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null);
const isId = (v) => mongoose.isValidObjectId(v);
const str = (v, n) => String(v || '').trim().slice(0, n);
const counts = (items) => {
  const m = new Map();
  items.filter(Boolean).forEach((i) => m.set(i, (m.get(i) || 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
};
const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });
const ageOf = (dob) => Math.floor((Date.now() - new Date(dob)) / (365.25 * DAY));

module.exports = function registerCare(app) {
  const cid = (req, res, next) => (isId(req.params.id) ? next() : bad(res, 'Invalid id'));
  const wrap = (fn) => async (req, res) => { try { await fn(req, res); } catch (e) { res.status(500).json({ error: e.message }); } };

  // ---------------- routines ----------------
  app.get('/api/children/:id/routines/week', cid, wrap(async (req, res) => {
    const routines = await Routine.find({ childId: req.params.id }).sort({ scheduleTime: 1 }).lean();
    const days = Array.from({ length: 14 }, (_, i) => dayKey(Date.now() - i * DAY)); // today first
    const logs = routines.length ? await RoutineLog.find({ routineId: { $in: routines.map((r) => r._id) }, date: { $gte: days[13] } }).lean() : [];
    const items = routines.map((r) => {
      const mine = new Map(logs.filter((l) => String(l.routineId) === String(r._id)).map((l) => [l.date, l.status]));
      const scheduled = (d) => (r.days || [0, 1, 2, 3, 4, 5, 6]).includes(new Date(d + 'T12:00:00').getDay());
      const grid = days.map((d) => ({ date: d, scheduled: scheduled(d), status: mine.get(d) || 'none' }));
      const week = grid.slice(0, 7).filter((g) => g.scheduled);
      const done = week.filter((g) => g.status === 'completed').length;
      const tracked = week.filter((g) => g.status === 'completed' || g.status === 'skipped').length;
      let streak = 0;
      for (const g of grid) {
        if (!g.scheduled) continue;
        if (g.status === 'completed') streak++;
        else if (g.status === 'pending' || g.status === 'none') { if (g.date === days[0]) continue; break; }
        else break;
      }
      return {
        _id: r._id, title: r.title, category: r.category, scheduleTime: r.scheduleTime, steps: r.steps || [], supports: r.supports || '',
        days: r.days || [0, 1, 2, 3, 4, 5, 6], active: r.active !== false, todayStatus: grid[0].status, scheduledToday: grid[0].scheduled,
        grid: grid.slice(0, 7).reverse(), streak, doneThisWeek: done, adherencePct: tracked ? Math.round((done / tracked) * 100) : null,
        skipped14: grid.filter((g) => g.status === 'skipped').length
      };
    });
    const today = items.filter((i) => i.active && i.scheduledToday);
    const rated = items.filter((i) => i.adherencePct !== null);
    res.json({
      items, today: { total: today.length, done: today.filter((i) => i.todayStatus === 'completed').length },
      adherencePct: rated.length ? Math.round(avg(rated.map((i) => i.adherencePct))) : null,
      bestStreak: Math.max(0, ...items.map((i) => i.streak)),
      needsAttention: [...items].filter((i) => i.skipped14 >= 2).sort((a, b) => b.skipped14 - a.skipped14).slice(0, 3).map((i) => ({ _id: i._id, title: i.title, skipped: i.skipped14 }))
    });
  }));

  const routineBody = (b) => {
    const out = {};
    if (b.title !== undefined) out.title = str(b.title, 120);
    if (b.category !== undefined) out.category = str(b.category, 40);
    if (b.scheduleTime !== undefined) out.scheduleTime = /^\d{2}:\d{2}$/.test(b.scheduleTime) ? b.scheduleTime : '';
    if (b.supports !== undefined) out.supports = str(b.supports, 200);
    if (Array.isArray(b.steps)) out.steps = b.steps.map((s) => str(s, 120)).filter(Boolean).slice(0, 12);
    if (Array.isArray(b.days)) out.days = [...new Set(b.days.map(Number).filter((n) => n >= 0 && n <= 6))];
    if (typeof b.active === 'boolean') out.active = b.active;
    return out;
  };
  app.post('/api/children/:id/routines', cid, wrap(async (req, res) => {
    const body = routineBody(req.body);
    if (!body.title) return bad(res, 'title is required');
    res.status(201).json(await Routine.create({ ...body, childId: req.params.id }));
  }));
  app.put('/api/routines/:id', wrap(async (req, res) => {
    if (!isId(req.params.id)) return bad(res, 'Invalid id');
    const r = await Routine.findByIdAndUpdate(req.params.id, routineBody(req.body), { new: true });
    r ? res.json(r) : bad(res, 'Not found', 404);
  }));
  app.delete('/api/routines/:id', wrap(async (req, res) => {
    if (!isId(req.params.id)) return bad(res, 'Invalid id');
    await RoutineLog.deleteMany({ routineId: req.params.id });
    await Routine.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  }));
  app.post('/api/routines/:id/log', wrap(async (req, res) => {
    if (!isId(req.params.id)) return bad(res, 'Invalid id');
    const status = req.body.status;
    if (!['completed', 'skipped', 'pending'].includes(status)) return bad(res, 'status must be completed, skipped or pending');
    const date = /^\d{4}-\d{2}-\d{2}$/.test(req.body.date || '') ? req.body.date : dayKey(Date.now());
    if (date > dayKey(Date.now())) return bad(res, 'Cannot log a future day');
    await RoutineLog.findOneAndUpdate({ routineId: req.params.id, date }, { status }, { upsert: true });
    if (date === dayKey(Date.now())) await Routine.findByIdAndUpdate(req.params.id, { completed: status === 'completed' });
    res.json({ ok: true, date, status });
  }));

  // ---------------- episodes ----------------
  app.get('/api/children/:id/episodes/search', cid, wrap(async (req, res) => {
    const q = req.query, f = { childId: req.params.id };
    if (q.min || q.max) f.intensity = { ...(q.min && { $gte: +q.min }), ...(q.max && { $lte: +q.max }) };
    if (q.trigger) f.trigger = str(q.trigger, 80);
    if (q.from || q.to) f.ts = { ...(q.from && { $gte: new Date(q.from) }), ...(q.to && { $lte: new Date(new Date(q.to).getTime() + DAY) }) };
    let eps = await Episode.find(f).sort({ ts: -1 }).limit(300).lean();
    if (q.q) {
      const needle = str(q.q, 60).toLowerCase();
      eps = eps.filter((e) => JSON.stringify([e.trigger, e.activity, e.location, e.behaviors, e.response, e.notes, e.calmingInterventions]).toLowerCase().includes(needle));
    }
    const all = await Episode.find({ childId: req.params.id }).select('trigger').lean();
    res.json({
      items: eps, triggers: counts(all.map((e) => e.trigger)).map((t) => t.name),
      summary: { count: eps.length, avgIntensity: avg(eps.map((e) => e.intensity)), avgDuration: avg(eps.filter((e) => e.durationMinutes != null).map((e) => e.durationMinutes)), avgRecovery: avg(eps.filter((e) => e.recoveryMinutes != null).map((e) => e.recoveryMinutes)) }
    });
  }));
  const EP = ['ts', 'intensity', 'location', 'activity', 'trigger', 'sensoryEnvironment', 'sleepHours', 'hungerLevel', 'behaviors', 'durationMinutes', 'response', 'recoveryMinutes', 'calmingInterventions', 'postEpisodeBehavior', 'notes'];
  // The base guard checks child access via childId/path only, so episode edit/delete must verify ownership itself.
  const ownEpisode = async (req, res, next) => {
    if (!isId(req.params.id)) return bad(res, 'Invalid id');
    const e = await Episode.findById(req.params.id).select('childId').lean();
    const c = e && (await Child.findById(e.childId).select('parentId grants').lean());
    return c && req.canAccessChild(c) ? next() : bad(res, 'You do not have access to this episode.', 403);
  };
  app.put('/api/episodes/:id', ownEpisode, wrap(async (req, res) => {
    if (!isId(req.params.id)) return bad(res, 'Invalid id');
    const upd = Object.fromEntries(EP.filter((k) => req.body[k] !== undefined).map((k) => [k, req.body[k]]));
    const e = await Episode.findByIdAndUpdate(req.params.id, upd, { new: true, runValidators: true });
    e ? res.json(e) : bad(res, 'Not found', 404);
  }));
  app.delete('/api/episodes/:id', ownEpisode, wrap(async (req, res) => {
    if (!isId(req.params.id)) return bad(res, 'Invalid id');
    await Episode.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  }));
  // ---------------- activities ----------------
  app.get('/api/children/:id/activities', cid, wrap(async (req, res) => {
    const child = await Child.findById(req.params.id).lean();
    if (!child) return bad(res, 'Not found', 404);
    const [acts, plans, fb] = await Promise.all([
      Activity.find().lean(), ActivityPlan.find({ childId: req.params.id }).lean(), ActivityFeedback.find({ childId: req.params.id }).sort({ ts: -1 }).lean()
    ]);
    const age = ageOf(child.dob), interests = (child.interests || []).map((i) => i.toLowerCase());
    const items = acts.map((a) => {
      const mine = fb.filter((f) => String(f.activityId) === String(a._id));
      const last = mine[0];
      let fit = 50, why = [];
      if (a.minAge != null && age >= a.minAge && age <= a.maxAge) { fit += 20; why.push(`Suits age ${age}`); } else fit -= 25;
      if ((a.tags || []).includes('calming') || a.category === 'Regulation') { fit += 10; why.push('Helps regulation'); }
      if (interests.some((i) => (a.title + ' ' + a.description).toLowerCase().includes(i.split(' ')[0]))) { fit += 15; why.push('Matches an interest'); }
      if (mine.some((f) => f.rating === 'Completed')) fit += 5;
      if (last && /difficult/i.test(last.rating)) { fit -= 20; why.push('Was too hard last time'); }
      const fav = plans.find((p) => p.kind === 'favorite' && String(p.activityId) === String(a._id));
      const planned = plans.find((p) => p.kind === 'planned' && !p.done && String(p.activityId) === String(a._id));
      return { ...a, fit: Math.max(0, Math.min(100, fit)), why, favoriteId: fav ? fav._id : null, plannedId: planned ? planned._id : null, plannedDate: planned ? planned.date : null,
        timesCompleted: mine.filter((f) => f.rating === 'Completed').length, lastRating: last ? last.rating : null, lastNote: last ? last.notes : null, lastAt: last ? last.ts : null };
    }).sort((a, b) => b.fit - a.fit);
    res.json({ items, categories: [...new Set(acts.map((a) => a.category))], plan: items.filter((i) => i.plannedId).sort((a, b) => String(a.plannedDate).localeCompare(String(b.plannedDate))), completedThisWeek: fb.filter((f) => f.rating === 'Completed' && Date.now() - new Date(f.ts) < 7 * DAY).length });
  }));
  app.post('/api/children/:id/activity-plan', cid, wrap(async (req, res) => {
    const { activityId, kind } = req.body;
    if (!isId(activityId) || !['favorite', 'planned'].includes(kind)) return bad(res, 'activityId and kind required');
    if (kind === 'favorite') {
      const ex = await ActivityPlan.findOneAndDelete({ childId: req.params.id, activityId, kind });
      if (ex) return res.json({ favorite: false });
    }
    const date = /^\d{4}-\d{2}-\d{2}$/.test(req.body.date || '') ? req.body.date : dayKey(Date.now());
    const doc = await ActivityPlan.create({ childId: req.params.id, activityId, kind, date: kind === 'planned' ? date : undefined });
    res.status(201).json({ favorite: kind === 'favorite', plan: doc });
  }));
  app.delete('/api/children/:id/activity-plan/:planId', cid, wrap(async (req, res) => {
    if (!isId(req.params.planId)) return bad(res, 'Invalid id');
    await ActivityPlan.deleteOne({ _id: req.params.planId, childId: req.params.id });
    res.json({ ok: true });
  }));

  // ---------------- patterns ----------------
  app.get('/api/children/:id/patterns/full', cid, wrap(async (req, res) => {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 7), 365);
    const since = new Date(Date.now() - days * DAY);
    const all = await Episode.find({ childId: req.params.id }).sort({ ts: 1 }).lean();
    const eps = all.filter((e) => new Date(e.ts) >= since);
    const prev = all.filter((e) => new Date(e.ts) < since && new Date(e.ts) >= new Date(since - days * DAY));
    const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // calendar heat: day -> { count, max }
    const daily = {};
    eps.forEach((e) => { const k = dayKey(e.ts); const d = (daily[k] ||= { date: k, count: 0, maxIntensity: 0 }); d.count++; d.maxIntensity = Math.max(d.maxIntensity, e.intensity); });
    // weekday x part-of-day grid
    const part = (h) => (h < 11 ? 0 : h < 14 ? 1 : h < 17 ? 2 : h < 21 ? 3 : 4);
    const grid = Array.from({ length: 7 }, () => Array(5).fill(0));
    eps.forEach((e) => { const d = new Date(e.ts); grid[d.getDay()][part(d.getHours())]++; });
    // trigger -> what worked (recovery by strategy for that trigger)
    const byTrigger = counts(eps.map((e) => e.trigger)).map((t) => {
      const list = eps.filter((e) => e.trigger === t.name);
      const strat = {};
      list.forEach((e) => (e.calmingInterventions || []).forEach((s) => { if (e.recoveryMinutes != null) (strat[s] ||= []).push(e.recoveryMinutes); }));
      const best = Object.entries(strat).map(([name, v]) => ({ name, avgRecovery: avg(v), n: v.length })).sort((a, b) => a.avgRecovery - b.avgRecovery)[0] || null;
      return { ...t, avgIntensity: avg(list.map((e) => e.intensity)), avgDuration: avg(list.filter((e) => e.durationMinutes != null).map((e) => e.durationMinutes)), bestStrategy: best };
    });
    const strategies = (() => {
      const m = {};
      eps.forEach((e) => (e.calmingInterventions || []).forEach((s) => { const x = (m[s] ||= { used: 0, rec: [], int: [] }); x.used++; x.int.push(e.intensity); if (e.recoveryMinutes != null) x.rec.push(e.recoveryMinutes); }));
      return Object.entries(m).map(([name, x]) => ({ name, used: x.used, avgRecovery: avg(x.rec), avgIntensity: avg(x.int) })).sort((a, b) => (a.avgRecovery ?? 999) - (b.avgRecovery ?? 999));
    })();
    // does routine adherence line up with calmer days? compare weeks
    const routines = await Routine.find({ childId: req.params.id }).select('_id').lean();
    const logs = routines.length ? await RoutineLog.find({ routineId: { $in: routines.map((r) => r._id) }, date: { $gte: dayKey(since) } }).lean() : [];
    const dayAdh = {};
    logs.forEach((l) => { const x = (dayAdh[l.date] ||= { c: 0, t: 0 }); if (l.status !== 'pending') { x.t++; if (l.status === 'completed') x.c++; } });
    const good = [], poor = [];
    Object.entries(dayAdh).forEach(([d, x]) => { if (!x.t) return; const next = daily[d]; (x.c / x.t >= 0.8 ? good : poor).push(next ? next.maxIntensity : 0); });
    const stat = (v) => ({ avg: avg(v), count: v.length });
    res.json({
      rangeDays: days,
      totals: { episodes: eps.length, previous: prev.length, avgIntensity: avg(eps.map((e) => e.intensity)), previousAvgIntensity: avg(prev.map((e) => e.intensity)), calmDays: days - Object.keys(daily).length, longestCalmStreak: (() => { let best = 0, run = 0; for (let i = days - 1; i >= 0; i--) { if (daily[dayKey(Date.now() - i * DAY)]) run = 0; else best = Math.max(best, ++run); } return best; })() },
      daily: Object.values(daily), weekdayByPart: { weekdays: wd, parts: ['Morning', 'Midday', 'Afternoon', 'Evening', 'Night'], grid },
      triggers: byTrigger, strategies, behaviors: counts(eps.flatMap((e) => e.behaviors || [])), locations: counts(eps.map((e) => e.location)),
      weekdays: wd.map((name, i) => ({ name, count: grid[i].reduce((a, b) => a + b, 0) })),
      routineLink: { onTrack: stat(good), slipping: stat(poor) }
    });
  }));
};
