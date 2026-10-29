// One command to load the complete demo: 5 families, every feature populated.
//   npm run seed                 idempotent, creates only what is missing
//   npm run seed -- --reset      wipes ALL collections, then reseeds everything
const mongoose = require('mongoose');
const { runSeed } = require('./seed');
const { seedPeter } = require('./seedPeter');
const { seedMoreChildren } = require('./seedMoreChildren');
const { seedDemoComplete } = require('./seedDemoComplete');

async function seedAll({ reset = false } = {}) {
  await runSeed({ reset });      // Somik + therapist (reset wipes everything first)
  await seedPeter();
  await seedMoreChildren();      // Aarav, Zoya, Kabir
  await seedDemoComplete();      // plans, sensory worksheets, sensory lessons, needs-attention case
}
module.exports = { seedAll };

if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/neuroai')
    .then(() => seedAll({ reset: process.argv.includes('--reset') || process.argv.includes('--force') }))
    .then(() => mongoose.disconnect())
    .catch((err) => { console.error('Seeding error:', err); process.exit(1); });
}