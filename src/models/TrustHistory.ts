import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITrustHistory extends Document {
  employeeId: mongoose.Types.ObjectId;
  score: number;
  timestamp: Date;
  changeReason: string;
}

const TrustHistorySchema = new Schema<ITrustHistory>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    score: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    changeReason: { type: String },
  },
  { timestamps: true }
);

export const TrustHistory: Model<ITrustHistory> = mongoose.models.TrustHistory || mongoose.model<ITrustHistory>('TrustHistory', TrustHistorySchema);
