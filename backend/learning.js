const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const { LearningProgress } = require('./models');

const CONTENT_DIR = path.join(__dirname, 'content', 'learning');
const QUIZ_MINUTES = 3;
const MASTERY = 0.8;
const isId = (v) => mongoose.isValidObjectId(v);

// ---------- content: load + validate JSON files ----------
function validate(m) {
  const errors = [], warnings = [];
  if (!m.slug || !m.title) errors.push('slug and title are required');
  if (!Array.isArray(m.chapters) || !m.chapters.length) { errors.push('needs at least one chapter'); return { errors, warnings }; }

  const seen = new Set();
  const uniq = (id, where) => {
    if (!id) errors.push(`${where}: missing id`);
    else if (seen.has(id)) errors.push(`${where}: duplicate id "${id}"`);
    else seen.add(id);
  };
  const checkQ = (q, where) => {
    uniq(q.id, where);
    if (!q.q) errors.push(`${where}: missing question text`);
    if (!Array.isArray(q.options) || q.options.length < 2) errors.push(`${where}: needs 2+ options`);
    else if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) errors.push(`${where}: "answer" must be an index into options`);
    if (!q.explanation) warnings.push(`${where}: no explanation`);
  };

  m.chapters.forEach((c) => {
    uniq(c.id, `chapter "${c.title}"`);
    (c.subchapters || []).forEach((s) => {
      uniq(s.id, `lesson "${s.title}"`);
      if (!s.body) errors.push(`lesson ${s.id}: missing body`);
      const n = (s.questions || []).length;
      if (n < 1 || n > 2) warnings.push(`lesson ${s.id}: has ${n} questions (expected 1-2)`);
      (s.questions || []).forEach((q) => checkQ(q, `lesson ${s.id} question`));
    });
    if (!(c.subchapters || []).length) errors.push(`chapter ${c.id}: no lessons`);
    const n = (c.quiz || []).length;
    if (n !== 5) warnings.push(`chapter ${c.id}: quiz has ${n} questions (expected 5)`);
    (c.quiz || []).forEach((q) => checkQ(q, `chapter ${c.id} quiz question`));
  });
  return { errors, warnings };
}

function loadModules() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const out = [];
  for (const file of fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.json'))) {
    try {
      const m = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8'));
      const { errors, warnings } = validate(m);
      warnings.forEach((w) => console.warn(`[learning] ${file}: ${w}`));
      if (errors.length) { errors.forEach((e) => console.error(`[learning] ${file}: ${e}`)); console.error(`[learning] skipping ${file}`); continue; }
      out.push(m);
    } catch (e) {
      console.error(`[learning] could not read ${file}: ${e.message}`);
    }
  }
  return out.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

const MODULES = loadModules();
const BY_SLUG = new Map(MODULES.map((m) => [m.slug, m]));
console.log(`[learning] ${MODULES.length} module(s) loaded`);

const lessonsOf = (m) => m.chapters.flatMap((c) => c.subchapters);
const stripQ = (q) => ({ id: q.id, q: q.q, options: q.options }); // never send answers to the browser
const publicModule = (m) => ({
  ...m,
  chapters: m.chapters.map((c) => ({
    ...c,
    subchapters: c.subchapters.map((s) => ({ ...s, minutes: s.minutes || 2, questions: (s.questions || []).map(stripQ) })),
    quiz: (c.quiz || []).map(stripQ)
  }))
});

// ---------- progress maths ----------
function summarize(m, doc) {
  const lessons = lessonsOf(m);
  const lessonIds = new Set(lessons.map((l) => l.id));
  const chapterIds = new Set(m.chapters.map((c) => c.id));
  const doneLessons = (doc?.lessons || []).filter((l) => lessonIds.has(l.subId));
  const doneQuizzes = (doc?.quizzes || []).filter((q) => chapterIds.has(q.chapterId) && q.attempts > 0);
  const lessonSet = new Set(doneLessons.map((l) => l.subId));
  const quizSet = new Set(doneQuizzes.map((q) => q.chapterId));

  const total = lessons.length + m.chapters.length;
  const done = doneLessons.length + doneQuizzes.length;
  const minutesLeft =
    lessons.filter((l) => !lessonSet.has(l.id)).reduce((a, l) => a + (l.minutes || 2), 0) +
    m.chapters.filter((c) => !quizSet.has(c.id)).length * QUIZ_MINUTES;

  let answered = 0, correct = 0;
  doneLessons.forEach((l) => { answered += l.total || 0; correct += l.correct || 0; });
  doneQuizzes.forEach((q) => { answered += q.total || 0; correct += q.last || 0; });

  let nextUp = null;
  for (const c of m.chapters) {
    const l = c.subchapters.find((s) => !lessonSet.has(s.id));
    if (l) { nextUp = { kind: 'lesson', chapterId: c.id, id: l.id, title: l.title }; break; }
    if (!quizSet.has(c.id)) { nextUp = { kind: 'quiz', chapterId: c.id, id: c.id, title: `${c.title}: chapter quiz` }; break; }
  }

  return {
    percent: total ? Math.round((done / total) * 100) : 0,
    done, total, answered, correct, minutesLeft, nextUp,
    lessonsDone: doneLessons.length, lessonsTotal: lessons.length,
    quizzesDone: doneQuizzes.length, quizzesTotal: m.chapters.length,
    lessonSet, quizSet
  };
}

function moduleProgress(m, doc) {
  const { lessonSet, quizSet, done, total, answered, correct, ...rest } = summarize(m, doc);
  return {
    ...rest,
    completedLessons: [...lessonSet],
    lessonResults: Object.fromEntries((doc?.lessons || []).map((l) => [l.subId, { correct: l.correct, total: l.total }])),
    quizResults: Object.fromEntries((doc?.quizzes || []).map((q) => [q.chapterId, { best: q.best, last: q.last, total: q.total, attempts: q.attempts }]))
  };
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const dayOrToday = (d) => (DAY_RE.test(d || '') ? d : new Date().toISOString().slice(0, 10));

function streakOf(days, today) {
  const set = new Set(days);
  const DAY = 86400000;
  let t = Date.parse(`${today}T00:00:00Z`);
  if (!set.has(today)) t -= DAY; // streak stays alive until the end of today
  let n = 0;
  while (set.has(new Date(t).toISOString().slice(0, 10))) { n++; t -= DAY; }
  return n;
}

// ---------- routes ----------
module.exports = function registerLearning(app) {
  const r = express.Router();

  r.get('/overview', async (req, res) => {
    try {
      const { parentId } = req.query;
      if (!isId(parentId)) return res.status(400).json({ error: 'Valid parentId required' });
      const docs = await LearningProgress.find({ parentId }).lean();
      const byModule = new Map(docs.map((d) => [d.moduleSlug, d]));

      let done = 0, total = 0, answered = 0, correct = 0, lessonsDone = 0, lessonsTotal = 0, quizzesDone = 0, quizzesTotal = 0, minutesLeft = 0;
      const modules = MODULES.map((m) => {
        const doc = byModule.get(m.slug);
        const s = summarize(m, doc);
        done += s.done; total += s.total; answered += s.answered; correct += s.correct;
        lessonsDone += s.lessonsDone; lessonsTotal += s.lessonsTotal;
        quizzesDone += s.quizzesDone; quizzesTotal += s.quizzesTotal; minutesLeft += s.minutesLeft;
        return {
          slug: m.slug, title: m.title, level: m.level, summary: m.summary,
          percent: s.percent, minutesLeft: s.minutesLeft, nextUp: s.nextUp,
          status: s.percent === 0 && !doc ? 'not_started' : s.percent >= 100 ? 'completed' : 'in_progress',
          lastActiveAt: doc?.lastActiveAt || null
        };
      });

      const candidates = modules.filter((m) => m.nextUp);
      const active = candidates.filter((m) => m.status === 'in_progress').sort((a, b) => new Date(b.lastActiveAt) - new Date(a.lastActiveAt));
      const pick = active[0] || candidates[0];

      res.json({
        modules,
        continue: pick ? { moduleSlug: pick.slug, moduleTitle: pick.title, ...pick.nextUp } : null,
        stats: {
          percent: total ? Math.round((done / total) * 100) : 0,
          lessonsDone, lessonsTotal, quizzesDone, quizzesTotal, minutesLeft,
          accuracy: answered ? Math.round((correct / answered) * 100) : null,
          streak: streakOf(docs.flatMap((d) => d.activityDays || []), dayOrToday(req.query.day))
        }
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  r.get('/modules/:slug', async (req, res) => {
    try {
      const m = BY_SLUG.get(req.params.slug);
      if (!m) return res.status(404).json({ error: 'Module not found' });
      if (!isId(req.query.parentId)) return res.status(400).json({ error: 'Valid parentId required' });
      const doc = await LearningProgress.findOne({ parentId: req.query.parentId, moduleSlug: m.slug }).lean();
      res.json({ module: publicModule(m), progress: moduleProgress(m, doc) });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // scope: 'lesson' (1-2 questions after a lesson) or 'quiz' (5 questions at the end of a chapter)
  r.post('/modules/:slug/submit', async (req, res) => {
    try {
      const m = BY_SLUG.get(req.params.slug);
      if (!m) return res.status(404).json({ error: 'Module not found' });
      const { parentId, scope, targetId, answers = {}, day } = req.body;
      if (!isId(parentId)) return res.status(400).json({ error: 'Valid parentId required' });

      let doc = await LearningProgress.findOne({ parentId, moduleSlug: m.slug });
      if (!doc) doc = new LearningProgress({ parentId, moduleSlug: m.slug });

      let questions;
      if (scope === 'lesson') {
        const lesson = lessonsOf(m).find((l) => l.id === targetId);
        if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
        questions = lesson.questions || [];
      } else if (scope === 'quiz') {
        const chapter = m.chapters.find((c) => c.id === targetId);
        if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
        const done = new Set(doc.lessons.map((l) => l.subId));
        if (!chapter.subchapters.every((s) => done.has(s.id))) return res.status(409).json({ error: 'Finish the lessons in this chapter first' });
        questions = chapter.quiz || [];
      } else {
        return res.status(400).json({ error: "scope must be 'lesson' or 'quiz'" });
      }

      if (questions.some((q) => !Number.isInteger(answers[q.id]))) return res.status(400).json({ error: 'Please answer every question' });

      const results = questions.map((q) => ({
        id: q.id, choice: answers[q.id], correct: answers[q.id] === q.answer,
        correctIndex: q.answer, explanation: q.explanation || ''
      }));
      const correct = results.filter((x) => x.correct).length;
      const total = results.length;
      const now = new Date();

      if (scope === 'lesson') {
        const entry = doc.lessons.find((l) => l.subId === targetId);
        if (entry) Object.assign(entry, { correct, total, completedAt: now });
        else doc.lessons.push({ subId: targetId, correct, total, completedAt: now });
      } else {
        const entry = doc.quizzes.find((q) => q.chapterId === targetId);
        if (entry) Object.assign(entry, { best: Math.max(entry.best || 0, correct), last: correct, total, attempts: (entry.attempts || 0) + 1, lastAt: now });
        else doc.quizzes.push({ chapterId: targetId, best: correct, last: correct, total, attempts: 1, lastAt: now });
      }

      const today = dayOrToday(day);
      if (!doc.activityDays.includes(today)) doc.activityDays.push(today);
      doc.lastActiveAt = now;
      await doc.save();

      res.json({
        results, correct, total,
        mastered: scope === 'quiz' && total > 0 && correct / total >= MASTERY,
        progress: moduleProgress(m, doc)
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.use('/api/learning', r);
};