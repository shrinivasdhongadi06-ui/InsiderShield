import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITrustHistory extends Document {
  employeeId: mongoose.Types.ObjectId;
  score: number;
  timestamp: Date;
  changeReason: string;
  // ── Trust Intelligence Engine additions ──
  anomalyScore: number;       // 0–100 anomaly that triggered this change
  riskFactors: string[];      // e.g. ['UNKNOWN_DEVICE', 'AFTER_HOURS']
  sensitivity: string;        // 'Conservative' | 'Balanced' | 'Aggressive'
}

const TrustHistorySchema = new Schema<ITrustHistory>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
      index: true,
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: [0, 'Score cannot be below 0'],
      max: [100, 'Score cannot exceed 100'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    changeReason: {
      type: String,
      default: 'Score updated',
      trim: true,
    },
    anomalyScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    riskFactors: {
      type: [String],
      default: [],
    },
    sensitivity: {
      type: String,
      default: 'Balanced',
      trim: true,
    },
  },
  { timestamps: true }
);

export const TrustHistory: Model<ITrustHistory> =
  mongoose.models.TrustHistory ||
  mongoose.model<ITrustHistory>('TrustHistory', TrustHistorySchema);
