import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  host: { type: String, required: true },
  port: { type: Number, required: true, default: 3306 },
  user: { type: String, required: true, default: '' },
  password: { type: String, default: '' },
  database: { type: String, required: true }
}, { timestamps: true });

export const Connection = mongoose.model('Connection', connectionSchema);
