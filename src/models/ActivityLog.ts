import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivityLog extends Document {
  employeeId: mongoose.Types.ObjectId;
  action: string;
  timestamp: Date;
  details: string;
  device: string;
  ipAddress: string;
  riskScore: number;
  loginHour: number;
  downloads: number;
  filesAccessed: number;
  location: string;
  sessionDuration: number;
  anomalyScore: number;
  trustImpact: number;
  sessionId?: string; // groups related events into one behavioral session
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    details: {
      type: String,
      default: '',
      trim: true,
    },
    device: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    ipAddress: {
      type: String,
      default: '0.0.0.0',
      trim: true,
    },
    riskScore: {
      type: Number,
      default: 0,
    },
    loginHour: {
      type: Number,
      min: 0,
      max: 23,
      default: 9,
    },
    downloads: {
      type: Number,
      default: 0,
      min: 0,
    },
    filesAccessed: {
      type: Number,
      default: 0,
      min: 0,
    },
    location: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    sessionDuration: {
      type: Number,
      default: 0,
      min: 0,
    },
    anomalyScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    trustImpact: {
      type: Number,
      default: 0,
    },
    sessionId: {
      type: String,
      default: null,
      index: true,  // supports future ML session grouping queries
      trim: true,
    },
  },
  { timestamps: true }
);

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog ||
  mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
