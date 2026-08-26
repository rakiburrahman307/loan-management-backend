import {
     checkAlerts,
     checkQueueHealth,
     performAutoMaintenance,
} from '../helpers/bullMQ/queueMonitoring';
import { errorLogger, logger } from '../shared/logger';
import colors from 'colors';

export function startRealtimeMonitoring(intervalMs: number = 60000) {
     logger.info(colors.bgCyan.black('🔍 Starting real-time queue monitoring...\n'));

     const monitoringInterval = setInterval(async () => {
          try {
               const health = await checkQueueHealth();

               if (!health.healthy) {
                    await checkAlerts();
               }

               // Auto maintenance every hour
               const now = new Date();
               if (now.getMinutes() === 0) {
                    await performAutoMaintenance();
               }
          } catch (error) {
               errorLogger.error(colors.red('Monitoring check failed:'), error);
          }
     }, intervalMs);

     // Cleanup on shutdown
     process.on('SIGTERM', () => {
          clearInterval(monitoringInterval);
          logger.info(colors.yellow('Monitoring stopped'));
     });

     return monitoringInterval;
}
