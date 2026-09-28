const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['parent', 'therapist'], required: true }
});

// Child Schema
const childSchema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  interests: [String],
  notes: String,
  grants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Therapists given access
});

// Behavioral Episode Schema
const episodeSchema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  ts: { type: Date, default: Date.now },
  intensity: { type: Number, min: 1, max: 5, required: true },
  location: String,
  activity: String,
  trigger: String,
  notes: String
});

// Note Schema
const noteSchema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  author: { type: String, required: true },
  ts: { type: Date, default: Date.now },
  text: { type: String, required: true }
});

// Care Team Contact Schema
const contactSchema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  name: { type: String, required: true },
  role: String,
  phone: String,
  email: String
});

// Goal & Progress Schemas
const goalSchema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  area: String,
  title: String,
  targetScore: Number,
  currentScore: Number
});

const progressSchema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal' },
  ts: { type: Date, default: Date.now },
  area: String,
  score: Number,
  obs: String
});

// Milestone Schema
const milestoneSchema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  title: String,
  ts: { type: Date, default: Date.now }
});

// Routine & Routine Log Schemas
const routineSchema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  title: String,
  scheduleTime: String
});

const routineLogSchema = new mongoose.Schema({
  routineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Routine', required: true },
  date: String,
  status: { type: String, enum: ['completed', 'pending', 'skipped'], default: 'pending' }
});

// Activity & Feedback Schemas
const activitySchema = new mongoose.Schema({
  name: String,
  minAge: Number,
  maxAge: Number,
  area: String,
  tags: [String],
  desc: String
});

const activityFeedbackSchema = new mongoose.Schema({
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  rating: Number,
  notes: String
});

module.exports = {
  User: mongoose.model('User', userSchema),
  Child: mongoose.model('Child', childSchema),
  Episode: mongoose.model('Episode', episodeSchema),
  Note: mongoose.model('Note', noteSchema),
  Contact: mongoose.model('Contact', contactSchema),
  Goal: mongoose.model('Goal', goalSchema),
  Progress: mongoose.model('Progress', progressSchema),
  Milestone: mongoose.model('Milestone', milestoneSchema),
  Routine: mongoose.model('Routine', routineSchema),
  RoutineLog: mongoose.model('RoutineLog', routineLogSchema),
  Activity: mongoose.model('Activity', activitySchema),
  ActivityFeedback: mongoose.model('ActivityFeedback', activityFeedbackSchema)
};