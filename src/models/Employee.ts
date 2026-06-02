import mongoose, { Schema, Document, Model } from 'mongoose';
import type { EmployeeStatus } from '@/types';

export interface IEmployee extends Document {
  name: string;
  department: string;
  role: string;
  email: string;
  currentTrustScore: number;
  status: EmployeeStatus;
  baseline: {
    normalLoginHourRange: string;
    trustedDevices: string[];
    usualIPs: string[];
    normalLocation: string;
    normalDownloads: number;
    normalFilesAccessed: number;
    normalSessionDuration: number;
  };
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    name: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    currentTrustScore: {
      type: Number,
      default: 100,
      min: [0, 'Trust score cannot be below 0'],
      max: [100, 'Trust score cannot exceed 100'],
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Isolated', 'Suspended'] satisfies EmployeeStatus[],
        message: '{VALUE} is not a valid employee status',
      },
      default: 'Active',
    },
    baseline: {
      normalLoginHourRange: {
        type: String,
        default: '09:00-17:00',
        trim: true,
      },
      trustedDevices: {
        type: [String],
        default: ['Corporate Laptop'],
      },
      usualIPs: {
        type: [String],
        default: ['192.168.1.100'],
      },
      normalLocation: {
        type: String,
        default: 'Office',
        trim: true,
      },
      normalDownloads: {
        type: Number,
        default: 5,
        min: 0,
      },
      normalFilesAccessed: {
        type: Number,
        default: 20,
        min: 0,
      },
      normalSessionDuration: {
        type: Number,
        default: 480,
        min: 0,
      },
    },
  },
  { timestamps: true }
);

export const Employee: Model<IEmployee> =
  mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);
