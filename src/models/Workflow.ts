import mongoose, { Schema, model, Document, Types } from 'mongoose';

export interface IWorkflow extends Document {
  projectId: Types.ObjectId;
  triggerLevel: 'info' | 'warning' | 'error' | 'critical' | 'debug' | '*';
  providerType: string;
  providerConfig: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const workflowSchema = new Schema<IWorkflow>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    triggerLevel: { type: String, required: true },
    providerType: { type: String, required: true },
    providerConfig: { type: Schema.Types.Mixed, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Workflow = mongoose.models.Workflow || model<IWorkflow>('Workflow', workflowSchema);
