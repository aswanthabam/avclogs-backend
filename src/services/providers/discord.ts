import { NotificationProvider, ProviderConfig } from './types';
import { ILog } from '../../models/Log';

export class DiscordProvider implements NotificationProvider {
  async notify(log: ILog, config: ProviderConfig): Promise<void> {
    const webhookUrl = config.webhookUrl;
    if (!webhookUrl) {
      console.warn('Discord provider config is missing webhookUrl. Aborting notification.');
      return;
    }

    const payload = {
      content: `🚨 **Log Alert [${log.level.toUpperCase()}]**`,
      embeds: [
        {
          title: 'Alert Notification',
          description: log.message,
          color: this.getColorForLevel(log.level),
          fields: [
            { name: 'Environment', value: log.environment || 'N/A', inline: true },
            { name: 'Project ID', value: log.projectId.toString(), inline: true },
            { name: 'Timestamp', value: new Date(log.timestamp).toISOString(), inline: false },
          ]
        }
      ]
    };

    if (log.stackTrace) {
      payload.embeds[0].fields.push({
        name: 'Stack Trace',
        value: `\`\`\`\n${log.stackTrace.substring(0, 1000)}\n\`\`\``,
        inline: false
      });
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error(`Discord webhook failed with status: ${response.status} ${response.statusText}`);
      } else {
        console.log(`Successfully dispatched log to Discord for project: ${log.projectId}`);
      }
    } catch (error) {
      console.error('Error dispatching to Discord:', error);
    }
  }

  private getColorForLevel(level: string): number {
    switch (level) {
      case 'info': return 3447003; // Blue
      case 'warning': return 16776960; // Yellow
      case 'error': return 15158332; // Red
      case 'critical': return 10038562; // Dark Red
      case 'debug': return 9807270; // Grey
      default: return 3447003;
    }
  }
}
