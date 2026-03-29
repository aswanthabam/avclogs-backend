import mongoose, { Schema, model, Document, Types } from 'mongoose';

export interface IProject extends Document {
  userId: Types.ObjectId;
  name: string;
  apiKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    apiKey: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

export const Project = mongoose.models.Project || model<IProject>('Project', projectSchema);
