import { Worker } from 'bullmq';
import colors from 'colors';
import { logger, errorLogger } from '../../shared/logger';
import { BULLMQ_PREFIX, redisConnection } from '../../DB/bullMQ';
import { CleanupJobData, EmailJobData, NotificationJobData, SMSJobData } from './bullInterface';
import { emailHelper } from '../emailHelper';
import { emailTemplate } from '../../shared/emailTemplate';
import { sendNotifications } from '../notificationsHelper';
import { emailQueue, notificationQueue, smsQueue } from './bullQueueInstance';
import { Notification } from '../../app/modules/notification/notification.model';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';

// ==========================================
// EMAIL WORKER
// ==========================================
export const emailWorker = new Worker<EmailJobData>(
     'email-queue',
     async (job) => {
          try {
               const { template, to, data } = job.data;
               logger.info(colors.blue(`📧 Processing email job ${job.id}`));

               let emailData;
               switch (template) {
                    case 'createAccount':
                    case 'welcome':
                         emailData = emailTemplate.createAccount({
                              email: to,
                              name: data?.name,
                              otp: data?.otp,
                         });
                         break;

                    case 'resetPassword':
                         emailData = emailTemplate.resetPassword({
                              email: to,
                              otp: data?.otp,
                         });
                         break;
                    case 'contact':
                         emailData = emailTemplate.contact({
                              email: to,
                              name: data?.name,
                              subject: data?.subject,
                              message: data?.message,
                         });
                         break;

                    case 'contactForm':
                         emailData = emailTemplate.contactFormTemplate({
                              email: to,
                              name: data?.name,
                              phone: data?.phone,
                              message: data?.message,
                         });
                         break;

                    case 'blockAccount':
                         emailData = emailTemplate.blockAccountTemplate({
                              email: to,
                              name: data?.name,
                         });
                         break;

                    case 'contactUsAdmin':
                         emailData = emailTemplate.contactUsAdminTemplate({
                              name: data?.name,
                              email: data?.email,
                              phone: data?.phone,
                              subject: data?.subject,
                              message: data?.message,
                         });
                         break;

                    default:
                         throw new AppError(
                              StatusCodes.BAD_REQUEST,
                              `Unknown email template: ${template}`,
                         );
               }

               // Send email (emailData already has to, subject, html)
               await emailHelper.sendEmail(emailData);

               logger.info(colors.green(`✅ Email sent to ${emailData.to}`));
               return { success: true, recipient: emailData.to, jobId: job.id };
          } catch (error: any) {
               errorLogger.error(colors.red(`❌ Email job ${job.id} failed:`), error);
               throw error;
          }
     },
     {
          connection: redisConnection,
          prefix: BULLMQ_PREFIX,
          concurrency: 5,
     },
);

// ==========================================
// NOTIFICATION WORKER
// ==========================================
export const notificationWorker = new Worker<NotificationJobData>(
     'notification-queue',
     async (job) => {
          try {
               const {
                    userId,
                    title,
                    message,
                    type,
                    channels,
                    data,
                    reference,
                    referenceModel,
                    screen,
               } = job.data;

               logger.info(colors.blue(`🔔 Processing notification job ${job.id}`));

               // In-app + Socket notification (tomar existing system use kore)
               if (channels?.includes('in-app') || channels?.includes('socket')) {
                    const notificationData = {
                         title: title || undefined,
                         message,
                         receiver: userId || undefined, // undefined hole all users
                         type: type?.toUpperCase(), // 'info' -> 'SYSTEM'
                         reference: reference || undefined,
                         referenceModel: referenceModel || undefined,
                         screen: screen || undefined,
                         ...data, // extra data jodi thake
                    };

                    // Tomar sendNotifications function call - DB save + Socket emit dui-i korbe
                    await sendNotifications(notificationData);

                    logger.info(
                         colors.cyan(
                              `✅ Notification saved & emitted for ${userId || 'all users'}`,
                         ),
                    );
               }

               // Push notification (optional - Firebase/OneSignal)
               if (channels?.includes('push')) {
                    // await sendPushNotification(userId, title, message);
                    logger.info(colors.cyan(`📲 Push notification sent to user ${userId}`));
               }

               logger.info(colors.green(`✅ Notification job ${job.id} completed`));
               return { success: true, userId, channels, jobId: job.id };
          } catch (error: any) {
               errorLogger.error(colors.red(`❌ Notification job ${job.id} failed:`), error);
               throw error;
          }
     },
     {
          connection: redisConnection,
          prefix: BULLMQ_PREFIX,
          concurrency: 10,
     },
);

// ==========================================
// SMS WORKER
// ==========================================
export const smsWorker = new Worker<SMSJobData>(
     'sms-queue',
     async (job) => {
          try {
               const { phone, message, countryCode } = job.data;

               logger.info(colors.blue(`📱 Processing SMS job ${job.id}`));

               // SMS API call (Twilio/Nexmo/BulkSMS)
               // const result = await smsProvider.send({
               //     to: countryCode ? `${countryCode}${phone}` : phone,
               //     message,
               // });

               logger.info(colors.green(`✅ SMS sent to ${phone}`));
               return { success: true, phone, jobId: job.id };
          } catch (error: any) {
               errorLogger.error(colors.red(`❌ SMS job ${job.id} failed:`), error);
               throw error;
          }
     },
     {
          connection: redisConnection,
          prefix: BULLMQ_PREFIX,
          concurrency: 3,
     },
);
export const cleanupWorker = new Worker<CleanupJobData>(
     'cleanup-queue',
     async (job) => {
          try {
               const { type, olderThan } = job.data;

               logger.info(colors.blue(`🧹 Processing cleanup job ${job.id} - Type: ${type}`));

               let deletedCount = 0;

               switch (type) {
                    case 'old-notifications':
                         const thirtyDaysAgo = new Date();
                         thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - (olderThan || 30));

                         const result = await Notification.deleteMany({
                              read: true,
                              createdAt: { $lt: thirtyDaysAgo },
                         });

                         deletedCount = result.deletedCount || 0;
                         logger.info(colors.cyan(`🗑️  Deleted ${deletedCount} old notifications`));
                         break;

                    case 'completed-jobs':
                         // Redis queue old completed jobs clean
                         await emailQueue.clean(24 * 3600 * 1000, 100, 'completed'); // 24 hours old
                         await notificationQueue.clean(12 * 3600 * 1000, 50, 'completed'); // 12 hours
                         await smsQueue.clean(24 * 3600 * 1000, 100, 'completed');

                         logger.info(colors.cyan(`🗑️  Cleaned old completed jobs from queues`));
                         break;

                    case 'failed-jobs':
                         // Failed jobs clean (7 days old)
                         await emailQueue.clean(7 * 24 * 3600 * 1000, 500, 'failed');
                         await notificationQueue.clean(7 * 24 * 3600 * 1000, 500, 'failed');
                         await smsQueue.clean(7 * 24 * 3600 * 1000, 500, 'failed');

                         logger.info(colors.cyan(`🗑️  Cleaned old failed jobs from queues`));
                         break;

                    case 'all-notifications':
                         // All read notifications (90 days old)
                         const ninetyDaysAgo = new Date();
                         ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

                         const allResult = await Notification.deleteMany({
                              read: true,
                              createdAt: { $lt: ninetyDaysAgo },
                         });

                         deletedCount = allResult.deletedCount || 0;
                         logger.info(
                              colors.cyan(`🗑️  Deleted ${deletedCount} very old notifications`),
                         );
                         break;

                    default:
                         logger.warn(colors.yellow(`Unknown cleanup type: ${type}`));
               }

               logger.info(colors.green(`✅ Cleanup job ${job.id} completed`));
               return { success: true, type, deletedCount, jobId: job.id };
          } catch (error: any) {
               errorLogger.error(colors.red(`❌ Cleanup job ${job.id} failed:`), error);
               throw error;
          }
     },
     {
          connection: redisConnection,
          prefix: BULLMQ_PREFIX,
          concurrency: 1,
     },
);

logger.info(colors.bgMagenta.white('🚀 All BullMQ workers are running'));
