import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMeetingParticipation extends Document {
  employeeId: string;
  meetingId: string;
  joinedAt: Date;
}

const MeetingParticipationSchema = new Schema<IMeetingParticipation>(
  {
    employeeId: {
      type: String,
      required: true,
      index: true,
    },
    meetingId: {
      type: String,
      required: true,
      index: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const MeetingParticipation: Model<IMeetingParticipation> =
  mongoose.models.MeetingParticipation ||
  mongoose.model<IMeetingParticipation>('MeetingParticipation', MeetingParticipationSchema);
