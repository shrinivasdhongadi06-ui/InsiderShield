import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmail extends Document {
  senderId: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  message: string;
  timestamp: Date;
}

const EmailSchema = new Schema<IEmail>(
  {
    senderId: {
      type: String,
      required: true,
      index: true,
    },
    senderEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Email: Model<IEmail> =
  mongoose.models.Email || mongoose.model<IEmail>('Email', EmailSchema);
