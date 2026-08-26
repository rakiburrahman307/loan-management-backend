import { logger } from '../shared/logger';
import { gracefulShutdown } from './shutdown';
import colors from 'colors';
import cluster from 'cluster';
export async function setupProcessHandlers() {
     if (cluster.isPrimary) {
          logger.warn('Process handlers should not be set up in master process');
          return;
     }
     const processId = process.pid;
     process.on('uncaughtException', async (error) => {
          const errorMessage =
               error && typeof error.message === 'string' ? error.message : String(error);
          if (errorMessage.includes('critical')) {
               logger.error(
                    colors.bgRed.white(`❌ Worker ${processId} UNCAUGHT EXCEPTION:`),
                    errorMessage,
               );
               gracefulShutdown('uncaughtException');
          }
     });

     process.on('unhandledRejection', (reason, promise) => {
          const reasonMessage = reason instanceof Error ? reason.message : String(reason);

          if (reasonMessage.includes('critical')) {
               logger.error(colors.bgRed.white(`❌ Worker ${processId} UNHANDLED REJECTION:`));
               logger.error(
                    colors.bgRed.white(`Unhandled Rejection at critical`),
                    promise,
                    'reason:',
                    reasonMessage,
               );
               gracefulShutdown('unhandledRejection');
          }
     });

     // Signal handlers are fine as they are
     process.on('SIGINT', async () => {
          logger.info(
               colors.bgYellow.white(
                    `⚠️ Worker ${processId} SIGINT signal received. Graceful shutdown initiated.`,
               ),
          );
          gracefulShutdown('SIGINT');
     });

     process.on('SIGTERM', async () => {
          logger.info(
               colors.bgYellow.white(
                    `⚠️ Worker ${processId} SIGTERM signal received. Graceful shutdown initiated.`,
               ),
          );
          gracefulShutdown('SIGTERM');
     });

     process.on('SIGUSR2', async () => {
          logger.info(
               colors.bgYellow.white(
                    `⚠️ Worker ${processId} SIGUSR2 signal received. Graceful shutdown initiated.`,
               ),
          );
          gracefulShutdown('SIGUSR2');
     });
     process.on('warning', (warning) => {
          logger.warn(
               colors.bgYellow.white(`⚠️ Worker ${processId} Warning:`),
               warning.name,
               warning.message,
          );
     });

     logger.info(
          colors.bgGreen.white(`✅ Worker ${processId} Process handlers registered successfully`),
     );
}
