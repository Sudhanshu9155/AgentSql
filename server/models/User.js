import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, default: '' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, default: 'user', enum: ['admin', 'user'] }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
