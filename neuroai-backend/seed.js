const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {
  User, Child, Episode, Note, Routine, Activity, ActivityFeedback, Progress, Milestone
} = require('./models');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/neuroai';
const at = (d, h, m = 0) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(h, m, 0, 0);
  return t;
};

async function seed() {
  await mongoose.connect(MONGO_URI);
  const force = process.argv.includes('--force');

  if (!force && (await Child.countDocuments()) > 0) {
    console.log('Data already exists, skipping seed. Use --force to wipe and reseed.');
    await mongoose.disconnect();
    return;
  }

  console.log('Connected, seeding...');

  await Promise.all([
    User, Child, Episode, Note, Routine, Activity, ActivityFeedback, Progress, Milestone
  ].map(m => m.deleteMany({})));

  const passwordHash = await bcrypt.hash('password123', 10);

  const parent = await User.create({
    name: 'Goon Sharma', email: 'goon@example.com', role: 'parent', passwordHash
  });
  const therapist = await User.create({
    name: 'Dr. Ajinkya', email: 'dr.ajinkya@neurocare.com', role: 'therapist', passwordHash
  });

  const dob = new Date();
  dob.setFullYear(dob.getFullYear() - 6);

  const child = await Child.create({
    name: 'Somik Sharma',
    dob,
    parentId: parent._id,
    grants: [therapist._id],
    primaryTriggers: ['Loud Noise / Crowds', 'Separation Anxiety', 'Routine Interruption'],
    calmingStrategies: ['Weighted Blanket', 'Noise-Canceling Headphones', 'Deep Breathing Cards']
  });

  await Episode.create([
    { childId: child._id, ts: at(1, 8, 30), intensity: 3, trigger: 'Separation Anxiety',
      activity: 'Morning Drop-off', location: 'School Entrance', durationMinutes: 15,
      behaviors: ['Crying'], calmingInterventions: ['Favorite Toy'] },
    { childId: child._id, ts: at(2, 13, 45), intensity: 4, trigger: 'Loud Noise / Crowds',
      activity: 'Cafeteria Lunch', location: 'School Cafeteria', durationMinutes: 25,
      behaviors: ['Covering ears', 'Shutting down'], calmingInterventions: ['Noise Canceling Headphones', 'Quiet Room'] },
    { childId: child._id, ts: at(3, 10, 15), intensity: 2, trigger: 'Routine Interruption',
      activity: 'Transition to Math Class', location: 'Classroom', durationMinutes: 10,
      behaviors: ['Rocking'], calmingInterventions: ['Deep Breathing'] },
    { childId: child._id, ts: at(5, 13, 30), intensity: 4, trigger: 'Loud Noise / Crowds',
      activity: 'Cafeteria Lunch', location: 'School Cafeteria', durationMinutes: 20,
      behaviors: ['Covering ears', 'Screaming'], calmingInterventions: ['Noise Canceling Headphones'] }
  ]);

  await Routine.create([
    { childId: child._id, title: 'Morning Visual Schedule', category: 'Morning', scheduleTime: '07:30', completed: true },
    { childId: child._id, title: 'Wear Sensory Headphones at Recess', category: 'School', scheduleTime: '11:00', completed: true },
    { childId: child._id, title: '5-Min Quiet Time Before Dinner', category: 'Evening', scheduleTime: '18:30', completed: false },
    { childId: child._id, title: 'Bedtime Story & Weighted Blanket', category: 'Night', scheduleTime: '20:00', completed: true }
  ]);

  await Note.create({
    childId: child._id,
    author: therapist.name,
    authorRole: 'Therapist',
    text: 'Great progress with headphone adoption during noisy transitions. Continue sensory breaks before 2:00 PM.'
  });

  await Milestone.create({ childId: child._id, title: 'Used visual cue to transition without support' });

  await Activity.create([
    { title: 'Bubble Breathing', category: 'Regulation', description: 'Slow breaths while blowing bubbles.', minAge: 3, maxAge: 10, tags: ['calming'] },
    { title: 'Sort by Color', category: 'Focus', description: 'Sort small objects by color into cups.', minAge: 3, maxAge: 8, tags: ['focus'] },
    { title: 'Quiet Reading Nook', category: 'Sensory', description: 'Build a low-stimulation corner with cushions and soft light.', minAge: 4, maxAge: 12, tags: ['sensory'] }
  ]);

  console.log('Seeded.');
  console.log(`Child id: ${child._id}`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});   