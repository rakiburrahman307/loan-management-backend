import mongoose from 'mongoose';
import colors from 'colors';
import { errorLogger, logger } from '../shared/logger';
import { httpServer, socketServer } from '../server';
import { disconnectRedis } from './redis';
import { closeBullMQ } from './bullMQ';

// import { stopAgenda } from '../helpers/jobQueueSystem/agenda';

const SHUTDOWN_TIMEOUT_MS = 30000;

declare global {
     var isShuttingDown: boolean;
}

export async function gracefulShutdown(signal: string): Promise<void> {
     // Prevent duplicate shutdown attempts
     if (global.isShuttingDown) {
          logger.warn(colors.yellow('⚠️  Shutdown already in progress...'));
          return;
     }

     global.isShuttingDown = true;

     logger.info(colors.bgYellow.black(`\n${'='.repeat(60)}`));
     logger.info(
          colors.bgYellow.black(`  WORKER ${process.pid} - GRACEFUL SHUTDOWN (${signal})  `),
     );
     logger.info(colors.bgYellow.black(`${'='.repeat(60)}\n`));

     // Set a force shutdown timer (safety net)
     const forceShutdownTimer = setTimeout(() => {
          errorLogger.error(
               colors.bgRed.white(`\n⚠️  FORCE SHUTDOWN after ${SHUTDOWN_TIMEOUT_MS}ms\n`),
          );
          process.exit(1);
     }, SHUTDOWN_TIMEOUT_MS);

     // Make sure timer doesn't prevent exit
     forceShutdownTimer.unref();

     try {
          const shutdownSteps = [
               {
                    name: 'HTTP Server',
                    action: async () => {
                         if (httpServer && httpServer.listening) {
                              await new Promise<void>((resolve) => {
                                   httpServer.close(() => resolve());
                              });
                         }
                    },
               },
               {
                    name: 'Socket.IO Server',
                    action: async () => {
                         if (socketServer) {
                              // Disconnect all clients first
                              socketServer.disconnectSockets(true);
                              await new Promise<void>((resolve) => {
                                   socketServer.close(() => resolve());
                              });
                         }
                    },
               },
               {
                    name: 'BullMQ (Job Queue)',
                    action: async () => {
                         await closeBullMQ();
                    },
               },
               {
                    name: 'Redis Connection',
                    action: async () => {
                         await disconnectRedis();
                    },
               },
               {
                    name: 'MongoDB Connection',
                    action: async () => {
                         if (mongoose.connection.readyState !== 0) {
                              await mongoose.connection.close(false);
                         }
                    },
               },
          ];

          // Execute shutdown steps sequentially
          for (const step of shutdownSteps) {
               try {
                    logger.info(colors.yellow(`⏳ Closing: ${step.name}...`));
                    await step.action();
                    logger.info(colors.green(`✅ ${step.name} closed`));
               } catch (error) {
                    errorLogger.error(colors.red(`❌ Failed to close ${step.name}:`), error);
                    // Continue with other steps
               }
          }

          // Clear the force shutdown timer
          clearTimeout(forceShutdownTimer);

          logger.info(colors.bgGreen.black(`\n${'='.repeat(60)}`));
          logger.info(colors.bgGreen.black(`  ✓ WORKER ${process.pid} SHUTDOWN COMPLETE  `));
          logger.info(colors.bgGreen.black(`${'='.repeat(60)}\n`));

          process.exit(0);
     } catch (error) {
          clearTimeout(forceShutdownTimer);
          errorLogger.error(colors.bgRed.white('\n❌ CRITICAL ERROR DURING SHUTDOWN:\n'), error);
          process.exit(1);
     }
}
