const mongoose = require('mongoose');
const { Schema } = mongoose;
const oid = (ref, required = true) => ({ type: Schema.Types.ObjectId, ref, required });

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['parent', 'therapist'], required: true }
});

const childSchema = new Schema({
  parentId: oid('User'),
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  interests: [String],
  notes: String,
  primaryTriggers: [String],
  calmingStrategies: [String],
  grants: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

const episodeSchema = new Schema({
  childId: oid('Child'),
  ts: { type: Date, default: Date.now },
  intensity: { type: Number, min: 1, max: 5, required: true },
  location: String,
  activity: String,
  trigger: String,
  sensoryEnvironment: String,
  sleepHours: Number,
  hungerLevel: String,
  behaviors: [String],
  durationMinutes: Number,
  response: String,
  recoveryMinutes: Number,
  calmingInterventions: [String],
  postEpisodeBehavior: String,
  notes: String
});

const noteSchema = new Schema({
  childId: oid('Child'),
  author: { type: String, required: true },
  authorRole: String,
  ts: { type: Date, default: Date.now },
  text: { type: String, required: true }
});

const contactSchema = new Schema({
  childId: oid('Child'),
  name: { type: String, required: true },
  role: String,
  phone: String,
  email: String
});

const goalSchema = new Schema({
  childId: oid('Child'),
  area: String,
  title: String,
  targetScore: Number,
  currentScore: Number
});

const progressSchema = new Schema({
  childId: oid('Child'),
  goalId: oid('Goal', false),
  ts: { type: Date, default: Date.now },
  area: String,
  score: Number,
  obs: String
});

const milestoneSchema = new Schema({
  childId: oid('Child'),
  title: String,
  ts: { type: Date, default: Date.now }
});

const routineSchema = new Schema({
  childId: oid('Child'),
  title: { type: String, required: true },
  category: String,
  scheduleTime: String,
  completed: { type: Boolean, default: false }
});

const routineLogSchema = new Schema({
  routineId: oid('Routine'),
  date: String,
  status: { type: String, enum: ['completed', 'pending', 'skipped'], default: 'pending' }
});

const activitySchema = new Schema({
  title: { type: String, required: true },
  category: String,
  description: String,
  minAge: Number,
  maxAge: Number,
  tags: [String]
});

const activityFeedbackSchema = new Schema({
  activityId: oid('Activity'),
  childId: oid('Child'),
  rating: String,
  notes: String,
  ts: { type: Date, default: Date.now }
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