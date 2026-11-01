import '../config/loadEnv.js';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env before seeding.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_EMAIL must be a valid email address.');
  }

  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters and no more than 72 bytes.');
  }

  await connectDB();
  const hashedPassword = await bcrypt.hash(password, 12);
  const admin = await User.findOneAndUpdate(
    { email },
    {
      $set: { name: 'Administrator', email, password: hashedPassword, role: 'admin' },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );

  console.log(`Administrator account ready for ${admin.email}.`);
}

seedAdmin()
  .catch((error) => {
    console.error(`Admin seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    const mongoose = await import('mongoose');
    await mongoose.default.disconnect();
  });
