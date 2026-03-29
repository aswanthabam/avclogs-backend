import mongoose, { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  avatarUrl?: string;
  provider: string; // e.g., 'google'
  providerId: string; // Google unique ID
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    avatarUrl: { type: String },
    provider: { type: String, required: true },
    providerId: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

// Prevent mongoose model overwrite error in serverless environment
export const User = mongoose.models.User || model<IUser>('User', userSchema);
