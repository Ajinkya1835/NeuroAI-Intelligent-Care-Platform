const mongoose = require('mongoose');
const { Child, Episode, Routine, Note, User } = require('./models');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/neuroai';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Child.deleteMany({}),
      Episode.deleteMany({}),
      Routine.deleteMany({}),
      Note.deleteMany({})
    ]);

    // 1. Create Test Users
    const parent = await User.create({
      name: 'Sarah Jenkins',
      email: 'sarah@example.com',
      role: 'parent',
      password: 'password123'
    });

    const therapist = await User.create({
      name: 'Dr. Emily Vance',
      email: 'dr.vance@neurocare.com',
      role: 'therapist',
      password: 'password123'
    });

    // 2. Create Child Profile
    const child = await Child.create({
      name: 'Alex Jenkins',
      age: 6,
      parentId: parent._id,
      primaryTriggers: ['Loud Noise / Crowds', 'Separation Anxiety', 'Routine Interruption'],
      calmingStrategies: ['Weighted Blanket', 'Noise-Canceling Headphones', 'Deep Breathing Cards']
    });

    // 3. Create Sample Episodes
    await Episode.create([
      {
        childId: child._id,
        intensity: 3,
        trigger: 'Separation Anxiety',
        activity: 'Morning Drop-off',
        durationMinutes: 15,
        location: 'School Entrance',
        timestamp: new Date('2026-09-28T14:00:00')
      },
      {
        childId: child._id,
        intensity: 4,
        trigger: 'Loud Noise / Crowds',
        activity: 'Cafeteria Lunch',
        durationMinutes: 25,
        location: 'School Cafeteria',
        timestamp: new Date('2026-09-27T13:45:00')
      },
      {
        childId: child._id,
        intensity: 2,
        trigger: 'Routine Interruption',
        activity: 'Transition to Math Class',
        durationMinutes: 10,
        location: 'Classroom',
        timestamp: new Date('2026-09-26T10:15:00')
      }
    ]);

    // 4. Create Routines
    await Routine.create([
      { childId: child._id, title: 'Morning Visual Schedule', category: 'Morning', completed: true },
      { childId: child._id, title: 'Wear Sensory Headphones at Recess', category: 'School', completed: true },
      { childId: child._id, title: '5-Min Quiet Time Before Dinner', category: 'Evening', completed: false },
      { childId: child._id, title: 'Bedtime Story & Weighted Blanket', category: 'Night', completed: true }
    ]);

    // 5. Create Therapist Notes
    await Note.create({
      childId: child._id,
      authorName: therapist.name,
      authorRole: 'Occupational Therapist',
      content: 'Alex showed great progress with headphone adoption during noisy transitions this week. Recommend continuing sensory breaks before 2:00 PM.',
      timestamp: new Date()
    });

    console.log('Database seeded successfully with test users and child profile!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();