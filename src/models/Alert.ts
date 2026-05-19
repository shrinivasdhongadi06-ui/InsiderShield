import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAlert extends Document {
  employeeId: mongoose.Types.ObjectId;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  title: string;
  description: string;
  reasoning: string[];
  status: 'Open' | 'Investigating' | 'Resolved' | 'Isolated';
  timestamp: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    reasoning: [{ type: String }], // AI Explainability human-readable strings
    status: { type: String, enum: ['Open', 'Investigating', 'Resolved', 'Isolated'], default: 'Open' },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Alert: Model<IAlert> = mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
