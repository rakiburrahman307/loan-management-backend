import cron from 'node-cron';
import { User } from '../app/modules/user/user.model';
import colors from 'colors';
import { printBanner } from './printBanner';
import config from '../config';
import { logger } from '../shared/logger';
import { CleanupQueueHelper, CronQueueHelper } from '../helpers/bullMQ/bullHelper';
import { scheduleQueue } from '../helpers/bullMQ/bullQueueInstance';
// ====== CRON JOB SCHEDULERS ======
const setupCleanupScheduler = () => {
     // Every day at 2 AM - old notifications cleanup
     cron.schedule('0 2 * * *', async () => {
          logger.info(colors.blue('🕐 Running daily cleanup...'));
          await CleanupQueueHelper.cleanupOldNotifications(30);
     });

     // Every day at 3 AM - completed jobs cleanup
     cron.schedule('0 3 * * *', async () => {
          logger.info(colors.blue('🕐 Cleaning completed jobs...'));
          await CleanupQueueHelper.cleanupCompletedJobs();
     });

     // Every Sunday at 4 AM - failed jobs cleanup
     cron.schedule('0 4 * * 0', async () => {
          logger.info(colors.blue('🕐 Weekly failed jobs cleanup...'));
          await CleanupQueueHelper.cleanupFailedJobs();
     });

     // Every month 1st day at 5 AM - deep cleanup
     cron.schedule('0 5 1 * *', async () => {
          logger.info(colors.blue('🕐 Monthly deep cleanup...'));
          await CleanupQueueHelper.deepCleanup();
     });

     logger.info(colors.bgCyan.black('⏰ Cleanup scheduler initialized'));
};

// const initDailyCron = async () => {
//      await CronQueueHelper.registerJob(scheduleQueue, 'DAILY_MORNING_AI');
//      // await CronQueueHelper.listJobs(scheduleQueue);
// };
const setupTimeManagement = () => {
     logger.info(colors.bgCyan.black('🚀 Setting up trial management cron jobs...'));
     // Start all cron jobs
     printBanner(config.server.name as string);
     setupCleanupScheduler(); // Daily cleanup
};
export default setupTimeManagement;
