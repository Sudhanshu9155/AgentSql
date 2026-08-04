import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not set. Please add your MongoDB Atlas connection string to .env');
  process.exit(1);
}

// Atlas-compatible connection options
const mongooseOptions = {
  serverSelectionTimeoutMS: 10000,  // Timeout after 10s if Atlas is unreachable
  socketTimeoutMS: 45000,           // Close sockets after 45s of inactivity
};

mongoose.connect(MONGO_URI, mongooseOptions)
  .then(async () => {
    const host = mongoose.connection.host;
    console.log(`✅ Connected to MongoDB Atlas (${host})`);

    // Seed default admin only if collection is empty
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
    console.error('❌ MongoDB Atlas connection error:', err.message);
    process.exit(1);
  });

export default mongoose;
