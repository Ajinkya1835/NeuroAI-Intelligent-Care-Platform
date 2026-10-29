// Seed data for NeuroAI.
//
//  * The server calls runSeed() on every start (AUTO_SEED=false turns that off).
//  * It is IDEMPOTENT and NON-DESTRUCTIVE: it only creates what is missing, and never
//    overwrites or deletes anything a user has entered. Restarting keeps all data.
//  * `npm run seed -- --reset` (alias --force) wipes every collection and reseeds.
//
// Everything is derived from a single story so the numbers agree across screens:
//   Somik (6) -> episodes get milder over 30 days -> routines + 7-day logs -> worksheet
//   attempts create Progress + Milestone rows -> Goals read their score from Progress
//   -> parent lessons (Goon) are stored in LearningProgress using the real content ids.
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const M = require('./models');

const ACCOUNTS = {
  parent: { name: 'Goon Sharma', email: 'goon@example.com', role: 'parent' },
  therapist: { name: 'Dr. Ajinkya', email: 'dr.ajinkya@neurocare.com', role: 'therapist' }
};

// ---------- helpers ----------
const at = (daysAgo, h, m = 0) => {
  const t = new Date();
  t.setDate(t.getDate() - daysAgo);
  t.setHours(h, m, 0, 0);
  return t;
};
const dayKey = (d) => d.toISOString().slice(0, 10);
const readJson = (...p) => {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, ...p), 'utf8')); } catch { return null; }
};
const log = (...a) => console.log('[seed]', ...a);

// create docs only when the child has none of that kind yet
async function ensureForChild(Model, childId, docsFn, label) {
  if (await Model.countDocuments({ childId })) return 0;
  const docs = await docsFn();
  if (!docs.length) return 0;
  await Model.create(docs);
  log(`+ ${docs.length} ${label}`);
  return docs.length;
}

async function wipeAll() {
  await Promise.all(Object.values(M).map((model) => model.deleteMany({})));
  log('all collections cleared');
}

async function ensureUsers() {
  const password = process.env.SEED_PASSWORD || 'password123';
  const out = {};
  for (const [key, acc] of Object.entries(ACCOUNTS)) {
    let user = await M.User.findOne({ email: acc.email });
    if (!user) {
      user = await M.User.create({ ...acc, passwordHash: await bcrypt.hash(password, 10) });
      log(`+ user ${acc.email} (${acc.role})`);
    } else if (!user.passwordHash) {
      user.passwordHash = await bcrypt.hash(password, 10);
      await user.save();
    }
    out[key] = user;
  }
  return out;
}

async function ensureChild(parent, therapist) {
  let child = await M.Child.findOne({ parentId: parent._id, name: 'Somik Sharma' });
  if (!child) {
    child = await M.Child.create({
      parentId: parent._id,
      name: 'Somik Sharma',
      dob: new Date('2020-03-14T00:00:00Z'),
      interests: ['Trains', 'Colouring', 'Water play', 'Puzzles'],
      notes: 'Responds well to visual schedules and advance warning before transitions. Prefers quiet spaces at lunch.',
      primaryTriggers: ['Loud Noise / Crowds', 'Separation Anxiety', 'Routine Interruption'],
      calmingStrategies: ['Weighted Blanket', 'Noise Canceling Headphones', 'Deep Breathing'],
      grants: [therapist._id]
    });
    log('+ child Somik Sharma');
  } else if (!(child.grants || []).some((g) => String(g) === String(therapist._id))) {
    child.grants.push(therapist._id); // the therapist must always be linked to the child
    await child.save();
    log('+ therapist access granted to existing child');
  }
  return child;
}

// ---------- per-child data ----------
function episodeDocs(childId) {
  // Trigger / location / intervention names match the child's profile and the frontend
  // option lists, so the Patterns charts group correctly.
  const T = { noise: 'Loud Noise / Crowds', sep: 'Separation Anxiety', routine: 'Routine Interruption' };
  const HP = 'Noise Canceling Headphones';
  // [daysAgo, hour, min, intensity, trigger, activity, location, minutes, behaviors, interventions]
  const rows = [
    [29, 13, 40, 5, T.noise, 'Cafeteria Lunch', 'School Cafeteria', 35, ['Covering ears', 'Screaming'], ['Quiet Room']],
    [27, 8, 30, 4, T.sep, 'Morning Drop-off', 'School Entrance', 25, ['Crying'], ['Favorite Toy']],
    [24, 10, 15, 3, T.routine, 'Transition to Math Class', 'Classroom', 15, ['Rocking'], ['Deep Breathing']],
    [21, 13, 35, 5, T.noise, 'Cafeteria Lunch', 'School Cafeteria', 30, ['Covering ears', 'Shutting down'], ['Quiet Room']],
    [18, 17, 20, 3, T.routine, 'Dinner time changed', 'Home', 15, ['Crying'], ['Weighted Blanket']],
    [15, 8, 30, 4, T.sep, 'Morning Drop-off', 'School Entrance', 20, ['Crying', 'Running away'], ['Favorite Toy']],
    [12, 13, 30, 4, T.noise, 'Cafeteria Lunch', 'School Cafeteria', 25, ['Covering ears', 'Screaming'], [HP, 'Quiet Room']],
    [9, 11, 0, 3, T.noise, 'Assembly', 'School Hall', 15, ['Covering ears'], [HP]],
    [7, 10, 15, 2, T.routine, 'Transition to Art Class', 'Classroom', 10, ['Rocking'], ['Deep Breathing']],
    [5, 13, 30, 4, T.noise, 'Cafeteria Lunch', 'School Cafeteria', 20, ['Covering ears', 'Screaming'], [HP]],
    [3, 10, 15, 2, T.routine, 'Transition to Math Class', 'Classroom', 10, ['Rocking'], ['Deep Breathing']],
    [2, 13, 45, 3, T.noise, 'Cafeteria Lunch', 'School Cafeteria', 12, ['Covering ears'], [HP, 'Quiet Room']],
    [1, 8, 30, 2, T.sep, 'Morning Drop-off', 'School Entrance', 8, ['Crying'], ['Favorite Toy']]
  ];
  return rows.map(([d, h, m, intensity, trigger, activity, location, mins, behaviors, calmingInterventions]) => ({
    childId, ts: at(d, h, m), intensity, trigger, activity, location,
    sensoryEnvironment: trigger === T.noise ? 'Loud' : 'Normal',
    sleepHours: intensity >= 4 ? 6 : 8,
    hungerLevel: h >= 13 ? 'Hungry' : 'Normal',
    durationMinutes: mins, recoveryMinutes: Math.round(mins * 0.8),
    behaviors, calmingInterventions,
    response: calmingInterventions[0] === 'Quiet Room' ? 'Moved to a quiet room' : 'Offered calming tool and stayed close',
    postEpisodeBehavior: 'Calm but tired'
  }));
}

const ROUTINES = [
  { title: 'Morning Visual Schedule', category: 'Morning', scheduleTime: '07:30' },
  { title: 'Wear Sensory Headphones at Recess', category: 'School', scheduleTime: '11:00' },
  { title: 'Calm-down Corner After School', category: 'School', scheduleTime: '15:30' },
  { title: '5-Min Quiet Time Before Dinner', category: 'Evening', scheduleTime: '18:30' },
  { title: 'Bedtime Story & Weighted Blanket', category: 'Night', scheduleTime: '20:00' }
];

// Today's routine.completed flag comes from the same table as the 7-day log, so they agree.
async function routineDocs(childId) {
  // status for each of the last 7 days (index 0 = today); evening items are still pending today
  const patterns = [
    ['completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed'],
    ['completed', 'completed', 'completed', 'skipped', 'completed', 'completed', 'completed'],
    ['completed', 'completed', 'skipped', 'completed', 'completed', 'completed', 'skipped'],
    ['pending', 'completed', 'skipped', 'completed', 'completed', 'skipped', 'completed'],
    ['pending', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed']
  ];
  const created = await M.Routine.create(
    ROUTINES.map((r, i) => ({ ...r, childId, completed: patterns[i][0] === 'completed' }))
  );
  const logs = [];
  created.forEach((routine, i) => patterns[i].forEach((status, d) => {
    logs.push({ routineId: routine._id, date: dayKey(at(d, 12)), status });
  }));
  await M.RoutineLog.create(logs);
  log(`+ ${created.length} routines, ${logs.length} routine logs`);
}

// worksheet attempts: [daysAgo, worksheetId, marks per item (0/1/2), engagement, minutes, notes]
const ATTEMPTS = [
  [12, 'colors', [1, 1, 2], 3, 12, 'Needed prompts for blue and green. Lost focus after 8 minutes.'],
  [10, 'colors', [2, 2, 1], 4, 9, 'Much better. Named all colors, one hint for green.'],
  [8, 'shapes', [1, 1, 2], 3, 10, 'Circle and square easy, triangle needs practice.'],
  [5, 'numbers-1-5', [2, 2, 2, 1, 1], 4, 14, 'Counted to 3 independently. Wanted to line up toy trains.'],
  [3, 'shapes', [2, 1, 2], 4, 8, 'Improving. Matched all three shapes with one prompt.'],
  [2, 'my-feelings', [1, 1, 0], 3, 11, 'Happy and sad are clear. Used feelings cards to point.'],
  [1, 'numbers-1-5', [2, 2, 2, 2, 1], 5, 10, 'Really enjoyed this one. Counted the trains aloud.']
];

async function teachingAndProgress(child) {
  const mod = readJson('content', 'teaching', 'early-learning-foundations.json');
  if (!mod) { log('teaching content not found, skipping worksheet attempts'); return; }
  const sheets = new Map(mod.chapters.flatMap((c) => c.worksheets).map((w) => [w.id, w]));
  const mastered = new Set();
  let made = 0;

  for (const [daysAgo, wid, levels, engagement, minutes, notes] of ATTEMPTS) {
    const w = sheets.get(wid);
    if (!w || w.items.length !== levels.length) { log(`skip attempt for "${wid}" (content changed)`); continue; }
    const marks = w.items.map((item, i) => ({ itemId: item.id, level: levels[i] }));
    const score = levels.reduce((a, b) => a + b, 0);
    const max = levels.length * 2;
    const percent = Math.round((score / max) * 100);
    const ts = at(daysAgo, 17, 30);

    const progress = await M.Progress.create({
      childId: child._id, ts, area: w.area, score: percent, obs: `Worksheet "${w.title}": ${score}/${max}`
    });
    let milestoneId;
    if (percent >= 80 && !mastered.has(wid)) {
      mastered.add(wid);
      milestoneId = (await M.Milestone.create({ childId: child._id, ts, title: `Mastered worksheet: ${w.title}` }))._id;
    }
    await M.TeachingSubmission.create({
      childId: child._id, parentId: child.parentId, moduleSlug: mod.slug, worksheetId: wid, ts, day: dayKey(ts),
      score, max, percent, area: w.area, engagement, minutes, notes, marks,
      progressId: progress._id, milestoneId
    });
    made++;
  }
  if (made) log(`+ ${made} worksheet attempts (with linked progress + milestones)`);
}

async function learningProgress(parent) {
  const mod = readJson('content', 'learning', 'understanding-autism.json');
  if (!mod) return;
  if (await M.LearningProgress.countDocuments({ parentId: parent._id, moduleSlug: mod.slug })) return;

  const lessons = [], quizzes = [], days = new Set();
  const stamp = (daysAgo) => { const t = at(daysAgo, 21, 15); days.add(dayKey(t)); return t; };

  mod.chapters.forEach((chapter, ci) => {
    // chapter 1 fully done, chapter 2 half-way, the rest untouched
    const upTo = ci === 0 ? chapter.subchapters.length : ci === 1 ? 2 : 0;
    chapter.subchapters.slice(0, upTo).forEach((lesson, li) => {
      const total = (lesson.questions || []).length;
      lessons.push({
        subId: lesson.id, total,
        correct: total > 1 && li === 2 ? total - 1 : total,
        completedAt: stamp(Math.max(2, 9 - ci * 3 - li))
      });
    });
    if (ci === 0) {
      const total = (chapter.quiz || []).length;
      const score = Math.max(0, total - 1);
      quizzes.push({ chapterId: chapter.id, total, attempts: 2, best: score, last: score, lastAt: stamp(6) });
    }
  });
  stamp(1); stamp(0); // streak: active yesterday and today
  await M.LearningProgress.create({
    parentId: parent._id, moduleSlug: mod.slug, lessons, quizzes,
    activityDays: [...days].sort(), lastActiveAt: at(0, 9)
  });
  log(`+ learning progress for ${parent.name} (${lessons.length} lessons, ${quizzes.length} chapter quiz)`);
}

const ACTIVITIES = [
  { title: 'Bubble Breathing', category: 'Regulation', description: 'Slow breaths while blowing bubbles.', minAge: 3, maxAge: 10, tags: ['calming'], minutes: 5, materials: ["Bubble wand and solution"], steps: ["Sit side by side", "Show one slow breath in", "Blow one long bubble out", "Count bubbles together, five times"] },
  { title: 'Sort by Color', category: 'Focus', description: 'Sort small objects by color into cups.', minAge: 3, maxAge: 8, tags: ['focus'], minutes: 8, materials: ["Small cups", "Colored blocks or buttons"], steps: ["Start with only two colors", "Name the color as you place each item", "Add a third color when two feel easy"] },
  { title: 'Quiet Reading Nook', category: 'Sensory', description: 'Build a low-stimulation corner with cushions and soft light.', minAge: 4, maxAge: 12, tags: ['sensory'], minutes: 15, materials: ["Cushions", "Soft lamp", "Two favorite books"], steps: ["Build the nook together", "Dim other lights", "Read one short book, then stop on a good note"] },
  { title: 'Train Track Counting', category: 'Early Math', description: 'Count wooden train carriages together, 1 to 5.', minAge: 4, maxAge: 8, tags: ['focus', 'interests'], minutes: 10, materials: ["Wooden train carriages"], steps: ["Line up carriages", "Point and count 1 to 5 together", "Let your child push the train after each count"] },
  { title: 'Water Play Calm-down', category: 'Sensory', description: 'Warm water, cups and funnels in a quiet space.', minAge: 3, maxAge: 9, tags: ['sensory', 'calming'], minutes: 15, materials: ["Basin", "Warm water", "Cups and funnels"], steps: ["Fill the basin with warm water", "Pour slowly together", "Keep the room quiet, few words"] },
  { title: 'Feelings Cards', category: 'Emotions', description: "Match face cards to how we feel and point to today's feeling.", minAge: 4, maxAge: 9, tags: ['emotions'], minutes: 10, materials: ["Printed face cards"], steps: ["Lay out 3 faces: happy, sad, upset", "Ask them to point to today's feeling", "Name it back, no follow-up questions"] }
];

async function activities(child) {
  for (const a of ACTIVITIES) {
    const { minutes, materials, steps, ...base } = a;
    await M.Activity.updateOne({ title: a.title }, { $setOnInsert: base, $set: { minutes, materials, steps } }, { upsert: true });
  }
  if (await M.ActivityFeedback.countDocuments({ childId: child._id })) return;
  const byTitle = Object.fromEntries((await M.Activity.find({ title: { $in: ACTIVITIES.map((a) => a.title) } })).map((a) => [a.title, a]));
  const fb = [
    ['Bubble Breathing', 'Completed', 'Loved the bubbles, calmer afterwards.', 6],
    ['Quiet Reading Nook', 'Completed', 'Stayed 15 minutes.', 4],
    ['Sort by Color', 'Too Difficult', 'Too many colors at once, try 2-3.', 3],
    ['Train Track Counting', 'Completed', 'Counted to 5 with one prompt.', 1]
  ].filter(([t]) => byTitle[t]).map(([t, rating, notes, d]) => ({
    activityId: byTitle[t]._id, childId: child._id, rating, notes, ts: at(d, 16)
  }));
  await M.ActivityFeedback.create(fb);
  log(`+ ${fb.length} activity feedback entries`);
}

async function seedChildData(child, parent, therapist) {
  await ensureForChild(M.Episode, child._id, async () => episodeDocs(child._id), 'episodes');

  if (!(await M.Routine.countDocuments({ childId: child._id }))) await routineDocs(child._id);

  await ensureForChild(M.Contact, child._id, async () => [
    { childId: child._id, name: therapist.name, role: 'Therapist', email: therapist.email, phone: '+91 98765 43210' },
    { childId: child._id, name: 'Mrs. Kulkarni', role: 'Class Teacher', email: 'teacher@sunrise-school.example', phone: '+91 98200 11122' },
    { childId: child._id, name: 'Dr. Mehta', role: 'Pediatrician', email: 'clinic@mehta-kids.example', phone: '+91 98200 33344' },
    { childId: child._id, name: parent.name, role: 'Parent', email: parent.email, phone: '+91 98765 00011' }
  ], 'contacts');

  await ensureForChild(M.Note, child._id, async () => [
    { childId: child._id, author: therapist.name, authorRole: 'Therapist', ts: at(8, 18), text: 'Headphones are being accepted during noisy transitions. Continue sensory breaks before 2:00 PM.' },
    { childId: child._id, author: parent.name, authorRole: 'Parent', ts: at(4, 19), text: 'Cafeteria is still the hardest part of the day. Teacher agreed to let Somik eat in the quiet room twice a week.' },
    { childId: child._id, author: therapist.name, authorRole: 'Therapist', ts: at(1, 18, 30), text: 'Episodes are shorter and milder this week (avg intensity down from 4 to 2.5). Keep the visual schedule at drop-off.' }
  ], 'notes');

  // goals have no stored score: the API derives "current" from the latest Progress in the same area
  await ensureForChild(M.Goal, child._id, async () => [
    // `area` must equal a worksheet area ("Shapes", "Early Math", "Emotions"...) or "Sensory Regulation"
    { childId: child._id, area: 'Shapes', title: 'Match and name circle, square and triangle', targetScore: 80 },
    { childId: child._id, area: 'Early Math', title: 'Count objects from 1 to 5 independently', targetScore: 80 },
    { childId: child._id, area: 'Emotions', title: 'Name 4 basic feelings using cards', targetScore: 75 },
    { childId: child._id, area: 'Sensory Regulation', title: 'Use headphones or quiet room without prompting', targetScore: 80 }
  ], 'goals');

  // therapist-assessed progress (worksheet progress is created by teachingAndProgress)
  if (!(await M.Progress.countDocuments({ childId: child._id, obs: /^Therapist/ }))) {
    await M.Progress.create([
      { childId: child._id, ts: at(20, 18), area: 'Sensory Regulation', score: 40, obs: 'Therapist review: needs prompts to use headphones.' },
      { childId: child._id, ts: at(10, 18), area: 'Sensory Regulation', score: 55, obs: 'Therapist review: uses headphones with one reminder.' },
      { childId: child._id, ts: at(2, 18), area: 'Sensory Regulation', score: 70, obs: 'Therapist review: reaches for headphones when cafeteria gets loud.' }
    ]);
    const cue = 'Used visual cue to transition without support';
    if (!(await M.Milestone.exists({ childId: child._id, title: cue }))) {
      await M.Milestone.create({ childId: child._id, ts: at(6, 12), title: cue });
    }
    log('+ therapist progress reviews + milestone');
  }

  if (!(await M.TeachingSubmission.countDocuments({ childId: child._id }))) await teachingAndProgress(child);
  await activities(child);
}

// ---------- public ----------
async function runSeed({ reset = false } = {}) {
  if (reset) await wipeAll();
  const { parent, therapist } = await ensureUsers();
  const child = await ensureChild(parent, therapist);
  await seedChildData(child, parent, therapist);
  await learningProgress(parent);
  log(`ready. Logins: ${ACCOUNTS.parent.email} (parent), ${ACCOUNTS.therapist.email} (therapist)`);
  return { parentId: String(parent._id), therapistId: String(therapist._id), childId: String(child._id) };
}

module.exports = { runSeed, ACCOUNTS };

if (require.main === module) {
  const reset = process.argv.includes('--reset') || process.argv.includes('--force');
  mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/neuroai')
    .then(() => runSeed({ reset }))
    .then((ids) => { console.log(ids); return mongoose.disconnect(); })
    .catch((err) => { console.error('Seeding error:', err); process.exit(1); });
}
