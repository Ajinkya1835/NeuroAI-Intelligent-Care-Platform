// Dummy data for 3 more children: Aarav Mehta, Zoya Khan, Kabir Nair.
// Same models, enums, option lists and worksheet ids as seed.js / seedPeter.js.
//
// Run from neuroai-backend:  node seedMoreChildren.js                (idempotent, creates only what is missing)
//                            node seedMoreChildren.js --reset-these  (wipes these 3 children's data, then reseeds)
// Or:  const { seedMoreChildren } = require('./seedMoreChildren'); await seedMoreChildren();
//
// Every child has its own parent login (password = SEED_PASSWORD, default "password123") and is
// linked to the therapist Dr. Ajinkya, so the therapist account sees all of them.
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const M = require('./models');

const THERAPIST = { name: 'Dr. Ajinkya', email: 'dr.ajinkya@neurocare.com', role: 'therapist' };

const at = (daysAgo, h, m = 0) => { const t = new Date(); t.setDate(t.getDate() - daysAgo); t.setHours(h, m, 0, 0); return t; };
const dayKey = (d) => d.toISOString().slice(0, 10);
const readJson = (...p) => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, ...p), 'utf8')); } catch { return null; } };
const log = (...a) => console.log('[seed-more]', ...a);

// Option values used by the UI
const CALM = { WB: 'Weighted Blanket', HP: 'Noise Canceling Headphones', BR: 'Deep Breathing', QR: 'Quiet Room', TOY: 'Favorite Toy', HUG: 'Deep Pressure Hug' };
const { WB, HP, BR, QR, TOY, HUG } = CALM;

// ---------------------------------------------------------------------------------------------
// Episode row: [daysAgo, hour, min, intensity 1-5, trigger, activity, location, environment,
//               sleepHours, hunger, durationMin, behaviors[], interventions[], response, after, notes]
// ---------------------------------------------------------------------------------------------
const CHILDREN = [
  {
    parent: { name: 'Neha Mehta', email: 'neha.mehta@example.com', role: 'parent' },
    child: {
      name: 'Aarav Mehta', dob: '2021-01-09T00:00:00Z',
      interests: ['Dinosaurs', 'Toy cars', 'Bubbles', 'Singing rhymes'],
      notes: 'Newly started preschool. Settles best with a goodbye ritual (high-five and a toy dinosaur in his bag) and a picture of his day. Needs extra time to switch between activities.',
      primaryTriggers: ['Separation Anxiety', 'Transitions Between Activities', 'Loud Noise / Crowds'],
      calmingStrategies: ['Favorite Toy', 'Deep Breathing', 'Weighted Blanket']
    },
    teacher: { name: 'Ms. Iyer', email: 'teacher@littlesteps-school.example', phone: '+91 98200 66601' },
    doctor: { name: 'Dr. Banerjee', email: 'clinic@banerjee-kids.example', phone: '+91 98200 66602' },
    parentPhone: '+91 98765 33301',
    episodes: [
      [29, 8, 30, 5, 'Separation Anxiety', 'Morning Drop-off', 'School Entrance', 'Crowded', 7, 'Normal', 40, ['Crying', 'Screaming', 'Running away'], [TOY, HUG], 'Teacher held his hand and walked him to the dinosaur corner', 'Tired, clingy', 'First week of preschool.'],
      [27, 10, 45, 4, 'Transitions Between Activities', 'Playtime to circle time', 'Classroom', 'Normal', 7, 'Normal', 25, ['Crying', 'Hitting'], [TOY, BR], 'Gave a 2-minute warning with a sand timer', 'Calm but quiet', ''],
      [25, 8, 25, 5, 'Separation Anxiety', 'Morning Drop-off', 'School Entrance', 'Crowded', 6, 'Normal', 35, ['Crying', 'Screaming'], [TOY, HUG], 'Parent stayed 10 extra minutes before leaving', 'Tired', 'Slept badly the night before.'],
      [22, 11, 30, 3, 'Loud Noise / Crowds', 'Music time', 'Music Room', 'Loud', 8, 'Normal', 15, ['Covering ears', 'Crying'], [HP], 'Moved to the edge of the room with headphones', 'Calm', ''],
      [20, 8, 30, 4, 'Separation Anxiety', 'Morning Drop-off', 'School Entrance', 'Normal', 8, 'Normal', 22, ['Crying', 'Running away'], [TOY, BR], 'Used the goodbye ritual, teacher greeted him by name', 'Calm but tired', ''],
      [17, 16, 40, 3, 'Transitions Between Activities', 'Leaving the park', 'Park', 'Normal', 8, 'Hungry', 15, ['Crying', 'Rocking'], [BR, TOY], 'Offered a snack and a countdown to the car', 'Calm', ''],
      [14, 8, 35, 3, 'Separation Anxiety', 'Morning Drop-off', 'School Entrance', 'Normal', 8, 'Normal', 14, ['Crying'], [TOY, HUG], 'High-five ritual then walked in with teacher', 'Calm', ''],
      [11, 10, 50, 2, 'Transitions Between Activities', 'Snack to story time', 'Classroom', 'Quiet', 9, 'Normal', 8, ['Rocking'], [BR], 'Showed the picture schedule', 'Calm and cheerful', ''],
      [8, 12, 20, 3, 'Loud Noise / Crowds', 'Lunch in the hall', 'School Cafeteria', 'Loud', 8, 'Hungry', 12, ['Covering ears'], [HP, QR], 'Ate in the quiet corner', 'Calm', ''],
      [5, 8, 30, 2, 'Separation Anxiety', 'Morning Drop-off', 'School Entrance', 'Normal', 9, 'Full', 7, ['Crying'], [TOY], 'Walked in holding his dinosaur', 'Calm', 'Waved goodbye on his own.'],
      [3, 11, 5, 2, 'Transitions Between Activities', 'Playtime to circle time', 'Classroom', 'Normal', 9, 'Normal', 6, ['Rocking'], [BR], 'Used the sand timer himself', 'Calm and cheerful', ''],
      [1, 8, 30, 1, 'Separation Anxiety', 'Morning Drop-off', 'School Entrance', 'Quiet', 9, 'Full', 4, ['Crying'], [TOY], 'Quick high-five and went in', 'Calm and cheerful', 'Shortest drop-off so far.']
    ],
    routines: [
      { title: 'Goodbye Ritual at Drop-off', category: 'Morning', scheduleTime: '08:15' },
      { title: 'Picture Schedule Review', category: 'School', scheduleTime: '10:00' },
      { title: 'Bubble Breathing After School', category: 'School', scheduleTime: '15:00' },
      { title: 'Dinosaur Story Time', category: 'Evening', scheduleTime: '18:30' },
      { title: 'Bedtime Song & Weighted Blanket', category: 'Night', scheduleTime: '19:45' }
    ],
    routineLogs: [
      ['completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed'],
      ['completed', 'completed', 'skipped', 'completed', 'completed', 'completed', 'completed'],
      ['completed', 'completed', 'completed', 'completed', 'skipped', 'completed', 'completed'],
      ['pending', 'completed', 'completed', 'skipped', 'completed', 'completed', 'completed'],
      ['pending', 'completed', 'completed', 'completed', 'completed', 'completed', 'skipped']
    ],
    notes: [
      ['therapist', 10, 18, 'Goodbye ritual is working. Keep drop-offs short and consistent; avoid sneaking out.'],
      ['parent', 6, 19, 'Aarav waved goodbye on his own today. He now asks for the sand timer before changing activities.'],
      ['therapist', 1, 18, 'Drop-off episodes are down from intensity 5 to 1-2. Next step: practise short transitions with a timer at home.']
    ],
    goals: [
      { area: 'Emotions', title: 'Name 4 basic feelings using cards', targetScore: 75 },
      { area: 'Early Math', title: 'Count objects from 1 to 5 independently', targetScore: 80 },
      { area: 'Daily Living', title: 'Follow a 4-step picture routine with one prompt', targetScore: 75 },
      { area: 'Sensory Regulation', title: 'Say goodbye at drop-off without crying', targetScore: 80 }
    ],
    therapistProgress: [[20, 30, 'Therapist review: needs a parent and a toy to separate at drop-off.'], [10, 55, 'Therapist review: separates with the goodbye ritual and one prompt.'], [2, 78, 'Therapist review: separates calmly most mornings.']],
    milestone: [2, 'Walked into class without crying'],
    attempts: [
      [13, 'colors', [1, 1, 1], 3, 8, 'Needed help with green. Short attention span.'],
      [11, 'my-feelings', [1, 0, 1], 3, 9, 'Happy is clear, sad and scared need cards.'],
      [9, 'numbers-1-5', [2, 1, 1, 0, 0], 3, 10, 'Counted to 2 alone, loved the toy cars.'],
      [7, 'colors', [2, 2, 1], 4, 7, 'Named red and blue straight away.'],
      [5, 'daily-routine', [1, 1, 1, 0], 3, 10, 'Needs prompts for each step.'],
      [3, 'numbers-1-5', [2, 2, 2, 1, 1], 5, 9, 'Counted toy dinosaurs to 5 with one hint.'],
      [1, 'my-feelings', [2, 1, 2], 4, 8, 'Matched feelings cards with a smile.']
    ],
    lessonProgress: { chapters: 1, extraLessons: 2 },
    feedback: [['Bubble Breathing', 'Completed', 'Laughed and popped bubbles, calmer after.', 5], ['Train Track Counting', 'Completed', 'Used toy cars instead of trains.', 3], ['Feelings Cards', 'Completed', 'Pointed to the happy face.', 2], ['Sort by Color', 'Too Difficult', 'Too many colors, start with two.', 1]]
  },
  {
    parent: { name: 'Imran Khan', email: 'imran.khan@example.com', role: 'parent' },
    child: {
      name: 'Zoya Khan', dob: '2018-08-30T00:00:00Z',
      interests: ['Painting', 'Music boxes', 'Cats', 'Sand play'],
      notes: 'Very sensitive to clothing textures, tags and certain food textures. Prefers soft cotton and predictable meals. Does well when choices are limited to two options.',
      primaryTriggers: ['Clothing / Texture', 'Mealtime Changes', 'Loud Noise / Crowds'],
      calmingStrategies: ['Deep Pressure Hug', 'Weighted Blanket', 'Quiet Room', 'Favorite Toy']
    },
    teacher: { name: 'Mr. Pillai', email: 'teacher@greenfield-school.example', phone: '+91 98200 77701' },
    doctor: { name: 'Dr. Joseph', email: 'clinic@joseph-kids.example', phone: '+91 98200 77702' },
    parentPhone: '+91 98765 44401',
    episodes: [
      [29, 7, 40, 4, 'Clothing / Texture', 'Getting dressed for school', 'Home', 'Normal', 7, 'Normal', 30, ['Crying', 'Screaming'], [HUG, WB], 'Offered two soft outfits to choose from', 'Calm but tired', 'New uniform with a stiff collar.'],
      [27, 13, 10, 3, 'Mealtime Changes', 'Lunch with a new menu', 'School Cafeteria', 'Loud', 8, 'Hungry', 18, ['Shutting down', 'Crying'], [QR, TOY], 'Allowed her to eat her packed lunch', 'Quiet', ''],
      [25, 7, 35, 5, 'Clothing / Texture', 'Getting dressed for school', 'Home', 'Normal', 6, 'Normal', 40, ['Screaming', 'Hitting', 'Running away'], [HUG, WB, QR], 'Removed the tag and used a soft cotton shirt', 'Exhausted', 'Tag irritated her neck.'],
      [22, 11, 25, 4, 'Loud Noise / Crowds', 'Sports day', 'School Ground', 'Crowded', 7, 'Normal', 28, ['Covering ears', 'Running away'], [HP, QR], 'Sat in a shaded quiet area with headphones', 'Calm but tired', ''],
      [20, 18, 15, 3, 'Mealtime Changes', 'Dinner texture change', 'Home', 'Normal', 8, 'Hungry', 20, ['Crying'], [HUG, TOY], 'Served the familiar version of the meal', 'Calm', ''],
      [18, 7, 45, 4, 'Clothing / Texture', 'Wearing socks', 'Home', 'Normal', 7, 'Normal', 25, ['Crying', 'Screaming'], [WB, HUG], 'Switched to seamless socks', 'Calm but tired', ''],
      [15, 12, 40, 3, 'Loud Noise / Crowds', 'Cafeteria Lunch', 'School Cafeteria', 'Loud', 8, 'Hungry', 16, ['Covering ears', 'Shutting down'], [HP, QR], 'Wore headphones at the quiet table', 'Calm', ''],
      [12, 7, 30, 3, 'Clothing / Texture', 'Getting dressed for school', 'Home', 'Normal', 8, 'Normal', 15, ['Crying'], [HUG], 'Chose between two outfits herself', 'Calm', 'Laid out clothes the night before.'],
      [9, 17, 50, 2, 'Mealtime Changes', 'Trying a new vegetable', 'Home', 'Quiet', 8, 'Normal', 10, ['Shutting down'], [TOY], 'Allowed one small taste, no pressure', 'Calm', ''],
      [6, 14, 5, 3, 'Loud Noise / Crowds', 'Library visit with school bell', 'School Library', 'Loud', 8, 'Normal', 12, ['Covering ears'], [HP], 'Used headphones during the bell', 'Calm', ''],
      [3, 7, 35, 2, 'Clothing / Texture', 'Getting dressed for school', 'Home', 'Normal', 9, 'Normal', 8, ['Crying'], [HUG], 'Used the pre-chosen soft outfit', 'Calm', ''],
      [1, 13, 0, 2, 'Mealtime Changes', 'Cafeteria Lunch', 'School Cafeteria', 'Normal', 9, 'Normal', 7, ['Shutting down'], [TOY], 'Offered her usual lunch', 'Calm and cheerful', 'Recovered quickly.']
    ],
    routines: [
      { title: 'Lay Out Clothes the Night Before', category: 'Night', scheduleTime: '19:30' },
      { title: 'Morning Choice Board (2 outfits)', category: 'Morning', scheduleTime: '07:15' },
      { title: 'Headphones for Cafeteria', category: 'School', scheduleTime: '12:45' },
      { title: 'Painting Break After School', category: 'School', scheduleTime: '16:00' },
      { title: 'Weighted Blanket Wind-down', category: 'Night', scheduleTime: '20:15' }
    ],
    routineLogs: [
      ['completed', 'completed', 'completed', 'completed', 'completed', 'skipped', 'completed'],
      ['completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed'],
      ['completed', 'skipped', 'completed', 'completed', 'completed', 'completed', 'skipped'],
      ['pending', 'completed', 'completed', 'completed', 'skipped', 'completed', 'completed'],
      ['pending', 'completed', 'completed', 'skipped', 'completed', 'completed', 'completed']
    ],
    notes: [
      ['therapist', 12, 18, 'Limiting clothing choices to two options is reducing morning distress. Keep tags removed and use seamless socks.'],
      ['parent', 7, 19, 'Laying out clothes the night before is a big help. She tried one bite of a new vegetable without crying.'],
      ['therapist', 1, 18, 'Episode intensity down from 4-5 to 2-3. Continue gradual food exposure with no pressure.']
    ],
    goals: [
      { area: 'Daily Living', title: 'Get dressed with a 2-choice board and one prompt', targetScore: 80 },
      { area: 'Colors', title: 'Name 6 colors when painting', targetScore: 85 },
      { area: 'Emotions', title: 'Name 4 basic feelings using cards', targetScore: 75 },
      { area: 'Sensory Regulation', title: 'Ask for a quiet space when sounds get too loud', targetScore: 80 }
    ],
    therapistProgress: [[21, 40, 'Therapist review: needs adult help to cope with clothing textures.'], [11, 58, 'Therapist review: accepts the choice board and soft clothes with a prompt.'], [2, 76, 'Therapist review: dresses with only one reminder.']],
    milestone: [3, 'Chose and wore a school outfit without help'],
    attempts: [
      [14, 'colors', [2, 2, 1], 4, 9, 'Strong on colors from her painting.'],
      [12, 'my-feelings', [1, 1, 1], 3, 11, 'Used cards to point at feelings.'],
      [10, 'daily-routine', [1, 1, 0, 1], 3, 12, 'Dressing step is hard, brush teeth easy.'],
      [8, 'colors', [2, 2, 2], 5, 7, 'Named all colors and mixed two paints.'],
      [6, 'match-the-same', [2, 2, 2], 4, 8, 'Matched all pairs quickly.'],
      [4, 'daily-routine', [2, 1, 1, 2], 4, 11, 'Dressing improved with the choice board.'],
      [2, 'my-feelings', [2, 2, 1], 4, 9, 'Named happy, sad and angry.']
    ],
    lessonProgress: { chapters: 1, extraLessons: 1 },
    feedback: [['Quiet Reading Nook', 'Completed', 'Stayed 25 minutes with a music box.', 5], ['Water Play Calm-down', 'Completed', 'Loved the warm water and cups.', 4], ['Feelings Cards', 'Completed', 'Drew each feeling as a cat.', 3], ['Sort by Color', 'Completed', 'Sorted paint tubes into cups.', 1]]
  },
  {
    parent: { name: 'Divya Nair', email: 'divya.nair@example.com', role: 'parent' },
    child: {
      name: 'Kabir Nair', dob: '2020-11-02T00:00:00Z',
      interests: ['Trucks', 'Lining up blocks', 'Water play', 'Spinning toys'],
      notes: 'Becomes upset when he has to wait or when a favorite activity ends. Responds well to visual timers, first-then boards and clear endings. Tends to have more difficulty in the late afternoon.',
      primaryTriggers: ['Waiting / Delays', 'Screen Time Ending', 'Bright / Flickering Lights', 'Routine Interruption'],
      calmingStrategies: ['Deep Breathing', 'Favorite Toy', 'Weighted Blanket', 'Noise Canceling Headphones']
    },
    teacher: { name: 'Ms. Fernandes', email: 'teacher@brightstart-school.example', phone: '+91 98200 88801' },
    doctor: { name: 'Dr. Kulkarni', email: 'clinic@kulkarni-kids.example', phone: '+91 98200 88802' },
    parentPhone: '+91 98765 55501',
    episodes: [
      [28, 17, 30, 4, 'Screen Time Ending', 'Tablet time finished', 'Home', 'Quiet', 7, 'Normal', 30, ['Screaming', 'Hitting'], [WB, BR], 'Used the first-then board and a calm voice', 'Tired', ''],
      [26, 11, 15, 3, 'Waiting / Delays', 'Waiting for turn at the slide', 'Playground', 'Crowded', 8, 'Normal', 15, ['Crying', 'Running away'], [TOY, BR], 'Practised counting to 5 while waiting', 'Calm', ''],
      [24, 16, 50, 5, 'Routine Interruption', 'Visitors arrived at home', 'Home', 'Loud', 6, 'Hungry', 38, ['Screaming', 'Hitting', 'Shutting down'], [QR, WB, HP], 'Moved to his room with a weighted blanket', 'Exhausted', 'No warning about the visitors.'],
      [21, 12, 30, 3, 'Bright / Flickering Lights', 'Lunch at the supermarket', 'Supermarket', 'Crowded', 8, 'Hungry', 20, ['Covering ears', 'Crying'], [HP, TOY], 'Left the aisle and sat near the entrance', 'Calm but tired', ''],
      [19, 17, 15, 4, 'Screen Time Ending', 'Tablet time finished', 'Home', 'Quiet', 7, 'Normal', 24, ['Screaming', 'Crying'], [BR, WB], 'Gave a 5-minute and 1-minute warning', 'Calm', ''],
      [16, 10, 40, 3, 'Waiting / Delays', 'Waiting for snack time', 'Classroom', 'Normal', 8, 'Hungry', 14, ['Crying', 'Rocking'], [TOY, BR], 'Showed the visual timer', 'Calm', ''],
      [14, 18, 10, 4, 'Routine Interruption', 'Bath time moved later', 'Home', 'Normal', 7, 'Normal', 22, ['Screaming', 'Hitting'], [WB, HUG], 'Used the picture schedule to explain the change', 'Calm but tired', ''],
      [11, 17, 45, 3, 'Screen Time Ending', 'Tablet time finished', 'Home', 'Quiet', 8, 'Normal', 14, ['Crying'], [BR, TOY], 'First-then board: tablet then trucks', 'Calm', ''],
      [8, 11, 20, 2, 'Waiting / Delays', 'Waiting for turn at the slide', 'Playground', 'Normal', 8, 'Normal', 9, ['Crying'], [BR], 'Counted to 5 on his own', 'Calm and cheerful', ''],
      [6, 12, 10, 3, 'Bright / Flickering Lights', 'Visiting a clinic', 'Clinic Waiting Room', 'Normal', 8, 'Normal', 12, ['Covering ears', 'Rocking'], [HP, TOY], 'Sat with sunglasses and headphones', 'Calm', ''],
      [3, 17, 30, 2, 'Screen Time Ending', 'Tablet time finished', 'Home', 'Quiet', 9, 'Normal', 7, ['Crying'], [BR], 'Used the timer and turned it off himself', 'Calm and cheerful', 'Turned the tablet off with only one prompt.'],
      [1, 16, 55, 2, 'Routine Interruption', 'Dinner time moved', 'Home', 'Normal', 9, 'Normal', 6, ['Rocking'], [TOY], 'Showed the updated schedule', 'Calm', '']
    ],
    routines: [
      { title: 'Visual Timer for Screen Time', category: 'Evening', scheduleTime: '17:15' },
      { title: 'First-Then Board at Snack Time', category: 'School', scheduleTime: '10:30' },
      { title: 'Morning Picture Schedule', category: 'Morning', scheduleTime: '07:30' },
      { title: 'Truck Play Wind-down', category: 'Evening', scheduleTime: '18:45' },
      { title: 'Bedtime Breathing & Weighted Blanket', category: 'Night', scheduleTime: '20:00' }
    ],
    routineLogs: [
      ['pending', 'completed', 'completed', 'skipped', 'completed', 'completed', 'completed'],
      ['completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'skipped'],
      ['completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed'],
      ['pending', 'completed', 'skipped', 'completed', 'completed', 'skipped', 'completed'],
      ['pending', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed']
    ],
    notes: [
      ['therapist', 11, 18, 'Visual timers and a first-then board are helping with screen time endings. Always give a 5-minute and 1-minute warning.'],
      ['parent', 5, 19, 'Unexpected visitors were the worst day. We now tell Kabir about guests using a picture card in the morning.'],
      ['therapist', 1, 18, 'Late-afternoon episodes are shorter and milder. Keep clear endings for favorite activities.']
    ],
    goals: [
      { area: 'Visual Matching', title: 'Match identical pictures independently', targetScore: 85 },
      { area: 'Early Math', title: 'Count objects from 1 to 5 independently', targetScore: 80 },
      { area: 'Daily Living', title: 'Follow a 4-step picture routine with one prompt', targetScore: 75 },
      { area: 'Sensory Regulation', title: 'Wait for 2 minutes using a visual timer', targetScore: 80 }
    ],
    therapistProgress: [[20, 35, 'Therapist review: struggles to wait without a visual timer.'], [10, 55, 'Therapist review: waits 1 minute with the timer and a toy.'], [2, 72, 'Therapist review: waits 2 minutes with a timer, ends screen time with one prompt.']],
    milestone: [3, 'Turned off the tablet with one prompt'],
    attempts: [
      [14, 'match-the-same', [2, 1, 2], 4, 8, 'Likes matching trucks, lost interest on the third item.'],
      [12, 'numbers-1-5', [2, 1, 1, 0, 0], 3, 11, 'Counted blocks to 2 alone.'],
      [10, 'shapes', [1, 1, 1], 3, 10, 'Needed prompts, enjoyed lining shapes up.'],
      [8, 'match-the-same', [2, 2, 2], 5, 7, 'Perfect matching with the visual timer on.'],
      [6, 'daily-routine', [1, 1, 1, 1], 3, 12, 'Followed steps with prompts.'],
      [4, 'numbers-1-5', [2, 2, 2, 1, 1], 4, 10, 'Counted trucks to 5 with a hint.'],
      [2, 'daily-routine', [2, 1, 2, 1], 4, 11, 'Better with the picture schedule.']
    ],
    lessonProgress: { chapters: 1, extraLessons: 0 },
    feedback: [['Water Play Calm-down', 'Completed', 'Stayed calm for 20 minutes.', 5], ['Train Track Counting', 'Completed', 'Counted trucks to 5.', 4], ['Bubble Breathing', 'Completed', 'Blew bubbles during the wait.', 2], ['Feelings Cards', 'Too Difficult', 'Not ready, try 2 cards first.', 1]]
  }
];

// ---------------------------------------------------------------------------------------------
async function ensureUser(acc) {
  let u = await M.User.findOne({ email: acc.email });
  if (!u) {
    u = await M.User.create({ ...acc, passwordHash: await bcrypt.hash(process.env.SEED_PASSWORD || 'password123', 10) });
    log(`+ user ${acc.email} (${acc.role})`);
  }
  return u;
}

async function wipeChild(child, parent) {
  const routines = await M.Routine.find({ childId: child._id }).select('_id');
  await Promise.all([M.Episode, M.Note, M.Contact, M.Goal, M.Progress, M.Milestone, M.Routine, M.ActivityFeedback, M.ActivityPlan, M.TeachingSubmission]
    .map((m) => m.deleteMany({ childId: child._id })));
  await M.RoutineLog.deleteMany({ routineId: { $in: routines.map((r) => r._id) } });
  await M.LearningProgress.deleteMany({ parentId: parent._id });
  await M.Child.deleteOne({ _id: child._id });
  log(`cleared ${child.name}`);
}

async function teachingAndProgress(child, attempts) {
  const mod = readJson('content', 'teaching', 'early-learning-foundations.json');
  if (!mod) { log('teaching content not found, skipping worksheets'); return; }
  const sheets = new Map(mod.chapters.flatMap((c) => c.worksheets).map((w) => [w.id, w]));
  const mastered = new Set(); let made = 0;
  for (const [daysAgo, wid, levels, engagement, minutes, notes] of attempts) {
    const w = sheets.get(wid);
    if (!w || w.items.length !== levels.length) { log(`skip "${wid}" (content changed)`); continue; }
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
  if (made) log(`+ ${made} worksheet attempts for ${child.name}`);
}

async function learningProgress(parent, { chapters, extraLessons }) {
  const mod = readJson('content', 'learning', 'understanding-autism.json');
  if (!mod) return;
  if (await M.LearningProgress.countDocuments({ parentId: parent._id, moduleSlug: mod.slug })) return;
  const lessons = [], quizzes = [], days = new Set();
  const stamp = (d) => { const t = at(d, 20, 30); days.add(dayKey(t)); return t; };
  mod.chapters.forEach((chapter, ci) => {
    const upTo = ci < chapters ? chapter.subchapters.length : ci === chapters ? extraLessons : 0;
    chapter.subchapters.slice(0, upTo).forEach((lesson, li) => {
      const total = (lesson.questions || []).length;
      lessons.push({ subId: lesson.id, total, correct: total > 1 && li === 1 ? total - 1 : total, completedAt: stamp(Math.max(2, 10 - ci * 3 - li)) });
    });
    if (ci < chapters) {
      const total = (chapter.quiz || []).length, score = Math.max(0, total - 1);
      quizzes.push({ chapterId: chapter.id, total, attempts: 1, best: score, last: score, lastAt: stamp(6 - ci) });
    }
  });
  stamp(1); stamp(0);
  await M.LearningProgress.create({ parentId: parent._id, moduleSlug: mod.slug, lessons, quizzes, activityDays: [...days].sort(), lastActiveAt: at(0, 8) });
  log(`+ learning progress for ${parent.name}`);
}

const ACTIVITIES = [ // same titles as seed.js, upserted so nothing is duplicated
  { title: 'Bubble Breathing', category: 'Regulation', description: 'Slow breaths while blowing bubbles.', minAge: 3, maxAge: 10, tags: ['calming'] },
  { title: 'Sort by Color', category: 'Focus', description: 'Sort small objects by color into cups.', minAge: 3, maxAge: 8, tags: ['focus'] },
  { title: 'Quiet Reading Nook', category: 'Sensory', description: 'Build a low-stimulation corner with cushions and soft light.', minAge: 4, maxAge: 12, tags: ['sensory'] },
  { title: 'Train Track Counting', category: 'Early Math', description: 'Count wooden train carriages together, 1 to 5.', minAge: 4, maxAge: 8, tags: ['focus', 'interests'] },
  { title: 'Water Play Calm-down', category: 'Sensory', description: 'Warm water, cups and funnels in a quiet space.', minAge: 3, maxAge: 9, tags: ['sensory', 'calming'] },
  { title: 'Feelings Cards', category: 'Emotions', description: "Match face cards to how we feel and point to today's feeling.", minAge: 4, maxAge: 9, tags: ['emotions'] }
];

async function activities(child, feedback) {
  for (const a of ACTIVITIES) await M.Activity.updateOne({ title: a.title }, { $setOnInsert: a }, { upsert: true });
  if (await M.ActivityFeedback.countDocuments({ childId: child._id })) return;
  const byTitle = Object.fromEntries((await M.Activity.find({ title: { $in: ACTIVITIES.map((a) => a.title) } })).map((a) => [a.title, a]));
  const docs = feedback.filter(([t]) => byTitle[t]).map(([t, rating, notes, d]) => ({ activityId: byTitle[t]._id, childId: child._id, rating, notes, ts: at(d, 16) }));
  if (docs.length) { await M.ActivityFeedback.create(docs); log(`+ ${docs.length} activity feedback for ${child.name}`); }
}

async function seedOne(spec, therapist, resetThese) {
  const parent = await ensureUser(spec.parent);
  let child = await M.Child.findOne({ parentId: parent._id, name: spec.child.name });
  if (resetThese && child) { await wipeChild(child, parent); child = null; }
  if (!child) {
    child = await M.Child.create({ parentId: parent._id, ...spec.child, dob: new Date(spec.child.dob), grants: [therapist._id] });
    log(`+ child ${spec.child.name}`);
  } else if (!(child.grants || []).some((g) => String(g) === String(therapist._id))) {
    child.grants.push(therapist._id); await child.save();
  }
  const id = child._id;
  const only = async (Model, make, label) => {
    if (await Model.countDocuments({ childId: id })) return;
    const docs = make(); await Model.create(docs); log(`+ ${docs.length} ${label} for ${child.name}`);
  };

  await only(M.Episode, () => spec.episodes.map(([d, h, m, intensity, trigger, activity, location, sensoryEnvironment, sleepHours, hungerLevel, mins, behaviors, calmingInterventions, response, postEpisodeBehavior, notes]) => ({
    childId: id, ts: at(d, h, m), intensity, trigger, activity, location, sensoryEnvironment, sleepHours, hungerLevel,
    durationMinutes: mins, recoveryMinutes: Math.round(mins * 0.8), behaviors, calmingInterventions, response, postEpisodeBehavior, notes
  })), 'episodes');

  if (!(await M.Routine.countDocuments({ childId: id }))) {
    const created = await M.Routine.create(spec.routines.map((r, i) => ({ ...r, childId: id, completed: spec.routineLogs[i][0] === 'completed' })));
    const logs = [];
    created.forEach((r, i) => spec.routineLogs[i].forEach((status, d) => logs.push({ routineId: r._id, date: dayKey(at(d, 12)), status })));
    await M.RoutineLog.create(logs);
    log(`+ ${created.length} routines, ${logs.length} routine logs for ${child.name}`);
  }

  await only(M.Contact, () => [
    { childId: id, name: therapist.name, role: 'Therapist', email: therapist.email, phone: '+91 98765 43210' },
    { childId: id, name: spec.teacher.name, role: 'Class Teacher', email: spec.teacher.email, phone: spec.teacher.phone },
    { childId: id, name: spec.doctor.name, role: 'Pediatrician', email: spec.doctor.email, phone: spec.doctor.phone },
    { childId: id, name: parent.name, role: 'Parent', email: parent.email, phone: spec.parentPhone }
  ], 'contacts');

  await only(M.Note, () => spec.notes.map(([who, d, h, text]) => ({
    childId: id, author: who === 'therapist' ? therapist.name : parent.name, authorRole: who === 'therapist' ? 'Therapist' : 'Parent', ts: at(d, h), text
  })), 'notes');

  await only(M.Goal, () => spec.goals.map((g) => ({ childId: id, ...g })), 'goals');

  if (!(await M.Progress.countDocuments({ childId: id, obs: /^Therapist/ }))) {
    await M.Progress.create(spec.therapistProgress.map(([d, score, obs]) => ({ childId: id, ts: at(d, 18), area: 'Sensory Regulation', score, obs })));
    await M.Milestone.create({ childId: id, ts: at(spec.milestone[0], 12), title: spec.milestone[1] });
    log(`+ therapist progress reviews + milestone for ${child.name}`);
  }

  if (!(await M.TeachingSubmission.countDocuments({ childId: id }))) await teachingAndProgress(child, spec.attempts);
  await activities(child, spec.feedback);
  await learningProgress(parent, spec.lessonProgress);
}

async function seedMoreChildren({ resetThese = false } = {}) {
  const therapist = await ensureUser(THERAPIST);
  const ids = {};
  for (const spec of CHILDREN) {
    await seedOne(spec, therapist, resetThese);
    ids[spec.child.name] = spec.parent.email;
  }
  log('ready. Parent logins:', ids, '| therapist:', THERAPIST.email);
  return ids;
}

module.exports = { seedMoreChildren, CHILDREN };

if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/neuroai')
    .then(() => seedMoreChildren({ resetThese: process.argv.includes('--reset-these') }))
    .then(() => mongoose.disconnect())
    .catch((err) => { console.error('Seeding error:', err); process.exit(1); });
}