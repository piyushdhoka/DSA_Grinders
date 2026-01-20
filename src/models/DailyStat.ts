import mongoose from 'mongoose';

const DailyStatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  easy: { type: Number, default: 0 },
  medium: { type: Number, default: 0 },
  hard: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  ranking: { type: Number, default: 0 },
  weightedScore: { type: Number, default: 0 },
  dailyIncrease: { type: Number, default: 0 },
});

// Ensure uniqueness of (userId, date)
DailyStatSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyStat = mongoose.models.DailyStat || mongoose.model('DailyStat', DailyStatSchema);
