import { ILog } from '../../models/Log';

export interface ProviderConfig {
  [key: string]: any;
}

export interface NotificationProvider {
  /**
   * Sends a notification payload to the specified provider configuration.
   * @param log Log payload to notify about
   * @param config Provider specific config (like webhookUrl)
   */
  notify(log: ILog, config: ProviderConfig): Promise<void>;
}
