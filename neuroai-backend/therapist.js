// Therapist-only writes. Everything lands in the existing collections, so the profile,
// goals and AI insights pick it up on their next fetch. Child access is already enforced by auth.js.
const mongoose = require('mongoose');
const { Progress, Milestone, Goal } = require('./models');

module.exports = function registerTherapist(app) {
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