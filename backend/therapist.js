// Therapist-only writes. Everything lands in the existing collections, so the profile,
// goals and AI insights pick it up on their next fetch. Child access is already enforced by auth.js.
const mongoose = require('mongoose');
const { Child, Episode, Routine, RoutineLog, Progress, Milestone, Goal } = require('./models');

module.exports = function registerTherapist(app) {
  app.get('/api/therapist/caseload', async (req, res) => {
    try {
      if (req.user.role !== 'therapist') return res.status(403).json({ error: 'Only therapists can view a caseload.' });
      const children = await Child.find({ grants: req.user.id }).populate('parentId', 'name').sort({ name: 1 }).lean();
      const now = Date.now();
      const weekStart = new Date(now - 7 * 864e5);
      const previousWeekStart = new Date(now - 14 * 864e5);
      const today = new Date().toISOString().slice(0, 10);
      const rows = await Promise.all(children.map(async (child) => {
        const [recentEpisodes, previousEpisodes, routines, goals, progress] = await Promise.all([
          Episode.find({ childId: child._id, ts: { $gte: weekStart } }).lean(),
          Episode.find({ childId: child._id, ts: { $gte: previousWeekStart, $lt: weekStart } }).lean(),
          Routine.find({ childId: child._id, active: { $ne: false } }).lean(),
          Goal.find({ childId: child._id }).lean(),
          Progress.find({ childId: child._id, obs: /^Therapist/i }).sort({ ts: -1 }).lean()
        ]);
        const routineIds = routines.map((routine) => routine._id);
        const logs = routineIds.length
          ? await RoutineLog.find({ routineId: { $in: routineIds }, date: { $gte: new Date(now - 7 * 864e5).toISOString().slice(0, 10) } }).lean()
          : [];
        const tracked = logs.filter((log) => log.status === 'completed' || log.status === 'skipped');
        const completed = logs.filter((log) => log.status === 'completed').length;
        const latestByArea = new Map();
        progress.forEach((item) => { if (item.area && !latestByArea.has(item.area)) latestByArea.set(item.area, item.score || 0); });
        const goalsReached = goals.filter((goal) => (latestByArea.get(goal.area) || 0) >= (goal.targetScore || 100)).length;
        const recentAverage = recentEpisodes.length ? recentEpisodes.reduce((sum, episode) => sum + episode.intensity, 0) / recentEpisodes.length : 0;
        const previousAverage = previousEpisodes.length ? previousEpisodes.reduce((sum, episode) => sum + episode.intensity, 0) / previousEpisodes.length : 0;
        const trend = !recentEpisodes.length || !previousEpisodes.length ? 'steady' : recentAverage > previousAverage + 0.25 ? 'worsening' : recentAverage < previousAverage - 0.25 ? 'improving' : 'steady';
        const flags = [];
        if (recentEpisodes.length >= 3) flags.push({ level: 'high', text: `${recentEpisodes.length} episodes this week` });
        if (trend === 'worsening') flags.push({ level: 'medium', text: 'Intensity is rising' });
        if (tracked.length && completed / tracked.length < 0.7) flags.push({ level: 'medium', text: 'Routine adherence is low' });
        return {
          _id: child._id,
          name: child.name,
          age: new Date().getFullYear() - new Date(child.dob).getFullYear(),
          parent: child.parentId?.name || null,
          episodes7d: recentEpisodes.length,
          adherencePct: tracked.length ? Math.round((completed / tracked.length) * 100) : null,
          goalsReached,
          goalsTotal: goals.length,
          trend,
          flags,
          lastReview: progress[0]?.ts || null,
          today
        };
      }));
      res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  const only = (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid child id' });
    if (req.user.role !== 'therapist') return res.status(403).json({ error: 'Only therapists can do this.' });
    next();
  };
  const text = (v, max) => String(v || '').trim().slice(0, max);

  app.post('/api/children/:id/progress', only, async (req, res) => {
    try {
      const area = text(req.body.area, 80), score = Number(req.body.score);
      if (!area) return res.status(400).json({ error: 'area is required' });
      if (!Number.isFinite(score) || score < 0 || score > 100) return res.status(400).json({ error: 'score must be 0-100' });
      let obs = text(req.body.obs, 500);
      if (!/^Therapist/i.test(obs)) obs = `Therapist review: ${obs}`.trim();
      res.status(201).json(await Progress.create({ childId: req.params.id, area, score, obs }));
    } catch (e) { res.status(400).json({ error: e.message }); }
  });

  app.post('/api/children/:id/milestones', only, async (req, res) => {
    try {
      const title = text(req.body.title, 160);
      if (!title) return res.status(400).json({ error: 'title is required' });
      res.status(201).json(await Milestone.create({ childId: req.params.id, title }));
    } catch (e) { res.status(400).json({ error: e.message }); }
  });

  app.post('/api/children/:id/goals', only, async (req, res) => {
    try {
      const area = text(req.body.area, 80), title = text(req.body.title, 160), targetScore = Number(req.body.targetScore);
      if (!area || !title) return res.status(400).json({ error: 'area and title are required' });
      if (!Number.isFinite(targetScore) || targetScore < 1 || targetScore > 100) return res.status(400).json({ error: 'targetScore must be 1-100' });
      res.status(201).json(await Goal.create({ childId: req.params.id, area, title, targetScore }));
    } catch (e) { res.status(400).json({ error: e.message }); }
  });
};