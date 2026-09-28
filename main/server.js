const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const db = new Database('neuroai.db');
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE, pw TEXT, name TEXT, role TEXT);
CREATE TABLE IF NOT EXISTS children(id INTEGER PRIMARY KEY, parent_id INT, name TEXT, dob TEXT, profile TEXT DEFAULT '{}');
CREATE TABLE IF NOT EXISTS grants(child_id INT, therapist_id INT, UNIQUE(child_id,therapist_id));
CREATE TABLE IF NOT EXISTS episodes(id INTEGER PRIMARY KEY, child_id INT, ts TEXT, location TEXT, activity TEXT, trigger_ TEXT, intensity INT, duration INT, before_ TEXT, during_ TEXT, after_ TEXT, helped TEXT);
CREATE TABLE IF NOT EXISTS notes(id INTEGER PRIMARY KEY, child_id INT, author_id INT, author TEXT, text TEXT, ts TEXT);
CREATE TABLE IF NOT EXISTS contacts(id INTEGER PRIMARY KEY, child_id INT, name TEXT, phone TEXT, relation TEXT);
`);
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const wrap = f => (req, res) => { try { f(req, res); } catch (e) { res.status(e.status || 500).json({ error: e.status ? e.message : 'Server error' }); } };
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const need = (o, keys) => keys.forEach(k => { if (o[k] === undefined || o[k] === '') fail(400, `Missing ${k}`); });

function auth(req, res, next) {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET); next(); }
  catch { res.status(401).json({ error: 'Not signed in' }); }
}
function childAccess(req, needOwner = false) {
  const c = db.prepare('SELECT * FROM children WHERE id=?').get(req.params.id);
  if (!c) fail(404, 'Not found');
  if (c.parent_id === req.user.id) return c;
  if (!needOwner && req.user.role === 'therapist' &&
    db.prepare('SELECT 1 FROM grants WHERE child_id=? AND therapist_id=?').get(c.id, req.user.id)) return c;
  fail(403, 'Not authorized for this child');
}
const token = u => jwt.sign({ id: u.id, role: u.role, name: u.name }, SECRET, { expiresIn: '7d' });

app.post('/api/register', wrap((req, res) => {
  const { email, password, name, role } = req.body;
  need(req.body, ['email', 'password', 'name']);
  if (password.length < 8) fail(400, 'Password must be at least 8 characters');
  const r = ['parent', 'therapist'].includes(role) ? role : 'parent'; // admin can't self-register
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email)) fail(409, 'Email already registered');
  const id = db.prepare('INSERT INTO users(email,pw,name,role) VALUES(?,?,?,?)').run(email, bcrypt.hashSync(password, 10), name, r).lastInsertRowid;
  res.json({ token: token({ id, role: r, name }), user: { name, role: r } });
}));
app.post('/api/login', wrap((req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(req.body.email || '');
  if (!u || !bcrypt.compareSync(req.body.password || '', u.pw)) fail(401, 'Invalid credentials');
  res.json({ token: token(u), user: { name: u.name, role: u.role } });
}));

app.get('/api/children', auth, wrap((req, res) => {
  res.json(req.user.role === 'therapist'
    ? db.prepare('SELECT c.* FROM children c JOIN grants g ON g.child_id=c.id WHERE g.therapist_id=?').all(req.user.id)
    : db.prepare('SELECT * FROM children WHERE parent_id=?').all(req.user.id));
}));
app.post('/api/children', auth, wrap((req, res) => {
  if (req.user.role !== 'parent') fail(403, 'Parents only');
  need(req.body, ['name', 'dob']);
  const p = JSON.stringify(req.body.profile || {});
  res.json({ id: db.prepare('INSERT INTO children(parent_id,name,dob,profile) VALUES(?,?,?,?)').run(req.user.id, req.body.name, req.body.dob, p).lastInsertRowid });
}));
app.get('/api/children/:id', auth, wrap((req, res) => res.json(childAccess(req))));

app.get('/api/children/:id/episodes', auth, wrap((req, res) => {
  const c = childAccess(req);
  res.json(db.prepare('SELECT * FROM episodes WHERE child_id=? ORDER BY ts DESC').all(c.id));
}));
app.post('/api/children/:id/episodes', auth, wrap((req, res) => {
  const c = childAccess(req, true), b = req.body;
  need(b, ['ts', 'intensity']);
  const i = Number(b.intensity);
  if (!(i >= 1 && i <= 5)) fail(400, 'Intensity must be 1-5');
  db.prepare('INSERT INTO episodes(child_id,ts,location,activity,trigger_,intensity,duration,before_,during_,after_,helped) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
    .run(c.id, b.ts, b.location || '', b.activity || '', b.trigger || '', i, Number(b.duration) || 0, b.before || '', b.during || '', b.after || '', b.helped || '');
  res.json({ ok: true });
}));

// Pattern analysis: descriptive counts only; phrased as associations, never causes.
app.get('/api/children/:id/patterns', auth, wrap((req, res) => {
  const c = childAccess(req);
  const eps = db.prepare('SELECT * FROM episodes WHERE child_id=?').all(c.id);
  const insights = [];
  const tally = (label, fn) => {
    const m = {};
    eps.forEach(e => { const k = (fn(e) || '').trim().toLowerCase(); if (k) m[k] = (m[k] || 0) + 1; });
    const [k, n] = Object.entries(m).sort((a, b) => b[1] - a[1])[0] || [];
    if (n >= 2) insights.push(`${n} of ${eps.length} recorded episodes involved ${label} "${k}".`);
  };
  const bucket = e => { const h = new Date(e.ts).getHours(); return isNaN(h) ? '' : h < 6 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; };
  tally('the time of day', bucket); tally('the location', e => e.location);
  tally('the activity', e => e.activity); tally('the recorded trigger', e => e.trigger_);
  const half = Math.floor(eps.length / 2), sorted = [...eps].sort((a, b) => a.ts.localeCompare(b.ts));
  if (eps.length >= 6) {
    const avg = a => a.reduce((s, e) => s + e.intensity, 0) / a.length;
    const d = avg(sorted.slice(half)) - avg(sorted.slice(0, half));
    insights.push(Math.abs(d) < .3 ? 'Recorded intensity has been about the same over time.' : `Recorded intensity has been ${d > 0 ? 'higher' : 'lower'} in the more recent half of entries.`);
  }
  res.json({ total: eps.length, insights: eps.length < 3 ? [] : insights,
    disclaimer: 'These are observed associations in what you recorded, not causes or diagnoses. Small samples can be misleading; discuss with a qualified professional.' });
}));

app.get('/api/children/:id/notes', auth, wrap((req, res) => res.json(db.prepare('SELECT * FROM notes WHERE child_id=? ORDER BY ts DESC').all(childAccess(req).id))));
app.post('/api/children/:id/notes', auth, wrap((req, res) => {
  const c = childAccess(req); need(req.body, ['text']);
  db.prepare('INSERT INTO notes(child_id,author_id,author,text,ts) VALUES(?,?,?,?,?)').run(c.id, req.user.id, `${req.user.name} (${req.user.role})`, req.body.text, new Date().toISOString());
  res.json({ ok: true });
}));

// Parent controls therapist access
app.post('/api/children/:id/grants', auth, wrap((req, res) => {
  const c = childAccess(req, true);
  const t = db.prepare("SELECT id FROM users WHERE email=? AND role='therapist'").get(req.body.email || '');
  if (!t) fail(404, 'No therapist with that email');
  db.prepare('INSERT OR IGNORE INTO grants VALUES(?,?)').run(c.id, t.id); res.json({ ok: true });
}));
app.get('/api/children/:id/grants', auth, wrap((req, res) => {
  const c = childAccess(req, true);
  res.json(db.prepare('SELECT u.id,u.name,u.email FROM grants g JOIN users u ON u.id=g.therapist_id WHERE g.child_id=?').all(c.id));
}));
app.delete('/api/children/:id/grants/:tid', auth, wrap((req, res) => {
  const c = childAccess(req, true);
  db.prepare('DELETE FROM grants WHERE child_id=? AND therapist_id=?').run(c.id, req.params.tid); res.json({ ok: true });
}));

app.get('/api/children/:id/contacts', auth, wrap((req, res) => res.json(db.prepare('SELECT * FROM contacts WHERE child_id=?').all(childAccess(req).id))));
app.post('/api/children/:id/contacts', auth, wrap((req, res) => {
  const c = childAccess(req, true); need(req.body, ['name', 'phone']);
  db.prepare('INSERT INTO contacts(child_id,name,phone,relation) VALUES(?,?,?,?)').run(c.id, req.body.name, req.body.phone, req.body.relation || ''); res.json({ ok: true });
}));

db.exec(`
CREATE TABLE IF NOT EXISTS progress(id INTEGER PRIMARY KEY, child_id INT, area TEXT, score INT, obs TEXT, ts TEXT);
CREATE TABLE IF NOT EXISTS goals(id INTEGER PRIMARY KEY, child_id INT, title TEXT, area TEXT, term TEXT, progress INT DEFAULT 0, by TEXT, status TEXT DEFAULT 'active', ts TEXT);
CREATE TABLE IF NOT EXISTS milestones(id INTEGER PRIMARY KEY, child_id INT, title TEXT, ts TEXT);
CREATE TABLE IF NOT EXISTS routines(id INTEGER PRIMARY KEY, child_id INT, title TEXT, time TEXT);
CREATE TABLE IF NOT EXISTS routine_log(routine_id INT, child_id INT, day TEXT, done INT, note TEXT);
CREATE TABLE IF NOT EXISTS activities(id INTEGER PRIMARY KEY, title TEXT, area TEXT, min_age INT, desc TEXT, dur INT, materials TEXT, sensory TEXT);
CREATE TABLE IF NOT EXISTS act_fb(child_id INT, activity_id INT, fb TEXT, ts TEXT);
CREATE TABLE IF NOT EXISTS resources(id INTEGER PRIMARY KEY, title TEXT, cat TEXT, body TEXT);
CREATE TABLE IF NOT EXISTS res_state(user_id INT, resource_id INT, read INT DEFAULT 0, fav INT DEFAULT 0, UNIQUE(user_id,resource_id));
`);
if (!db.prepare('SELECT COUNT(*) n FROM activities').get().n) {
  const A = db.prepare('INSERT INTO activities(title,area,min_age,desc,dur,materials,sensory) VALUES(?,?,?,?,?,?,?)');
  [['Picture choice board', 'communication', 2, 'Offer two pictured choices (snack, toy) and respond to pointing or gestures.', 10, 'Printed pictures, card', 'Low noise; visual only'],
   ['Feelings faces game', 'emotional regulation', 3, 'Match face cards to feelings and practise naming one together.', 15, 'Emotion cards', 'Calm, quiet space'],
   ['Turn-taking with a ball', 'social skills', 2, 'Roll a soft ball back and forth, saying "my turn / your turn".', 10, 'Soft ball', 'Soft texture; stop if overwhelmed'],
   ['Deep-pressure calm-down', 'relaxation', 2, 'Offer a weighted blanket or firm hugs while breathing slowly together.', 10, 'Blanket, cushions', 'Only if the child enjoys pressure'],
   ['Playdough shapes', 'motor skills', 3, 'Roll, squeeze and cut playdough to build fine motor strength.', 20, 'Playdough, cutters', 'Texture may bother some children'],
   ['Get-dressed steps chart', 'daily living', 4, 'Use a picture sequence to practise one dressing step independently.', 15, 'Picture chart, clothes', 'Choose soft clothing'],
   ['Sensory bin exploration', 'sensory', 2, 'Explore rice or water beads with scoops and hidden toys.', 15, 'Bin, filler, toys', 'Go slowly; watch for texture aversion']].forEach(r => A.run(...r));
  const R = db.prepare('INSERT INTO resources(title,cat,body) VALUES(?,?,?)');
  [['Using visual schedules', 'routine', 'Visual schedules show the day in pictures so transitions are more predictable. Start with 3 steps, move a marker as each finishes, and warn before changes.'],
   ['Supporting communication at home', 'communication', 'Follow your child\'s lead, pause and wait, model simple words, and accept all communication (gestures, pictures, sounds). Consider asking a speech therapist about AAC.'],
   ['Understanding sensory needs', 'sensory', 'Children may seek or avoid sound, touch, light or movement. Note what your child reaches for or avoids, and adjust the environment before demands are made.'],
   ['Helping with big feelings', 'emotional regulation', 'Stay calm, reduce input, keep language short, and teach calming tools when your child is calm, not during a meltdown.'],
   ['Preparing for a therapist visit', 'professional', 'Bring recent episode logs, goals and questions. Share what helped and what did not. Ask which strategies to try at home.']].forEach(r => R.run(...r));
}
const ageOf = d => Math.floor((Date.now() - new Date(d)) / 31557600000);
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();

app.get('/api/children/:id/progress', auth, wrap((req, res) => res.json(db.prepare('SELECT * FROM progress WHERE child_id=? ORDER BY ts DESC').all(childAccess(req).id))));
app.post('/api/children/:id/progress', auth, wrap((req, res) => {
  const c = childAccess(req, true); need(req.body, ['area', 'score']);
  const s = Number(req.body.score); if (!(s >= 1 && s <= 5)) fail(400, 'Score must be 1-5');
  db.prepare('INSERT INTO progress(child_id,area,score,obs,ts) VALUES(?,?,?,?,?)').run(c.id, req.body.area.trim().toLowerCase(), s, req.body.obs || '', now()); res.json({ ok: true });
}));
app.get('/api/children/:id/goals', auth, wrap((req, res) => res.json(db.prepare('SELECT * FROM goals WHERE child_id=? ORDER BY id DESC').all(childAccess(req).id))));
app.post('/api/children/:id/goals', auth, wrap((req, res) => {
  const c = childAccess(req); need(req.body, ['title']); // therapists with access may contribute
  db.prepare('INSERT INTO goals(child_id,title,area,term,by,ts) VALUES(?,?,?,?,?,?)').run(c.id, req.body.title, req.body.area || '', req.body.term || '', req.user.role, now()); res.json({ ok: true });
}));
app.patch('/api/children/:id/goals/:gid', auth, wrap((req, res) => {
  const c = childAccess(req), p = Math.max(0, Math.min(100, Number(req.body.progress) || 0));
  db.prepare("UPDATE goals SET progress=?, status=? WHERE id=? AND child_id=?").run(p, p >= 100 ? 'done' : 'active', req.params.gid, c.id);
  if (p >= 100) { const g = db.prepare('SELECT title FROM goals WHERE id=?').get(req.params.gid); if (g) db.prepare('INSERT INTO milestones(child_id,title,ts) VALUES(?,?,?)').run(c.id, 'Goal achieved: ' + g.title, now()); }
  res.json({ ok: true });
}));
app.get('/api/children/:id/milestones', auth, wrap((req, res) => res.json(db.prepare('SELECT * FROM milestones WHERE child_id=? ORDER BY ts DESC').all(childAccess(req).id))));
app.post('/api/children/:id/milestones', auth, wrap((req, res) => {
  const c = childAccess(req, true); need(req.body, ['title']);
  db.prepare('INSERT INTO milestones(child_id,title,ts) VALUES(?,?,?)').run(c.id, req.body.title, now()); res.json({ ok: true });
}));

app.get('/api/children/:id/routines', auth, wrap((req, res) => {
  const c = childAccess(req), since = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
  res.json(db.prepare('SELECT * FROM routines WHERE child_id=? ORDER BY time').all(c.id).map(r => {
    const t = db.prepare('SELECT done,note FROM routine_log WHERE routine_id=? AND day=?').get(r.id, today());
    const n = db.prepare('SELECT COUNT(*) n FROM routine_log WHERE routine_id=? AND done=1 AND day>=?').get(r.id, since).n;
    return { ...r, done: t ? t.done : 0, note: t ? t.note : '', rate: Math.round(n / 7 * 100) };
  }));
}));
app.post('/api/children/:id/routines', auth, wrap((req, res) => {
  const c = childAccess(req, true); need(req.body, ['title']);
  db.prepare('INSERT INTO routines(child_id,title,time) VALUES(?,?,?)').run(c.id, req.body.title, req.body.time || ''); res.json({ ok: true });
}));
app.post('/api/children/:id/routines/:rid/log', auth, wrap((req, res) => {
  const c = childAccess(req, true);
  if (!db.prepare('SELECT 1 FROM routines WHERE id=? AND child_id=?').get(req.params.rid, c.id)) fail(404, 'Not found');
  db.prepare('DELETE FROM routine_log WHERE routine_id=? AND day=?').run(req.params.rid, today());
  db.prepare('INSERT INTO routine_log VALUES(?,?,?,?,?)').run(req.params.rid, c.id, today(), req.body.done ? 1 : 0, req.body.note || ''); res.json({ ok: true });
}));

// Recommendations: age fit + goal areas + interests, adjusted by parent feedback.
app.get('/api/children/:id/activities', auth, wrap((req, res) => {
  const c = childAccess(req), age = ageOf(c.dob), prof = JSON.parse(c.profile || '{}');
  const likes = (prof.likes || '').toLowerCase().split(/[,\s]+/).filter(w => w.length > 2);
  const areas = db.prepare("SELECT area FROM goals WHERE child_id=? AND status='active'").all(c.id).map(r => r.area.toLowerCase());
  const fb = {}; db.prepare('SELECT activity_id,fb FROM act_fb WHERE child_id=?').all(c.id).forEach(r => (fb[r.activity_id] = fb[r.activity_id] || []).push(r.fb));
  const out = db.prepare('SELECT * FROM activities WHERE min_age<=?').all(age).map(a => {
    let s = 0; const why = [], f = fb[a.id] || [];
    if (areas.some(x => x && (a.area.includes(x) || x.includes(a.area)))) { s += 3; why.push('Matches an active goal'); }
    if (likes.some(w => (a.title + a.desc).toLowerCase().includes(w))) { s += 2; why.push('Related to interests'); }
    if (f.some(x => x === 'enjoyed' || x === 'helpful')) { s += 2; why.push('Went well before'); }
    if (f.some(x => ['skipped', 'difficult', 'not_helpful'].includes(x))) { s -= 3; why.push('Was hard or unhelpful before'); }
    if (f.includes('completed')) s -= 1;
    return { ...a, score: s, reasons: why.length ? why : ['Suitable for age'] };
  }).sort((a, b) => b.score - a.score);
  res.json(out);
}));
app.post('/api/children/:id/activities/:aid/feedback', auth, wrap((req, res) => {
  const c = childAccess(req, true);
  if (!['completed', 'skipped', 'enjoyed', 'difficult', 'helpful', 'not_helpful'].includes(req.body.fb)) fail(400, 'Invalid feedback');
  db.prepare('INSERT INTO act_fb VALUES(?,?,?,?)').run(c.id, req.params.aid, req.body.fb, now()); res.json({ ok: true });
}));

app.get('/api/resources', auth, wrap((req, res) => res.json(db.prepare(
  'SELECT r.*, COALESCE(s.read,0) read, COALESCE(s.fav,0) fav FROM resources r LEFT JOIN res_state s ON s.resource_id=r.id AND s.user_id=?').all(req.user.id))));
app.post('/api/resources/:rid', auth, wrap((req, res) => {
  db.prepare('INSERT OR IGNORE INTO res_state(user_id,resource_id) VALUES(?,?)').run(req.user.id, req.params.rid);
  if (req.body.read !== undefined) db.prepare('UPDATE res_state SET read=? WHERE user_id=? AND resource_id=?').run(req.body.read ? 1 : 0, req.user.id, req.params.rid);
  if (req.body.fav !== undefined) db.prepare('UPDATE res_state SET fav=? WHERE user_id=? AND resource_id=?').run(req.body.fav ? 1 : 0, req.user.id, req.params.rid);
  res.json({ ok: true });
}));

app.get('/api/children/:id/timeline', auth, wrap((req, res) => {
  const c = childAccess(req), q = (sql, type, f) => db.prepare(sql).all(c.id).map(r => ({ ts: r.ts, type, text: f(r) }));
  res.json([
    ...q('SELECT * FROM episodes WHERE child_id=?', 'episode', r => `Episode, intensity ${r.intensity}/5 ${r.location ? 'at ' + r.location : ''}`),
    ...q('SELECT * FROM progress WHERE child_id=?', 'progress', r => `${r.area}: ${r.score}/5 ${r.obs}`),
    ...q('SELECT * FROM milestones WHERE child_id=?', 'milestone', r => r.title),
    ...q('SELECT * FROM goals WHERE child_id=?', 'goal', r => `Goal set (${r.by}): ${r.title}`),
    ...q('SELECT * FROM notes WHERE child_id=?', 'note', r => `${r.author}: ${r.text}`),
  ].filter(x => x.ts).sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 100));
}));

// Chat: (1) urgent-safety rules, (2) minimal retrieved context (no name/DOB), (3) LLM if key set.
const URGENT = /suicid|self.?harm|hurt(ing)? (him|her|them)self|not breathing|seizure|choking|unconscious|overdose|wander(ed)? off|is missing|kill/i;
app.post('/api/children/:id/chat', auth, async (req, res) => {
  try {
    const c = childAccess(req, true), msg = String(req.body.message || '').slice(0, 1000);
    if (!msg) fail(400, 'Empty message');
    if (URGENT.test(msg)) return res.json({ reply: 'This may be an emergency. Please call your local emergency number now (India: 112) or go to the nearest hospital. Use the red Emergency button for your saved contacts. I can\'t help with urgent situations, but I\'m here afterwards.' });
    const goals = db.prepare("SELECT title FROM goals WHERE child_id=? AND status='active' LIMIT 5").all(c.id).map(g => g.title);
    const eps = db.prepare('SELECT ts,location,activity,trigger_,intensity FROM episodes WHERE child_id=? ORDER BY ts DESC LIMIT 8').all(c.id);
    const ctx = `Child age: ${ageOf(c.dob)}. Active goals: ${goals.join('; ') || 'none'}. Recent episodes: ${JSON.stringify(eps)}.`;
    if (!process.env.ANTHROPIC_API_KEY) return res.json({ reply: `(AI key not configured; showing a summary.) ${ctx} Please discuss anything concerning with a qualified professional.` });
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-5', max_tokens: 600,
        system: 'You are NeuroAI, a supportive assistant for parents of autistic children. Never diagnose, never claim to be a doctor or therapist, never state causes as fact (only possible associations), state uncertainty, and suggest professionals for medical or clinical questions. Keep answers short and kind. Use only this data if relevant: ' + ctx,
        messages: [{ role: 'user', content: msg }] }) });
    const d = await r.json();
    res.json({ reply: (d.content || []).map(x => x.text || '').join('') || 'Sorry, I could not answer that right now.' });
  } catch (e) { res.status(e.status || 500).json({ error: e.status ? e.message : 'Chat failed' }); }
});

app.listen(process.env.PORT || 3001, () => console.log('NeuroAI running on http://localhost:3001'));