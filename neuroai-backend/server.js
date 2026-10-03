const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const {
  Child, Episode, Routine, Note, Activity, ActivityFeedback, Progress, Milestone
} = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;
const OLLAMA_URL = process.env.OLLAMA_URL || ''; // e.g. http://host:11434/api/generate
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: '100kb' }));

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/neuroai')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ---------- helpers ----------
const isId = (v) => mongoose.isValidObjectId(v);
const pick = (obj, keys) =>
  Object.fromEntries(keys.filter(k => obj[k] !== undefined).map(k => [k, obj[k]]));

const ageFrom = (dob) => {
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
};

const topCounts = (items) => {
  const map = new Map();
  items.filter(Boolean).forEach(i => map.set(i, (map.get(i) || 0) + 1));
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
};

const validateChild = (req, res, next) => {
  if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid child id' });
  next();
};

const EPISODE_FIELDS = [
  'childId', 'ts', 'intensity', 'location', 'activity', 'trigger', 'sensoryEnvironment',
  'sleepHours', 'hungerLevel', 'behaviors', 'durationMinutes', 'response',
  'recoveryMinutes', 'calmingInterventions', 'postEpisodeBehavior', 'notes'
];

function ruleBasedSummary(episodes) {
  const triggers = topCounts(episodes.map(e => e.trigger));
  const hours = topCounts(episodes.map(e => new Date(e.ts).getHours()));
  const avg = episodes.reduce((a, e) => a + e.intensity, 0) / episodes.length;
  const parts = [`${episodes.length} recent episodes, average intensity ${avg.toFixed(1)}/5.`];
  if (triggers[0]) parts.push(`Most common trigger: ${triggers[0][0]} (${triggers[0][1]} of ${episodes.length}).`);
  if (hours[0]) parts.push(`Most episodes happen around ${hours[0][0]}:00 (${hours[0][1]} of ${episodes.length}).`);
  return parts.join(' ');
}

async function askOllama(prompt) {
  if (!OLLAMA_URL) throw new Error('OLLAMA_URL not set');
  const r = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
    signal: AbortSignal.timeout(20000)
  });
  if (!r.ok) throw new Error(`Ollama ${r.status}`);
  return (await r.json()).response;
}

// ---------- routes ----------
app.get('/api/children', async (_req, res) => {
  try {
    const children = await Child.find().lean();
    res.json(children.map(c => ({ _id: c._id, name: c.name, age: ageFrom(c.dob), parentId: c.parentId })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/children/:id/timeline', validateChild, async (req, res) => {
  try {
    const childId = req.params.id;
    const [episodes, notes, progress, milestones] = await Promise.all([
      Episode.find({ childId }).lean(),
      Note.find({ childId }).lean(),
      Progress.find({ childId }).lean(),
      Milestone.find({ childId }).lean()
    ]);

    const events = [
      ...episodes.map(e => ({
        type: 'episode',
        title: `${e.trigger || 'Episode'} (intensity ${e.intensity}/5)`,
        details: [e.activity, e.location].filter(Boolean).join(' · '),
        ts: e.ts
      })),
      ...notes.map(n => ({ type: 'note', title: `Note from ${n.author}`, details: n.text, ts: n.ts })),
      ...progress.map(p => ({ type: 'progress', title: `${p.area || 'Progress'}: ${p.score ?? ''}`, details: p.obs || '', ts: p.ts })),
      ...milestones.map(m => ({ type: 'milestone', title: m.title, details: '', ts: m.ts }))
    ].sort((a, b) => new Date(b.ts) - new Date(a.ts));

    res.json(events);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, db: mongoose.connection.readyState === 1 })
);

app.get('/api/children/:id/patterns', validateChild, async (req, res) => {
  try {
    const childId = req.params.id;
    const [episodes, routines] = await Promise.all([
      Episode.find({ childId }).lean(),
      Routine.find({ childId }).lean()
    ]);
    const avgIntensity = episodes.length
      ? Number((episodes.reduce((a, e) => a + e.intensity, 0) / episodes.length).toFixed(1)) : 0;
    const done = routines.filter(r => r.completed).length;
    const toObj = ([name, count]) => ({ name, count });
    res.json({
      avgIntensity,
      totalEpisodes: episodes.length,
      triggerCounts: topCounts(episodes.map(e => e.trigger)).map(toObj),
      locationCounts: topCounts(episodes.map(e => e.location)).map(toObj),
      routineSuccessRate: routines.length ? Math.round((done / routines.length) * 100) : 0
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/children/:id/episodes', validateChild, async (req, res) => {
  try { res.json(await Episode.find({ childId: req.params.id }).sort({ ts: -1 }).limit(50)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/children/:id/notes', validateChild, async (req, res) => {
  try { res.json(await Note.find({ childId: req.params.id }).sort({ ts: -1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/children/:id/notes', validateChild, async (req, res) => {
  try {
    const { author, authorRole, text } = req.body;
    if (!author || !text) return res.status(400).json({ error: 'author and text required' });
    res.status(201).json(await Note.create({ childId: req.params.id, author, authorRole, text }));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/children/:id/team', validateChild, async (req, res) => {
  try {
    const child = await Child.findById(req.params.id)
      .populate('parentId', 'name email role')
      .populate('grants', 'name email role').lean();
    if (!child) return res.status(404).json({ error: 'Not found' });
    res.json({ parent: child.parentId, therapists: child.grants });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/children/:id/routines', validateChild, async (req, res) => {
  try {
    res.json(await Routine.find({ childId: req.params.id }).sort({ scheduleTime: 1 }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/episodes', async (req, res) => {
  try {
    if (!isId(req.body.childId)) return res.status(400).json({ error: 'Valid childId required' });
    const episode = await Episode.create(pick(req.body, EPISODE_FIELDS));
    res.status(201).json(episode);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.patch('/api/routines/:id', async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    if (typeof req.body.completed !== 'boolean') return res.status(400).json({ error: 'completed must be boolean' });
    const routine = await Routine.findByIdAndUpdate(req.params.id, { completed: req.body.completed }, { new: true });
    if (!routine) return res.status(404).json({ error: 'Not found' });
    res.json(routine);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/activities', async (_req, res) => {
  try { res.json(await Activity.find()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/activities/:id/feedback', async (req, res) => {
  try {
    if (!isId(req.params.id) || !isId(req.body.childId)) return res.status(400).json({ error: 'Invalid id' });
    const fb = await ActivityFeedback.create({
      activityId: req.params.id,
      childId: req.body.childId,
      rating: req.body.rating,
      notes: req.body.notes
    });
    res.status(201).json(fb);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { childId } = req.body;
    if (!isId(childId)) return res.status(400).json({ error: 'Valid childId required' });

    const episodes = await Episode.find({ childId }).sort({ ts: -1 }).limit(20).lean();
    if (!episodes.length) return res.json({ analysis: 'No episodes logged yet.', source: 'none' });

    const slim = episodes.map(({ ts, intensity, trigger, activity, location, durationMinutes }) =>
      ({ ts, intensity, trigger, activity, location, durationMinutes }));

    try {
      const analysis = await askOllama(
        `Analyze these sensory meltdown episodes for a child. Give short, practical pattern insights and calming suggestions. Not medical advice.\n${JSON.stringify(slim)}`
      );
      res.json({ analysis, source: 'ollama' });
    } catch (err) {
      console.warn('Ollama unavailable, using rule-based summary:', err.message);
      res.json({ analysis: ruleBasedSummary(episodes), source: 'rule-based' });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, childId } = req.body;
    if (!message || !isId(childId)) return res.status(400).json({ error: 'message and valid childId required' });

    const [child, episodes] = await Promise.all([
      Child.findById(childId).lean(),
      Episode.find({ childId }).sort({ ts: -1 }).limit(10).lean()
    ]);
    if (!child) return res.status(404).json({ error: 'Child not found' });

    const context = {
      age: ageFrom(child.dob),
      triggers: child.primaryTriggers,
      calming: child.calmingStrategies,
      recentEpisodes: episodes.map(({ ts, intensity, trigger, location }) => ({ ts, intensity, trigger, location }))
    };

    const reply = await askOllama(
      `You are a supportive assistant for a parent of an autistic child. Be brief and practical, not medical advice.\nContext: ${JSON.stringify(context)}\nParent asks: ${message}`
    );
    res.json({ reply });
  } catch (e) {
    console.warn('Chat failed:', e.message);
    res.status(503).json({ reply: 'The AI assistant is offline right now. Try again later.' });
  }
});

require('./learning')(app);

app.listen(PORT, () => {
  console.log(`Backend on http://localhost:${PORT}`);
  console.log(OLLAMA_URL ? `Ollama: ${OLLAMA_URL} (${OLLAMA_MODEL})` : 'Ollama: not configured (rule-based fallback)');
});