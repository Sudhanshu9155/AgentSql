import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agentsql';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    // Seed default admin only if table is empty
    const count = await User.countDocuments();
    if (count === 0) {
      const salt = bcrypt.genSaltSync(10);
      const adminHash = bcrypt.hashSync('admin123', salt);
      const userHash  = bcrypt.hashSync('user123', salt);

      await User.create([
        { name: 'Admin', email: 'admin@example.com', password: adminHash, role: 'admin' },
        { name: 'Demo User', email: 'user@example.com', password: userHash, role: 'user' }
      ]);
      console.log('✅ Database seeded with default admin and user accounts.');
    }
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

export default mongoose;
