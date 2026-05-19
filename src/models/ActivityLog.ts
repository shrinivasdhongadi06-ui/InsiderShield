import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivityLog extends Document {
  employeeId: mongoose.Types.ObjectId;
  action: string;
  timestamp: Date;
  details: string;
  device: string;
  ipAddress: string;
  riskScore: number; // Positive for normal, negative for suspicious
  loginHour: number;
  downloads: number;
  filesAccessed: number;
  location: string;
  sessionDuration: number;
  anomalyScore: number;
  trustImpact: number;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    details: { type: String },
    device: { type: String },
    ipAddress: { type: String },
    riskScore: { type: Number, default: 0 },
    loginHour: { type: Number },
    downloads: { type: Number },
    filesAccessed: { type: Number },
    location: { type: String },
    sessionDuration: { type: Number },
    anomalyScore: { type: Number, default: 0 },
    trustImpact: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ActivityLog: Model<IActivityLog> = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
