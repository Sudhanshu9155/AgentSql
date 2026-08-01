import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  question: { type: String, required: true },
  sql: { type: String },
  analysis: { type: String },
  columns: { type: Array, default: [] },
  rows: { type: Array, default: [] },
  row_count: { type: Number, default: 0 },
  chart_config: { type: Object },
  recommendations: { type: Array, default: [] },
  followups: { type: Array, default: [] },
  decision: { type: String }
}, { timestamps: true });

export const Chat = mongoose.model('Chat', chatSchema);
