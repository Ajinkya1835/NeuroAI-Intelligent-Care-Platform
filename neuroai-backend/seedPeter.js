// Dummy data for "Peter Parker" - same shapes, enums and option lists as seed.js / models.js.
//
// Run from neuroai-backend:   node seedPeter.js            (idempotent, only creates what is missing)
//                             node seedPeter.js --reset-peter   (deletes Peter's data first, then reseeds)
// Or from seed.js:            const { seedPeter } = require('./seedPeter'); await seedPeter();
//
// Story (numbers agree across screens): Peter (7) is most affected by loud/crowded spaces, bright
// lights and mealtime changes. Episodes get shorter and milder over 30 days, worksheets create
// Progress + Milestone rows, Goals read their score from Progress.
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const M = require('./models');

const PARENT = { name: 'May Parker', email: 'may.parker@example.com', role: 'parent' };
const THERAPIST = { name: 'Dr. Ajinkya', email: 'dr.ajinkya@neurocare.com', role: 'therapist' };
const CHILD_NAME = 'Peter Parker';

const at = (daysAgo, h, m = 0) => { const t = new Date(); t.setDate(t.getDate() - daysAgo); t.setHours(h, m, 0, 0); return t; };
const dayKey = (d) => d.toISOString().slice(0, 10);
const readJson = (...p) => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, ...p), 'utf8')); } catch { return null; } };
const log = (...a) => console.log('[seed-peter]', ...a);

async function ensureUser(acc) {
  let u = await M.User.findOne({ email: acc.email });
  if (!u) {
    u = await M.User.create({ ...acc, passwordHash: await bcrypt.hash(process.env.SEED_PASSWORD || 'password123', 10) });
    log(`+ user ${acc.email} (${acc.role})`);
  }
  return u;
}

async function ensureChild(parent, therapist) {
  let child = await M.Child.findOne({ parentId: parent._id, name: CHILD_NAME });
  if (!child) {
    child = await M.Child.create({
      parentId: parent._id,
      name: CHILD_NAME,
      dob: new Date('2019-06-21T00:00:00Z'),
      interests: ['Spiders & insects', 'Building blocks', 'Drawing comics', 'Science experiments'],
      notes: 'Very curious and visual. Does best with a picture schedule and a 5-minute warning before transitions. Sensitive to sudden loud sounds and flickering lights. Likes to eat lunch in a quieter space.',
      primaryTriggers: ['Loud Noise / Crowds', 'Bright / Flickering Lights', 'Routine Interruption', 'Mealtime Changes'],
      calmingStrategies: ['Noise Canceling Headphones', 'Deep Pressure Hug', 'Quiet Room', 'Favorite Toy'],
      grants: [therapist._id]
    });
    log(`+ child ${CHILD_NAME}`);
  } else if (!(child.grants || []).some((g) => String(g) === String(therapist._id))) {
    child.grants.push(therapist._id); await child.save();
  }
  return child;
}

function episodeDocs(childId) {
  const T = { noise: 'Loud Noise / Crowds', light: 'Bright / Flickering Lights', routine: 'Routine Interruption', meal: 'Mealtime Changes' };
  const HP = 'Noise Canceling Headphones', QR = 'Quiet Room', HUG = 'Deep Pressure Hug', TOY = 'Favorite Toy', BR = 'Deep Breathing', WB = 'Weighted Blanket';
  // [daysAgo, hour, min, intensity, trigger, activity, location, env, sleep, hunger, minutes, behaviors, interventions, response, after, notes]
  const rows = [
    [29, 12, 50, 5, T.noise, 'Cafeteria Lunch', 'School Cafeteria', 'Crowded', 6, 'Hungry', 40, ['Covering ears', 'Screaming', 'Running away'], [QR, HUG], 'Teacher guided him to the quiet room and stayed close', 'Exhausted, slept in class', 'Fire drill practice ran just before lunch.'],
    [27, 9, 30, 4, T.light, 'Science Lab', 'School Lab', 'Loud', 6, 'Normal', 28, ['Covering ears', 'Crying'], [HP, QR], 'Lights dimmed, headphones offered', 'Calm but tired', 'Flickering tube light in the lab.'],
    [25, 17, 45, 3, T.meal, 'Dinner changed to a new dish', 'Home', 'Normal', 7, 'Hungry', 20, ['Crying', 'Shutting down'], [HUG, TOY], 'Parent sat with him and offered the usual meal', 'Calm and hungry', ''],
    [23, 8, 40, 4, T.routine, 'Bus route changed (substitute driver)', 'School Bus', 'Loud', 6, 'Normal', 25, ['Crying', 'Hitting'], [HP, BR], 'Explained the change with a picture card', 'Quiet for an hour', ''],
    [21, 13, 5, 5, T.noise, 'Birthday party in class', 'Classroom', 'Crowded', 6, 'Hungry', 35, ['Covering ears', 'Screaming', 'Shutting down'], [QR, HP], 'Moved to the quiet room with headphones', 'Tired, wanted to be alone', 'Balloons popped suddenly.'],
    [19, 15, 30, 3, T.routine, 'Homework time moved earlier', 'Home', 'Normal', 8, 'Normal', 15, ['Rocking'], [BR, TOY], 'Showed the updated visual schedule', 'Calm', ''],
    [17, 11, 20, 4, T.light, 'Mall visit', 'Shopping Mall', 'Crowded', 7, 'Normal', 22, ['Covering ears', 'Running away'], [HP, HUG], 'Left the store and sat in a quiet corner', 'Calm but tired', 'Bright LED displays and crowd.'],
    [15, 12, 45, 4, T.noise, 'Cafeteria Lunch', 'School Cafeteria', 'Loud', 6, 'Hungry', 22, ['Covering ears', 'Screaming'], [HP, QR], 'Wore headphones, moved to a quiet table', 'Calm but tired', ''],
    [12, 18, 0, 3, T.meal, 'Late dinner', 'Home', 'Normal', 8, 'Hungry', 15, ['Crying'], [HUG, TOY], 'Offered a snack and a hug', 'Calm', ''],
    [10, 9, 15, 3, T.routine, 'Assembly schedule change', 'School Hall', 'Loud', 8, 'Normal', 14, ['Covering ears', 'Rocking'], [HP], 'Put headphones on himself after one reminder', 'Calm', ''],
    [8, 12, 55, 3, T.noise, 'Cafeteria Lunch', 'School Cafeteria', 'Loud', 8, 'Hungry', 12, ['Covering ears'], [HP, QR], 'Went to the quiet table with headphones', 'Calm', ''],
    [6, 16, 10, 2, T.light, 'Visit to relatives', 'Relative\'s House', 'Normal', 8, 'Normal', 9, ['Covering ears'], [HP], 'Dimmed the lights, used headphones', 'Calm', ''],
    [4, 8, 35, 2, T.routine, 'Morning Drop-off', 'School Entrance', 'Normal', 8, 'Normal', 8, ['Crying'], [TOY, BR], 'Used the picture schedule at drop-off', 'Calm', ''],
    [2, 12, 50, 2, T.noise, 'Cafeteria Lunch', 'School Cafeteria', 'Loud', 8, 'Normal', 7, ['Covering ears'], [HP], 'Asked for his headphones without prompting', 'Calm and cheerful', 'First time he asked on his own.'],
    [1, 19, 30, 1, T.meal, 'New cereal at breakfast', 'Home', 'Quiet', 9, 'Full', 5, ['Crying'], [BR], 'Offered the usual cereal and he settled', 'Calm', '']
  ];
  return rows.map(([d, h, m, intensity, trigger, activity, location, sensoryEnvironment, sleepHours, hungerLevel, mins, behaviors, calmingInterventions, response, postEpisodeBehavior, notes]) => ({
    childId, ts: at(d, h, m), intensity, trigger, activity, location, sensoryEnvironment, sleepHours, hungerLevel,
    durationMinutes: mins, recoveryMinutes: Math.round(mins * 0.8), behaviors, calmingInterventions, response, postEpisodeBehavior, notes
  }));
}

const ROUTINES = [
  { title: 'Morning Picture Schedule', category: 'Morning', scheduleTime: '07:15' },
  { title: 'Wear Headphones in Cafeteria', category: 'School', scheduleTime: '12:30' },
  { title: 'Quiet Time After School', category: 'School', scheduleTime: '15:30' },
  { title: 'Drawing Break Before Dinner', category: 'Evening', scheduleTime: '18:00' },
  { title: 'Bedtime Story & Deep Pressure Hug', category: 'Night', scheduleTime: '20:00' }
];

async function routineDocs(childId) {
  const patterns = [ // index 0 = today
    ['completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed'],
    ['completed', 'completed', 'skipped', 'completed', 'completed', 'completed', 'completed'],
    ['completed', 'completed', 'completed', 'skipped', 'completed', 'completed', 'skipped'],
    ['pending', 'completed', 'completed', 'completed', 'skipped', 'completed', 'completed'],
    ['pending', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed']
  ];
  const created = await M.Routine.create(ROUTINES.map((r, i) => ({ ...r, childId, completed: patterns[i][0] === 'completed' })));
  const logs = [];
  created.forEach((routine, i) => patterns[i].forEach((status, d) => logs.push({ routineId: routine._id, date: dayKey(at(d, 12)), status })));
  await M.RoutineLog.create(logs);
  log(`+ ${created.length} routines, ${logs.length} routine logs`);
}

// [daysAgo, worksheetId, marks per item (0/1/2), engagement 1-5, minutes, notes]
const ATTEMPTS = [
  [14, 'colors', [2, 1, 1], 3, 10, 'Knew red and yellow, needed a hint for green.'],
  [12, 'shapes', [1, 1, 1], 3, 11, 'Matched shapes with prompts. Attention dropped after 8 minutes.'],
  [10, 'numbers-1-5', [2, 2, 1, 1, 0], 3, 13, 'Counted to 3 alone, needed help for 4 and 5.'],
  [8, 'colors', [2, 2, 2], 4, 8, 'All colors named. Used his spider drawings as examples.'],
  [6, 'my-feelings', [1, 1, 1], 3, 12, 'Happy and sad clear, scared needed the picture card.'],
  [5, 'match-the-same', [2, 2, 1], 4, 9, 'Matched quickly, one mistake with similar shapes.'],
  [3, 'numbers-1-5', [2, 2, 2, 2, 1], 5, 10, 'Counted building blocks aloud up to 5.'],
  [2, 'daily-routine', [2, 1, 2, 1], 4, 12, 'Ordered brush teeth and dress easily, lunch/bath steps need cues.'],
  [1, 'my-feelings', [2, 2, 1], 4, 10, 'Named three feelings using cards without help.']
];

async function teachingAndProgress(child) {
  const mod = readJson('content', 'teaching', 'early-learning-foundations.json');
  if (!mod) { log('teaching content not found, skipping worksheets'); return; }
  const sheets = new Map(mod.chapters.flatMap((c) => c.worksheets).map((w) => [w.id, w]));
  const mastered = new Set(); let made = 0;
  for (const [daysAgo, wid, levels, engagement, minutes, notes] of ATTEMPTS) {
    const w = sheets.get(wid);
    if (!w || w.items.length !== levels.length) { log(`skip attempt "${wid}" (content changed)`); continue; }
    const marks = w.items.map((item, i) => ({ itemId: item.id, level: levels[i] }));
    const score = levels.reduce((a, b) => a + b, 0), max = levels.length * 2, percent = Math.round((score / max) * 100);
    const ts = at(daysAgo, 17, 30);
    const progress = await M.Progress.create({ childId: child._id, ts, area: w.area, score: percent, obs: `Worksheet "${w.title}": ${score}/${max}` });
    let milestoneId;
    if (percent >= 80 && !mastered.has(wid)) {
      mastered.add(wid);
      milestoneId = (await M.Milestone.create({ childId: child._id, ts, title: `Mastered worksheet: ${w.title}` }))._id;
    }
    await M.TeachingSubmission.create({
      childId: child._id, parentId: child.parentId, moduleSlug: mod.slug, worksheetId: wid, ts, day: dayKey(ts),
      score, max, percent, area: w.area, engagement, minutes, notes, marks, progressId: progress._id, milestoneId
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
  const stamp = (d) => { const t = at(d, 20, 45); days.add(dayKey(t)); return t; };
  mod.chapters.forEach((chapter, ci) => {
    const upTo = ci === 0 ? chapter.subchapters.length : ci === 1 ? 1 : 0;
    chapter.subchapters.slice(0, upTo).forEach((lesson, li) => {
      const total = (lesson.questions || []).length;
      lessons.push({ subId: lesson.id, total, correct: total > 1 && li === 1 ? total - 1 : total, completedAt: stamp(Math.max(2, 10 - ci * 3 - li)) });
    });
    if (ci === 0) {
      const total = (chapter.quiz || []).length, score = Math.max(0, total - 1);
      quizzes.push({ chapterId: chapter.id, total, attempts: 1, best: score, last: score, lastAt: stamp(7) });
    }
  });
  stamp(1); stamp(0);
  await M.LearningProgress.create({ parentId: parent._id, moduleSlug: mod.slug, lessons, quizzes, activityDays: [...days].sort(), lastActiveAt: at(0, 8) });
  log(`+ learning progress for ${parent.name}`);
}

const ACTIVITIES = [ // same titles as seed.js - upserted, never duplicated
  { title: 'Bubble Breathing', category: 'Regulation', description: 'Slow breaths while blowing bubbles.', minAge: 3, maxAge: 10, tags: ['calming'] },
  { title: 'Sort by Color', category: 'Focus', description: 'Sort small objects by color into cups.', minAge: 3, maxAge: 8, tags: ['focus'] },
  { title: 'Quiet Reading Nook', category: 'Sensory', description: 'Build a low-stimulation corner with cushions and soft light.', minAge: 4, maxAge: 12, tags: ['sensory'] },
  { title: 'Train Track Counting', category: 'Early Math', description: 'Count wooden train carriages together, 1 to 5.', minAge: 4, maxAge: 8, tags: ['focus', 'interests'] },
  { title: 'Water Play Calm-down', category: 'Sensory', description: 'Warm water, cups and funnels in a quiet space.', minAge: 3, maxAge: 9, tags: ['sensory', 'calming'] },
  { title: 'Feelings Cards', category: 'Emotions', description: "Match face cards to how we feel and point to today's feeling.", minAge: 4, maxAge: 9, tags: ['emotions'] }
];

async function activities(child) {
  for (const a of ACTIVITIES) await M.Activity.updateOne({ title: a.title }, { $setOnInsert: a }, { upsert: true });
  if (await M.ActivityFeedback.countDocuments({ childId: child._id })) return;
  const byTitle = Object.fromEntries((await M.Activity.find({ title: { $in: ACTIVITIES.map((a) => a.title) } })).map((a) => [a.title, a]));
  const fb = [
    ['Feelings Cards', 'Completed', 'Enjoyed drawing each feeling as a comic panel.', 5],
    ['Quiet Reading Nook', 'Completed', 'Stayed 20 minutes with his insect book.', 4],
    ['Bubble Breathing', 'Completed', 'Calmer after, asked to do it again.', 3],
    ['Sort by Color', 'Too Difficult', 'Too many colors at once, try 2-3.', 2],
    ['Train Track Counting', 'Completed', 'Used building blocks instead, counted to 5.', 1]
  ].filter(([t]) => byTitle[t]).map(([t, rating, notes, d]) => ({ activityId: byTitle[t]._id, childId: child._id, rating, notes, ts: at(d, 16) }));
  await M.ActivityFeedback.create(fb);
  log(`+ ${fb.length} activity feedback entries`);
}

async function seedPeter({ resetPeter = false } = {}) {
  const parent = await ensureUser(PARENT);
  const therapist = await ensureUser(THERAPIST);
  let child = await M.Child.findOne({ parentId: parent._id, name: CHILD_NAME });
  if (resetPeter && child) {
    const id = child._id;
    const routines = await M.Routine.find({ childId: id }).select('_id');
    await Promise.all([
      M.Episode, M.Note, M.Contact, M.Goal, M.Progress, M.Milestone, M.Routine, M.ActivityFeedback, M.TeachingSubmission
    ].map((m) => m.deleteMany({ childId: id })));
    await M.RoutineLog.deleteMany({ routineId: { $in: routines.map((r) => r._id) } });
    await M.Child.deleteOne({ _id: id });
    await M.LearningProgress.deleteMany({ parentId: parent._id });
    log('Peter data cleared');
  }
  child = await ensureChild(parent, therapist);
  const id = child._id;
  const only = async (Model, docsFn, label) => {
    if (await Model.countDocuments({ childId: id })) return;
    const docs = docsFn(); await Model.create(docs); log(`+ ${docs.length} ${label}`);
  };

  await only(M.Episode, () => episodeDocs(id), 'episodes');
  if (!(await M.Routine.countDocuments({ childId: id }))) await routineDocs(id);
  await only(M.Contact, () => [
    { childId: id, name: therapist.name, role: 'Therapist', email: therapist.email, phone: '+91 98765 43210' },
    { childId: id, name: 'Ms. Deshmukh', role: 'Class Teacher', email: 'teacher@midtown-school.example', phone: '+91 98200 55501' },
    { childId: id, name: 'Dr. Rao', role: 'Pediatrician', email: 'clinic@rao-kids.example', phone: '+91 98200 55502' },
    { childId: id, name: parent.name, role: 'Parent', email: parent.email, phone: '+91 98765 22211' }
  ], 'contacts');
  await only(M.Note, () => [
    { childId: id, author: therapist.name, authorRole: 'Therapist', ts: at(9, 18), text: 'Headphones are working well in the cafeteria. Continue giving a 5-minute warning before lunch and assemblies.' },
    { childId: id, author: parent.name, authorRole: 'Parent', ts: at(5, 19), text: 'Mall visits are still hard because of the bright lights. We will try shorter trips with headphones on from the start.' },
    { childId: id, author: therapist.name, authorRole: 'Therapist', ts: at(1, 18, 30), text: 'Episodes are shorter and milder this fortnight (average intensity down from about 4.3 to 2). Peter asked for his headphones on his own, which is great progress.' }
  ], 'notes');
  await only(M.Goal, () => [ // area must equal a worksheet area or "Sensory Regulation"
    { childId: id, area: 'Colors', title: 'Name red, blue, yellow and green independently', targetScore: 85 },
    { childId: id, area: 'Early Math', title: 'Count objects from 1 to 5 independently', targetScore: 80 },
    { childId: id, area: 'Emotions', title: 'Name 4 basic feelings using cards', targetScore: 75 },
    { childId: id, area: 'Sensory Regulation', title: 'Ask for headphones or a quiet space without prompting', targetScore: 80 }
  ], 'goals');

  if (!(await M.Progress.countDocuments({ childId: id, obs: /^Therapist/ }))) {
    await M.Progress.create([
      { childId: id, ts: at(21, 18), area: 'Sensory Regulation', score: 35, obs: 'Therapist review: needs adult prompts to use headphones.' },
      { childId: id, ts: at(11, 18), area: 'Sensory Regulation', score: 55, obs: 'Therapist review: uses headphones after one reminder.' },
      { childId: id, ts: at(2, 18), area: 'Sensory Regulation', score: 75, obs: 'Therapist review: asks for headphones when the cafeteria gets loud.' }
    ]);
    await M.Milestone.create({ childId: id, ts: at(2, 13), title: 'Asked for headphones without prompting' });
    log('+ therapist progress reviews + milestone');
  }

  if (!(await M.TeachingSubmission.countDocuments({ childId: id }))) await teachingAndProgress(child);
  await activities(child);
  await learningProgress(parent);
  log(`ready. Parent login: ${PARENT.email}; therapist: ${THERAPIST.email}`);
  return { parentId: String(parent._id), therapistId: String(therapist._id), childId: String(id) };
}

module.exports = { seedPeter, PARENT, CHILD_NAME };

if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/neuroai')
    .then(() => seedPeter({ resetPeter: process.argv.includes('--reset-peter') }))
    .then((ids) => { console.log(ids); return mongoose.disconnect(); })
    .catch((err) => { console.error('Seeding error:', err); process.exit(1); });
}