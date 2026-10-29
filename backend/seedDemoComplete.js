// "Completion layer" for the demo. Runs AFTER seed.js, seedPeter.js and seedMoreChildren.js and fills
// the gaps they leave, so EVERY demo child has data behind EVERY feature:
//
//   * Activity library      full details (minutes / materials / steps) for the 6 activities
//   * Activity plan         favourites + planned activities (today / upcoming) per child
//   * Teaching modules 2+3  sensory worksheets (Progress + Milestone + TeachingSubmission) per child
//   * Goals                 one extra goal per child that is fed by the sensory worksheets
//   * Parent learning       "Sensory Learning" + "Sensory Skills" lessons and quizzes per parent
//   * Therapist dashboard   Kabir has a rough recent week -> shows the "needs attention" flags
//
// Idempotent and non-destructive: it only creates what is missing.
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const M = require('./models');

const at = (daysAgo, h, m = 0) => { const t = new Date(); t.setDate(t.getDate() - daysAgo); t.setHours(h, m, 0, 0); return t; };
const dayKey = (d) => d.toISOString().slice(0, 10);
const readJson = (...p) => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, ...p), 'utf8')); } catch { return null; } };
const log = (...a) => console.log('[seed-demo]', ...a);

const M2 = 'sensory-learning-and-exploration';
const M3 = 'sensory-skills-and-communication';

// Set to false if you do not want the deliberate "needs attention" child on the therapist dashboard.
const SHOW_NEEDS_ATTENTION_CASE = true;

const DEMO = [
  {
    parentEmail: 'goon@example.com', childName: 'Somik Sharma',
    extraGoal: { area: 'Sequencing', title: 'Do first / next / last with a picture schedule', targetScore: 80 },
    attempts: [
      [13, M2, 'touch-and-texture', [2, 1], 3, 8, 'Liked the smooth fabric, avoided the bumpy one.'],
      [11, M3, 'first-next-last', [1, 2, 1], 3, 10, 'Used his visual schedule, needed a prompt for "next".'],
      [9, M2, 'pour-and-scoop', [1, 2, 2], 4, 12, 'Water play again. Poured without spilling.'],
      [7, M3, 'first-next-last', [2, 2, 2], 5, 9, 'Did all three steps on his own with the train cards.'],
      [5, M2, 'sensory-walk', [2, 2, 1], 4, 14, 'Named the loud and quiet places on the walk.'],
      [4, M3, 'choose-the-tool', [1, 1, 2], 3, 11, 'Picked headphones for the loud picture.'],
      [2, M2, 'my-sensory-choices', [1, 1, 2], 3, 10, 'Chose a quiet corner with one reminder.']
    ],
    plan: [['favorite', 'Train Track Counting'], ['favorite', 'Bubble Breathing'], ['planned', 'Quiet Reading Nook', 0], ['planned', 'Feelings Cards', 2], ['planned', 'Water Play Calm-down', 4]],
    learning: { [M2]: { chapters: 3, extra: 0 }, [M3]: { chapters: 1, extra: 0 } }
  },
  {
    parentEmail: 'may.parker@example.com', childName: 'Peter Parker',
    extraGoal: { area: 'Self-Advocacy', title: 'Choose a sensory tool when things get loud', targetScore: 80 },
    attempts: [
      [13, M2, 'sensory-walk', [1, 1, 2], 3, 12, 'Spotted the flickering light and covered his eyes.'],
      [11, M3, 'same-or-different', [2, 2, 2], 5, 8, 'Loved spotting the differences, like his insect books.'],
      [9, M2, 'sort-by-shape', [2, 2, 2], 4, 9, 'Sorted blocks by shape quickly.'],
      [7, M3, 'look-and-find', [2, 1, 2], 4, 10, 'Found the hidden spider, missed one object.'],
      [5, M2, 'my-sensory-choices', [2, 2, 1], 4, 11, 'Picked headphones and a quiet room.'],
      [3, M3, 'first-next-last', [2, 1, 2], 4, 9, 'Sequenced the comic panels correctly.'],
      [1, M2, 'my-sensory-choices', [2, 2, 2], 5, 8, 'Asked for his headphones before we started.']
    ],
    plan: [['favorite', 'Feelings Cards'], ['favorite', 'Quiet Reading Nook'], ['planned', 'Bubble Breathing', 1], ['planned', 'Water Play Calm-down', 3], ['planned', 'Sort by Color', 5]],
    learning: { [M2]: { chapters: 2, extra: 0 }, [M3]: { chapters: 0, extra: 1 } }
  },
  {
    parentEmail: 'neha.mehta@example.com', childName: 'Aarav Mehta',
    extraGoal: { area: 'Sensory Exploration', title: 'Touch 3 different textures calmly', targetScore: 75 },
    attempts: [
      [12, M2, 'touch-and-texture', [1, 1], 3, 7, 'Touched the soft cloth, pulled away from sand.'],
      [10, M3, 'first-next-last', [1, 1, 1], 3, 9, 'Needed a hand-over-hand prompt for each step.'],
      [8, M2, 'move-and-play', [2, 1, 2], 5, 10, 'Loved stomping like a dinosaur.'],
      [6, M2, 'pour-and-scoop', [1, 1, 0], 3, 8, 'Spilled a lot, enjoyed the bubbles more.'],
      [4, M3, 'copy-the-movement', [2, 2, 1], 4, 9, 'Copied clapping and jumping, stomping needed a model.'],
      [2, M2, 'touch-and-texture', [2, 2], 4, 7, 'Touched all textures with a smile this time.']
    ],
    plan: [['favorite', 'Bubble Breathing'], ['favorite', 'Train Track Counting'], ['planned', 'Feelings Cards', 1], ['planned', 'Water Play Calm-down', 2]],
    learning: { [M2]: { chapters: 1, extra: 0 }, [M3]: { chapters: 0, extra: 0 } }
  },
  {
    parentEmail: 'imran.khan@example.com', childName: 'Zoya Khan',
    extraGoal: { area: 'Self-Advocacy', title: 'Ask for a quiet space or a softer option', targetScore: 80 },
    attempts: [
      [13, M2, 'touch-and-texture', [1, 0], 3, 9, 'Refused the rough texture, liked the soft cotton.'],
      [11, M2, 'sensory-walk', [1, 1, 1], 3, 13, 'Covered ears near the school bell.'],
      [9, M3, 'choose-the-tool', [2, 2, 2], 5, 8, 'Chose headphones, then a quiet room, correctly.'],
      [7, M2, 'pour-and-scoop', [2, 2, 2], 5, 12, 'Sand play made it easy. Poured every cup.'],
      [5, M3, 'build-and-pretend', [2, 2, 1], 4, 14, 'Built a cat house and pretended to feed the cats.'],
      [3, M2, 'my-sensory-choices', [2, 2, 2], 5, 9, 'Chose between two options by herself.'],
      [1, M2, 'touch-and-texture', [2, 1], 4, 8, 'Touched the bumpy fabric for 3 seconds.']
    ],
    plan: [['favorite', 'Quiet Reading Nook'], ['favorite', 'Water Play Calm-down'], ['planned', 'Feelings Cards', 1], ['planned', 'Bubble Breathing', 4]],
    learning: { [M2]: { chapters: 2, extra: 1 }, [M3]: { chapters: 1, extra: 0 } }
  },
  {
    parentEmail: 'divya.nair@example.com', childName: 'Kabir Nair',
    extraGoal: { area: 'Sequencing', title: 'Follow first / next / last without a reminder', targetScore: 80 },
    attempts: [
      [13, M2, 'move-and-play', [2, 2, 1], 4, 10, 'Pushed trucks and crawled through the tunnel.'],
      [11, M3, 'first-next-last', [1, 2, 1], 3, 9, 'Lined up the cards, needed help with the order.'],
      [9, M2, 'pour-and-scoop', [2, 2, 2], 5, 12, 'Water play: poured and scooped with no help.'],
      [7, M3, 'same-or-different', [2, 1, 2], 4, 8, 'Found the odd truck out.'],
      [5, M3, 'look-and-find', [2, 2, 2], 5, 9, 'Spotted every object in the picture.'],
      [3, M3, 'first-next-last', [2, 2, 1], 4, 8, 'Better with the timer on the table.'],
      [1, M2, 'move-and-play', [2, 2, 2], 5, 10, 'Did the whole obstacle path himself.']
    ],
    plan: [['favorite', 'Water Play Calm-down'], ['favorite', 'Train Track Counting'], ['planned', 'Bubble Breathing', 0], ['planned', 'Quiet Reading Nook', 2]],
    learning: { [M2]: { chapters: 1, extra: 0 }, [M3]: { chapters: 1, extra: 1 } }
  }
];

const ACTIVITY_DETAILS = {
  'Bubble Breathing': { minutes: 5, materials: ['Bubble wand and solution'], steps: ['Sit side by side', 'Show one slow breath in', 'Blow one long bubble out', 'Count bubbles together, five times'] },
  'Sort by Color': { minutes: 8, materials: ['Small cups', 'Colored blocks or buttons'], steps: ['Start with only two colors', 'Name the color as you place each item', 'Add a third color when two feel easy'] },
  'Quiet Reading Nook': { minutes: 15, materials: ['Cushions', 'Soft lamp', 'Two favorite books'], steps: ['Build the nook together', 'Dim other lights', 'Read one short book, then stop on a good note'] },
  'Train Track Counting': { minutes: 10, materials: ['Wooden train carriages'], steps: ['Line up carriages', 'Point and count 1 to 5 together', 'Let your child push the train after each count'] },
  'Water Play Calm-down': { minutes: 15, materials: ['Basin', 'Warm water', 'Cups and funnels'], steps: ['Fill the basin with warm water', 'Pour slowly together', 'Keep the room quiet, few words'] },
  'Feelings Cards': { minutes: 10, materials: ['Printed face cards'], steps: ['Lay out 3 faces: happy, sad, upset', "Ask them to point to today's feeling", 'Name it back, no follow-up questions'] }
};

async function fillActivityDetails() {
  for (const [title, d] of Object.entries(ACTIVITY_DETAILS)) {
    await M.Activity.updateOne({ title, $or: [{ steps: { $exists: false } }, { steps: { $size: 0 } }] }, { $set: d });
  }
}

async function planFor(child, plan) {
  if (await M.ActivityPlan.countDocuments({ childId: child._id })) return;
  const byTitle = Object.fromEntries((await M.Activity.find({ title: { $in: Object.keys(ACTIVITY_DETAILS) } })).map((a) => [a.title, a]));
  const docs = plan.filter(([, t]) => byTitle[t]).map(([kind, t, offset = 0]) => ({
    childId: child._id, activityId: byTitle[t]._id, kind, ...(kind === 'planned' ? { date: dayKey(at(-offset, 12)), done: false } : {})
  }));
  if (docs.length) { await M.ActivityPlan.create(docs); log(`+ ${docs.length} activity plan items for ${child.name}`); }
}

async function sensoryWorksheets(child, attempts) {
  const mods = { [M2]: readJson('content', 'teaching', 'sensory-learning-and-exploration.json'), [M3]: readJson('content', 'teaching', 'sensory-skills-and-communication.json') };
  const mastered = new Set(); let made = 0;
  for (const [daysAgo, slug, wid, levels, engagement, minutes, notes] of attempts) {
    const mod = mods[slug];
    const w = mod && mod.chapters.flatMap((c) => c.worksheets).find((x) => x.id === wid);
    if (!w || w.items.length !== levels.length) { log(`skip "${slug}/${wid}" (content missing or changed)`); continue; }
    if (await M.TeachingSubmission.exists({ childId: child._id, moduleSlug: slug, worksheetId: wid, notes })) continue;
    const marks = w.items.map((item, i) => ({ itemId: item.id, level: levels[i] }));
    const score = levels.reduce((a, b) => a + b, 0), max = levels.length * 2, percent = Math.round((score / max) * 100);
    const ts = at(daysAgo, 16, 45);
    const progress = await M.Progress.create({ childId: child._id, ts, area: w.area, score: percent, obs: `Worksheet "${w.title}": ${score}/${max}` });
    let milestoneId;
    const key = `${slug}/${wid}`;
    if (percent >= 80 && !mastered.has(key) && !(await M.Milestone.exists({ childId: child._id, title: `Mastered worksheet: ${w.title}` }))) {
      mastered.add(key);
      milestoneId = (await M.Milestone.create({ childId: child._id, ts, title: `Mastered worksheet: ${w.title}` }))._id;
    }
    await M.TeachingSubmission.create({ childId: child._id, parentId: child.parentId, moduleSlug: slug, worksheetId: wid, ts, day: dayKey(ts), score, max, percent, area: w.area, engagement, minutes, notes, marks, progressId: progress._id, milestoneId });
    made++;
  }
  if (made) log(`+ ${made} sensory worksheet attempts for ${child.name}`);
}

async function extraGoal(child, goal) {
  if (!(await M.Goal.exists({ childId: child._id, title: goal.title }))) { await M.Goal.create({ childId: child._id, ...goal }); log(`+ goal "${goal.title}" for ${child.name}`); }
}

async function parentLearning(parent, config) {
  for (const [slug, { chapters, extra }] of Object.entries(config)) {
    if (!chapters && !extra) continue;
    const mod = readJson('content', 'learning', `${slug}.json`);
    if (!mod || await M.LearningProgress.countDocuments({ parentId: parent._id, moduleSlug: slug })) continue;
    const lessons = [], quizzes = [], days = new Set();
    const stamp = (d) => { const t = at(d, 20, 15); days.add(dayKey(t)); return t; };
    mod.chapters.forEach((chapter, ci) => {
      const upTo = ci < chapters ? chapter.subchapters.length : ci === chapters ? extra : 0;
      chapter.subchapters.slice(0, upTo).forEach((lesson, li) => {
        const total = (lesson.questions || []).length;
        lessons.push({ subId: lesson.id, total, correct: total > 1 && li % 3 === 1 ? total - 1 : total, completedAt: stamp(Math.max(2, 12 - ci * 2 - li)) });
      });
      if (ci < chapters) {
        const total = (chapter.quiz || []).length, score = Math.max(0, total - (ci % 2));
        quizzes.push({ chapterId: chapter.id, total, attempts: 1 + (ci % 2), best: score, last: score, lastAt: stamp(Math.max(1, 10 - ci * 2)) });
      }
    });
    await M.LearningProgress.create({ parentId: parent._id, moduleSlug: slug, lessons, quizzes, activityDays: [...days].sort(), lastActiveAt: at(1, 20) });
    log(`+ learning progress "${slug}" for ${parent.name}`);
  }
}

// Kabir: a rough few days after a schedule change -> 5 episodes this week and rising intensity.
async function needsAttentionCase(child, parent) {
  const marker = 'Substitute bus driver and a new route.';
  if (await M.Episode.exists({ childId: child._id, notes: marker })) return;
  await M.Episode.create([
    { childId: child._id, ts: at(2, 17, 40), intensity: 4, trigger: 'Waiting / Delays', activity: 'Waiting for dinner', location: 'Home', sensoryEnvironment: 'Normal', sleepHours: 6, hungerLevel: 'Hungry', behaviors: ['Screaming', 'Hitting'], durationMinutes: 26, recoveryMinutes: 21, calmingInterventions: ['Weighted Blanket', 'Deep Breathing'], response: 'Showed the visual timer, stayed close', postEpisodeBehavior: 'Calm but tired', notes: 'Slept badly after a late night.' },
    { childId: child._id, ts: at(0, 7, 45), intensity: 5, trigger: 'Routine Interruption', activity: 'School bus was late', location: 'School Bus', sensoryEnvironment: 'Loud', sleepHours: 6, hungerLevel: 'Normal', behaviors: ['Screaming', 'Hitting', 'Shutting down'], durationMinutes: 38, recoveryMinutes: 30, calmingInterventions: ['Noise Canceling Headphones', 'Favorite Toy'], response: 'Parent used the picture schedule once at school', postEpisodeBehavior: 'Exhausted', notes: marker }
  ]);
  await M.Note.create({ childId: child._id, author: parent.name, authorRole: 'Parent', ts: at(0, 9), text: 'Rough two days. New bus route and a late bus this morning. Kabir had a long meltdown. Could we plan a visual story about the new route?' });
  log(`+ needs-attention episodes + note for ${child.name}`);
}

async function seedDemoComplete() {
  await fillActivityDetails();
  for (const spec of DEMO) {
    const parent = await M.User.findOne({ email: spec.parentEmail });
    const child = parent && await M.Child.findOne({ parentId: parent._id, name: spec.childName });
    if (!child) { log(`skip ${spec.childName}: child not found (run the base seeds first)`); continue; }
    await planFor(child, spec.plan);
    await sensoryWorksheets(child, spec.attempts);
    await extraGoal(child, spec.extraGoal);
    await parentLearning(parent, spec.learning);
    if (SHOW_NEEDS_ATTENTION_CASE && spec.childName === 'Kabir Nair') await needsAttentionCase(child, parent);
  }
  log('demo data complete.');
}

module.exports = { seedDemoComplete, DEMO };

if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/neuroai')
    .then(() => seedDemoComplete())
    .then(() => mongoose.disconnect())
    .catch((err) => { console.error('Seeding error:', err); process.exit(1); });
}