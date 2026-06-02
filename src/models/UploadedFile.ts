import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUploadedFile extends Document {
  employeeId: string;
  name: string;
  size: number;
  mimeType: string;
  content: string; // Base64 or plain text content
  uploadedAt: Date;
}

const UploadedFileSchema = new Schema<IUploadedFile>(
  {
    employeeId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const UploadedFile: Model<IUploadedFile> =
  mongoose.models.UploadedFile || mongoose.model<IUploadedFile>('UploadedFile', UploadedFileSchema);
