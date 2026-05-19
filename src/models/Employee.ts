import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmployee extends Document {
  name: string;
  department: string;
  role: string;
  email: string;
  currentTrustScore: number;
  status: 'Active' | 'Isolated' | 'Suspended';
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
    name: { type: String, required: true },
    department: { type: String, required: true },
    role: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    currentTrustScore: { type: Number, default: 100 },
    status: { type: String, enum: ['Active', 'Isolated', 'Suspended'], default: 'Active' },
    baseline: {
  normalLoginHourRange: {
    type: String,
    default: '09:00-17:00',
  },

  trustedDevices: [{
    type: String,
  }],

  usualIPs: [{
    type: String,
  }],

  normalLocation: {
    type: String,
    default: 'Office',
  },

  normalDownloads: {
    type: Number,
    default: 5,
  },

  normalFilesAccessed: {
    type: Number,
    default: 20,
  },

  normalSessionDuration: {
    type: Number,
    default: 480,
  },
},
  },
  { timestamps: true }
);

export const Employee: Model<IEmployee> = mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);
