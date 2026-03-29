import { ILog } from '../models/Log';
import { Workflow } from '../models/Workflow';
import { NotificationProvider } from './providers/types';
import { DiscordProvider } from './providers/discord';

const providers: Record<string, NotificationProvider> = {
  discord: new DiscordProvider(),
};

/**
 * Evaluates a given log against project workflows and triggers configured providers.
 * Designed to be called as a fire-and-forget background task.
 */
export const dispatchWorkflow = async (log: ILog) => {
  try {
    const workflows = await Workflow.find({
      projectId: log.projectId,
      isActive: true,
    });

    if (!workflows || workflows.length === 0) return;

    for (const workflow of workflows) {
      let isTriggered = false;

      if (workflow.triggerLevel === '*') {
        isTriggered = true;
      } else if (workflow.triggerLevel === log.level) {
        isTriggered = true;
      }

      if (isTriggered) {
        const provider = providers[workflow.providerType.toLowerCase()];
        if (provider) {
          // Fire and forget
          provider.notify(log, workflow.providerConfig).catch(err => {
            console.error(`Background workflow dispatch error for ${workflow.providerType}:`, err);
          });
        } else {
          console.warn(`Provider type ${workflow.providerType} is not registered.`);
        }
      }
    }
  } catch (error) {
    console.error('Error in workflow engine:', error);
  }
};
