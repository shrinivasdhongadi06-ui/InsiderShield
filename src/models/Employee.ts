import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmployee extends Document {
  name: string;
  department: string;
  role: string;
  email: string;
  currentTrustScore: number;
  status: 'Active' | 'Isolated' | 'Suspended';
  baseline: {
    usualLoginHours: string[];
    trustedDevices: string[];
    usualIPs: string[];
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
      usualLoginHours: [{ type: String }],
      trustedDevices: [{ type: String }],
      usualIPs: [{ type: String }],
    },
  },
  { timestamps: true }
);

export const Employee: Model<IEmployee> = mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);
