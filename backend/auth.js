// Authentication + access control for the whole /api surface.
//
//  - POST /api/auth/login   email + password (+ optional role) -> JWT
//  - GET  /api/auth/me      current user (used by the frontend on page load)
//  - guard                  every other /api route needs a valid token, and the
//                           child / parent the request touches must belong to the
//                           logged-in user (parent = owner, therapist = granted).
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Child, Routine } = require('./models');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
const JWT_TTL = process.env.JWT_TTL || '7d';
if (!process.env.JWT_SECRET) {
  console.warn('[auth] JWT_SECRET is not set, using an insecure development secret. Set it in .env.');
}

const OID = /^[0-9a-fA-F]{24}$/;
const asId = (v) => (typeof v === 'string' && OID.test(v) ? v : null);
const publicUser = (u) => ({ id: String(u._id), name: u.name, email: u.email, role: u.role });

// ---- tiny in-memory brute-force limiter: 8 failures / 15 min per ip+email ----
const attempts = new Map();
const WINDOW = 15 * 60 * 1000;
const MAX_FAILS = 8;
function tooMany(key) {
  const now = Date.now();
  const list = (attempts.get(key) || []).filter((t) => now - t < WINDOW);
  attempts.set(key, list);
  return list.length >= MAX_FAILS;
}
const recordFail = (key) => attempts.set(key, [...(attempts.get(key) || []), Date.now()]);

function canAccessChildFor(user) {
  return (child) => {
    if (!child) return false;
    if (user.role === 'parent') return String(child.parentId) === user.id;
    return (child.grants || []).some((g) => String(g) === user.id);
  };
}

async function guard(req, res, next) {
  try {
    if (req.path === '/health' || req.path === '/auth/login') return next();

    const header = req.headers.authorization || '';
    let token = header.startsWith('Bearer ') ? header.slice(7) : null;
    // PDFs / uploaded sheets are opened as plain links, so GETs may carry ?token=
    if (!token && req.method === 'GET' && typeof req.query.token === 'string') token = req.query.token;
    if (!token) return res.status(401).json({ error: 'Please log in.' });

    let payload;
    try { payload = jwt.verify(token, JWT_SECRET); }
    catch { return res.status(401).json({ error: 'Your session has expired. Please log in again.' }); }

    const user = await User.findById(payload.sub).select('name email role').lean();
    if (!user) return res.status(401).json({ error: 'Account no longer exists. Please log in again.' });

    req.user = publicUser(user);
    req.canAccessChild = canAccessChildFor(req.user);

    // 1) every child this request refers to must be accessible
    const childIds = new Set();
    const fromPath = req.path.match(/\/children\/([^/]+)/);
    if (fromPath) childIds.add(fromPath[1]);
    for (const src of [req.query, req.body]) {
      if (src && typeof src === 'object' && src.childId !== undefined) childIds.add(String(src.childId));
    }
    const routineMatch = req.path.match(/^\/routines\/([^/]+)/);
    if (routineMatch && asId(routineMatch[1])) {
      const r = await Routine.findById(routineMatch[1]).select('childId').lean();
      if (r) childIds.add(String(r.childId));
    }
    for (const id of childIds) {
      if (!asId(id)) continue; // routes return 400 for malformed ids
      const child = await Child.findById(id).select('parentId grants').lean();
      if (child && !req.canAccessChild(child)) return res.status(403).json({ error: 'You do not have access to this child.' });
    }

    // 2) a parentId (used by the learning / teaching routes) must be the user, or a
    //    parent whose child the therapist has been granted
    for (const src of [req.query, req.body]) {
      const pid = src && typeof src === 'object' ? asId(src.parentId) : null;
      if (!pid) continue;
      if (req.user.role === 'parent') {
        if (pid !== req.user.id) return res.status(403).json({ error: 'You can only view your own data.' });
      } else if (!(await Child.exists({ parentId: pid, grants: req.user.id }))) {
        return res.status(403).json({ error: 'You do not have access to this family.' });
      }
    }

    // 3) parent-only actions
    if (req.user.role === 'therapist') {
      if (req.method === 'POST' && req.path.startsWith('/learning/'))
        return res.status(403).json({ error: 'The parent lessons can only be completed by the parent.' });
      if (req.method === 'DELETE' && req.path.startsWith('/teaching/submissions'))
        return res.status(403).json({ error: 'Only the parent can delete an attempt.' });
    }
    next();
  } catch (e) {
    console.error('[auth] guard error:', e.message);
    res.status(500).json({ error: 'Authorization check failed.' });
  }
}

module.exports = function registerAuth(app) {
  const router = express.Router();

  router.post('/auth/login', async (req, res) => {
    try {
      const email = String(req.body.email || '').trim().toLowerCase();
      const password = String(req.body.password || '');
      const role = req.body.role;
      if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

      const key = `${req.ip}|${email}`;
      if (tooMany(key)) return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });

      const user = await User.findOne({ email });
      const ok = user && (await bcrypt.compare(password, user.passwordHash));
      if (!ok) { recordFail(key); return res.status(401).json({ error: 'Incorrect email or password.' }); }

      if (role && role !== user.role) {
        return res.status(403).json({ error: `This is a ${user.role} account. Please use the ${user.role} login.` });
      }

      attempts.delete(key);
      const token = jwt.sign({ sub: String(user._id), role: user.role }, JWT_SECRET, { expiresIn: JWT_TTL });
      res.json({ token, user: publicUser(user) });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/auth/me', (req, res) => res.json({ user: req.user }));

  app.use('/api', guard, router);
};
module.exports.guard = guard;
