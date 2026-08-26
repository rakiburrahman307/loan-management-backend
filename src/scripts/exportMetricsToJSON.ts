import { getAllQueuesStats } from '../DB/bullMQ';
import { checkQueueHealth, getQueuePerformanceMetrics } from '../helpers/bullMQ/queueMonitoring';
import { errorLogger, logger } from '../shared/logger';
import colors from 'colors';
export async function exportMetricsToJSON(filePath?: string): Promise<string> {
     try {
          const stats = await getAllQueuesStats();
          const health = await checkQueueHealth();
          const performance = await getQueuePerformanceMetrics();

          const metrics = {
               timestamp: new Date().toISOString(),
               health,
               statistics: stats,
               performance,
          };

          const jsonData = JSON.stringify(metrics, null, 2);

          if (filePath) {
               const fs = require('fs').promises;
               await fs.writeFile(filePath, jsonData);
               logger.info(colors.green(`✅ Metrics exported to ${filePath}`));
          }

          return jsonData;
     } catch (error) {
          errorLogger.error(colors.red('Failed to export metrics:'), error);
          throw error;
     }
}
