import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMeeting extends Document {
  name: string;
  department: string;
  time: string;
  date: string;
}

const MeetingSchema = new Schema<IMeeting>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    time: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Meeting: Model<IMeeting> =
  mongoose.models.Meeting || mongoose.model<IMeeting>('Meeting', MeetingSchema);
