import colors from 'colors';
import config from '../config';
import { logger } from '../shared/logger';

// Function to validate required configuration values
export function validateConfig(): void {
     const requiredConfigs = ['database_url', 'port', 'ip_address'];
     const missingConfigs = requiredConfigs.filter((key) => !config[key as keyof typeof config]);

     if (missingConfigs.length > 0) {
          throw new Error(`Missing required environment variables: ${missingConfigs.join(', ')}`);
     }

     // Validate port numbers
     if (isNaN(Number(config.port))) {
          throw new Error('Port port must be valid numbers');
     }

     // Log successful validation
     logger.info(colors.green('Config validation successful.'));
}
