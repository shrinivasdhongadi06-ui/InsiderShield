import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  title: string;
  message: string;
  type: string; // 'announcement' | 'security' | 'reminder' | 'maintenance'
  timestamp: Date;
  employeeId?: string; // Optional (if targeted, otherwise broadcast)
}

const NotificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['announcement', 'security', 'reminder', 'maintenance'],
      default: 'announcement',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    employeeId: {
      type: String,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
