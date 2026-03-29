import mongoose, { Schema, model, Document, Types } from 'mongoose';

export interface ISession extends Document {
  userId: Types.ObjectId;
  token: string;       // The JWT issued for this session
  createdAt: Date;
  expiresAt: Date;
}

const sessionSchema = new Schema<ISession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token: { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: Date.now },
  // TTL index: MongoDB auto-purges expired sessions
  expiresAt: { type: Date, required: true, expires: 0 },
});

export const Session = mongoose.models.Session || model<ISession>('Session', sessionSchema);
