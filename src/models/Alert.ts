import mongoose, { Schema, Document, Model } from 'mongoose';
import type { AlertSeverity, AlertStatus } from '@/types';

export interface IAlert extends Document {
  employeeId: mongoose.Types.ObjectId;
  severity: AlertSeverity;
  title: string;
  description: string;
  reasoning: string[];
  status: AlertStatus;
  timestamp: Date;
  resolvedAt?: Date;
  resolvedNote?: string;
}

const AlertSchema = new Schema<IAlert>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
      index: true,
    },
    severity: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High', 'Critical'] satisfies AlertSeverity[],
        message: '{VALUE} is not a valid severity level',
      },
      required: [true, 'Severity is required'],
    },
    title: {
      type: String,
      required: [true, 'Alert title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Alert description is required'],
      trim: true,
    },
    reasoning: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ['Open', 'Investigating', 'Resolved', 'Isolated', 'Escalated', 'FalsePositive'] satisfies AlertStatus[],
        message: '{VALUE} is not a valid alert status',
      },
      default: 'Open',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedNote: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

export const Alert: Model<IAlert> =
  mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
