import mongoose, { Schema, model, Document, Types } from 'mongoose';

export interface ILog extends Document {
  projectId: Types.ObjectId;
  level: 'info' | 'warning' | 'error' | 'critical' | 'debug';
  message: string;
  stackTrace?: string | null;
  metadata: Record<string, any>;
  environment: string;
  timestamp: Date;
}

const logSchema = new Schema<ILog>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    level: { 
      type: String, 
      enum: ['info', 'warning', 'error', 'critical', 'debug'], 
      required: true 
    },
    message: { type: String, required: true },
    stackTrace: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    environment: { type: String, default: 'production' },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export const Log = mongoose.models.Log || model<ILog>('Log', logSchema);
