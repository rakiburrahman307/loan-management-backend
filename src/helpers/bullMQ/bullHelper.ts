import colors from 'colors';
import { cleanupQueue, emailQueue, notificationQueue, smsQueue } from './bullQueueInstance';
import { errorLogger, logger } from '../../shared/logger';
import { JobOptionsPresets } from './bullPreset';
import { JobPriority, NotificationJobData } from './bullInterface';
import { CRON_JOBS, CronJobKey } from './cornConfig';
import { Queue } from 'bullmq';

// ==========================================
// EMAIL QUEUE HELPERS
// ==========================================

export class EmailQueueHelper {
     // Send welcome email
     static async sendWelcomeEmail(userEmail: string, userName: string, otp: string) {
          try {
               const job = await emailQueue.add(
                    'welcome-email',
                    {
                         to: userEmail,
                         subject: 'Verify your account',
                         template: 'createAccount',
                         data: {
                              name: userName,
                              otp,
                         },
                    },
                    JobOptionsPresets.CRITICAL,
               );

               logger.info(
                    colors.green(`✉️ Welcome email queued for ${userEmail} - Job ID: ${job.id}`),
               );
               return job.id;
          } catch (error) {
               logger.error(colors.red('Failed to queue welcome email:'), error);
               throw error;
          }
     }
     static async blockAccountEmail(userEmail: string, userName: string) {
          try {
               const job = await emailQueue.add(
                    'block-account',
                    {
                         to: userEmail,
                         subject: 'Account Blocked',
                         template: 'blockAccount',
                         data: {
                              name: userName,
                         },
                    },
                    JobOptionsPresets.NORMAL,
               );

               logger.info(
                    colors.green(
                         `✉️ Block account email queued for ${userEmail} - Job ID: ${job.id}`,
                    ),
               );
               return job.id;
          } catch (error) {
               logger.error(colors.red('Failed to queue block account email:'), error);
               throw error;
          }
     }

     // Password reset with OTP
     static async sendPasswordResetEmail(userEmail: string, otp: string) {
          try {
               const job = await emailQueue.add(
                    'password-reset',
                    {
                         to: userEmail,
                         subject: 'Reset your password',
                         template: 'resetPassword',
                         data: { otp },
                    },
                    JobOptionsPresets.CRITICAL,
               );

               logger.info(colors.green(`🔐 Password reset email queued - Job ID: ${job.id}`));
               return job.id;
          } catch (error) {
               logger.error(colors.red('Failed to queue password reset email:'), error);
               throw error;
          }
     }

     // Password reset with URL
     static async sendPasswordResetUrlEmail(userEmail: string, resetUrl: string) {
          try {
               const job = await emailQueue.add(
                    'password-reset-url',
                    {
                         to: userEmail,
                         subject: 'Reset Your Password',
                         template: 'resetPasswordByUrl',
                         data: { resetUrl },
                    },
                    JobOptionsPresets.CRITICAL,
               );

               logger.info(colors.green(`🔗 Password reset URL email queued - Job ID: ${job.id}`));
               return job.id;
          } catch (error) {
               logger.error(colors.red('Failed to queue password reset URL email:'), error);
               throw error;
          }
     }
     // Contact form confirmation
     static async sendContactConfirmation(
          userEmail: string,
          userName: string,
          userMessage: string,
          userPhone: string,
     ) {
          try {
               const job = await emailQueue.add(
                    'contact-confirmation',
                    {
                         to: userEmail,
                         subject: 'Thank you for reaching out to us',
                         template: 'contactForm',
                         data: {
                              name: userName,
                              message: userMessage,
                              phone: userPhone,
                         },
                    },
                    JobOptionsPresets.NORMAL,
               );

               logger.info(colors.green(`💬 Contact confirmation queued - Job ID: ${job.id}`));
               return job.id;
          } catch (error) {
               logger.error(colors.red('Failed to queue contact confirmation:'), error);
               throw error;
          }
     }

     // Send contact message notification to admin
     static async sendContactNotificationToAdmin(payload: {
          name: string;
          email: string;
          phone?: string;
          subject: string;
          message: string;
     }) {
          try {
               const job = await emailQueue.add(
                    'contact-admin-notification',
                    {
                         to: 'support@loan.co.uk',
                         subject: `New Contact Request: ${payload.subject}`,
                         template: 'contactUsAdmin',
                         data: payload,
                    },
                    JobOptionsPresets.NORMAL,
               );

               logger.info(colors.green(`✉️ Support contact notification email queued - Job ID: ${job.id}`));
               return job.id;
          } catch (error) {
               logger.error(colors.red('Failed to queue support contact notification:'), error);
               throw error;
          }
     }

     // Send bulk emails
     static async sendBulkEmails(users: Array<{ email: string; name: string; data?: any }>) {
          try {
               const jobs = users.map((user) => ({
                    name: 'bulk-email',
                    data: {
                         to: user.email,
                         subject: 'Important Update',
                         template: 'update',
                         data: { name: user.name, ...user.data },
                    },
                    opts: {
                         attempts: 2,
                         priority: JobPriority.NORMAL, // Lower priority for bulk
                    },
               }));

               const addedJobs = await emailQueue.addBulk(jobs);
               logger.info(colors.green(`📧 ${addedJobs.length} bulk emails queued`));
               return addedJobs.map((j) => j.id);
          } catch (error) {
               logger.error(colors.red('Failed to queue bulk emails:'), error);
               throw error;
          }
     }

     // Send email with attachment
     static async sendEmailWithAttachment(
          to: string,
          subject: string,
          message: string,
          attachmentPath: string,
     ) {
          try {
               const job = await emailQueue.add('email-with-attachment', {
                    to,
                    subject,
                    data: { message },
                    attachments: [
                         {
                              filename: attachmentPath.split('/').pop() || 'attachment',
                              path: attachmentPath,
                         },
                    ],
               });

               logger.info(colors.green(`📎 Email with attachment queued - Job ID: ${job.id}`));
               return job.id;
          } catch (error) {
               logger.error(colors.red('Failed to queue email with attachment:'), error);
               throw error;
          }
     }

     // Schedule email for later
     static async scheduleEmail(
          to: string,
          subject: string,
          template: string,
          data: any,
          sendAt: Date,
     ) {
          try {
               const delay = sendAt.getTime() - Date.now();

               if (delay <= 0) {
                    throw new Error('Scheduled time must be in the future');
               }

               const job = await emailQueue.add(
                    'scheduled-email',
                    { to, subject, template, data },
                    {
                         delay,
                         jobId: `scheduled-${to}-${sendAt.getTime()}`,
                    },
               );

               logger.info(colors.green(`⏰ Email scheduled for ${sendAt} - Job ID: ${job.id}`));
               return job.id;
          } catch (error) {
               logger.error(colors.red('Failed to schedule email:'), error);
               throw error;
          }
     }
}

// ==========================================
// NOTIFICATION QUEUE HELPERS
// ==========================================

export class NotificationQueueHelper {
     // Simple notification
     static async sendNotification(
          userId: string,
          message: string,
          title?: string,
          type: NotificationJobData['type'] = 'SYSTEM',
     ) {
          try {
               const job = await notificationQueue.add('notification', {
                    userId,
                    title,
                    message,
                    type,
                    channels: ['in-app', 'socket'],
               });

               logger.info(
                    colors.green(`🔔 Notification queued for ${userId} - Job ID: ${job.id}`),
               );
               return job.id;
          } catch (error) {
               logger.error(colors.red('Failed to queue notification:'), error);
               throw error;
          }
     }

     // Payment notification
     static async sendPaymentNotification(
          userId: string,
          message: string,
          paymentId: string,
          title?: string,
     ) {
          try {
               const job = await notificationQueue.add('payment-notification', {
                    userId,
                    title,
                    message,
                    type: 'PAYMENT',
                    reference: paymentId,
                    referenceModel: 'PAYMENT',
                    screen: 'PAYMENT_HISTORY',
                    channels: ['in-app', 'socket'],
               });

               logger.info(colors.green(`💳 Payment notification queued - Job ID: ${job.id}`));
               return job.id;
          } catch (error) {
               logger.error(colors.red('Failed to queue payment notification:'), error);
               throw error;
          }
     }

     // Broadcast to all users
     static async sendBroadcastNotification(
          message: string,
          title?: string,
          type: NotificationJobData['type'] = 'ADMIN',
     ) {
          try {
               const job = await notificationQueue.add('broadcast-notification', {
                    // userId undefined = all users
                    title,
                    message,
                    type,
                    channels: ['in-app', 'socket'],
               });

               logger.info(colors.green(`📢 Broadcast notification queued - Job ID: ${job.id}`));
               return job.id;
          } catch (error) {
               logger.error(colors.red('Failed to queue broadcast:'), error);
               throw error;
          }
     }

     // Alert with high priority
     static async sendAlert(userId: string, message: string, data?: any) {
          try {
               const job = await notificationQueue.add(
                    'alert',
                    {
                         userId,
                         title: '⚠️ Alert',
                         message,
                         type: 'ALERT',
                         data,
                         channels: ['push', 'in-app', 'socket'],
                    },
                    JobOptionsPresets.CRITICAL, // High priority
               );

               logger.info(colors.yellow(`⚠️ Alert queued for ${userId} - Job ID: ${job.id}`));
               return job.id;
          } catch (error) {
               logger.error(colors.red('Failed to queue alert:'), error);
               throw error;
          }
     }

     // Bulk notifications
     static async sendBulkNotifications(
          userIds: string[],
          title: string,
          message: string,
          type: NotificationJobData['type'] = 'SYSTEM',
     ) {
          try {
               const jobs = userIds.map((userId) => ({
                    name: 'bulk-notification',
                    data: {
                         userId,
                         title,
                         message,
                         type,
                         channels: ['in-app', 'socket'] as Array<'push' | 'in-app' | 'socket'>, // ✅ Type assertion
                    },
               }));

               const addedJobs = await notificationQueue.addBulk(jobs);
               logger.info(colors.green(`🔔 ${addedJobs.length} notifications queued`));
               return addedJobs.map((j) => j.id);
          } catch (error) {
               logger.error(colors.red('Failed to queue bulk notifications:'), error);
               throw error;
          }
     }
}

// ==========================================
// SMS QUEUE HELPERS
// ==========================================

export class SMSQueueHelper {
     // Send OTP SMS
     static async sendOTP(phone: string, otp: string, countryCode: string = '+880') {
          try {
               const job = await smsQueue.add(
                    'otp-sms',
                    {
                         phone,
                         message: `Your OTP is: ${otp}. Valid for 5 minutes.`,
                         countryCode,
                    },

                    JobOptionsPresets.CRITICAL,
               );

               logger.info(colors.green(`📱 OTP SMS queued for ${phone} - Job ID: ${job.id}`));
               return job.id;
          } catch (error) {
               logger.error(colors.red('Failed to queue OTP SMS:'), error);
               throw error;
          }
     }

     // Send notification SMS
     static async sendSMS(phone: string, message: string) {
          try {
               const job = await smsQueue.add('notification-sms', {
                    phone,
                    message,
               });

               logger.info(colors.green(`📱 SMS queued for ${phone} - Job ID: ${job.id}`));
               return job.id;
          } catch (error) {
               logger.error(colors.red('Failed to queue SMS:'), error);
               throw error;
          }
     }

     // Send bulk SMS
     static async sendBulkSMS(recipients: Array<{ phone: string; message: string }>) {
          try {
               const jobs = recipients.map(({ phone, message }) => ({
                    name: 'bulk-sms',
                    data: { phone, message },
                    opts: { attempts: 2 },
               }));

               const addedJobs = await smsQueue.addBulk(jobs);
               logger.info(colors.green(`📱 ${addedJobs.length} SMS queued`));
               return addedJobs.map((j) => j.id);
          } catch (error) {
               logger.error(colors.red('Failed to queue bulk SMS:'), error);
               throw error;
          }
     }
}

// ==========================================
// CLEANUP QUEUE HELPERS
// ==========================================
export class CronQueueHelper {
     // Register a specific cron job
     static async registerJob(queue: Queue<any, any, any>, key: CronJobKey) {
          try {
               const job = CRON_JOBS[key];

               await queue.upsertJobScheduler(
                    job.name,
                    { pattern: job.pattern },
                    { name: job.name as any, data: job.data },
               );

               logger.info(colors.green(`✅ Cron registered: [${key}] → "${job.pattern}"`));
          } catch (error) {
               errorLogger.error(colors.red(`❌ Failed to register cron [${key}]:`), error);
               throw error;
          }
     }

     // Register all cron jobs
     static async registerAll(queue: Queue<any, any, any>) {
          try {
               const keys = Object.keys(CRON_JOBS) as CronJobKey[];

               for (const key of keys) {
                    await CronQueueHelper.registerJob(queue, key);
               }

               logger.info(colors.green(`🚀 All cron jobs registered! Total: ${keys.length}`));
          } catch (error) {
               errorLogger.error(colors.red('❌ Failed to register all cron jobs:'), error);
               throw error;
          }
     }

     // Remove a specific cron job
     static async removeJob(queue: Queue<any, any, any>, key: CronJobKey) {
          try {
               const job = CRON_JOBS[key];
               await queue.removeJobScheduler(job.name);
               const repeatableJobs = await queue.getRepeatableJobs();
               const existing = repeatableJobs.find((j) => j.name === job.name);
               if (existing) {
                    await queue.removeRepeatableByKey(existing.key);
               }
               logger.info(colors.yellow(`🗑️ Cron removed: [${key}]`));
          } catch (error) {
               errorLogger.error(colors.red(`❌ Failed to remove cron [${key}]:`), error);
               throw error;
          }
     }

     // List all registered cron jobs
     static async listJobs(queue: Queue<any, any, any>) {
          try {
               const schedulers = await queue.getJobSchedulers();
               const repeatableJobs = await queue.getRepeatableJobs();

               logger.info(colors.cyan(`📋 Schedulers: ${schedulers.length}`));
               schedulers.forEach((s) => logger.info(colors.cyan(`  [scheduler] → ${s.name}`)));

               logger.info(colors.cyan(`📋 Repeatable Jobs: ${repeatableJobs.length}`));
               repeatableJobs.forEach((r) =>
                    logger.info(colors.cyan(`  [repeatable] → ${r.name}`)),
               );

               return { schedulers, repeatableJobs };
          } catch (error) {
               errorLogger.error(colors.red('❌ Failed to list cron jobs:'), error);
               throw error;
          }
     }
}
// ==========================================
// CLEANUP QUEUE HELPERS
// ==========================================

export class CleanupQueueHelper {
     // Daily cleanup - old notifications
     static async cleanupOldNotifications(olderThanDays: number = 30) {
          try {
               const job = await cleanupQueue.add(
                    'cleanup-old-notifications',
                    {
                         type: 'old-notifications',
                         olderThan: olderThanDays,
                    },
                    JobOptionsPresets.ONE_TIME,
               );

               logger.info(colors.green(`🧹 Cleanup job queued - Job ID: ${job.id}`));
               return job.id;
          } catch (error) {
               logger.error(colors.red('Failed to queue cleanup:'), error);
               throw error;
          }
     }

     // Clean completed jobs from Redis
     static async cleanupCompletedJobs() {
          try {
               const job = await cleanupQueue.add(
                    'cleanup-completed-jobs',
                    {
                         type: 'completed-jobs',
                    },
                    JobOptionsPresets.ONE_TIME,
               );

               logger.info(colors.green(`🧹 Completed jobs cleanup queued - Job ID: ${job.id}`));
               return job.id;
          } catch (error) {
               logger.error(colors.red('Failed to queue cleanup:'), error);
               throw error;
          }
     }

     // Clean failed jobs
     static async cleanupFailedJobs() {
          try {
               const job = await cleanupQueue.add(
                    'cleanup-failed-jobs',
                    {
                         type: 'failed-jobs',
                    },
                    JobOptionsPresets.ONE_TIME,
               );

               logger.info(colors.green(`🧹 Failed jobs cleanup queued - Job ID: ${job.id}`));
               return job.id;
          } catch (error) {
               logger.error(colors.red('Failed to queue cleanup:'), error);
               throw error;
          }
     }

     // Deep cleanup - very old data
     static async deepCleanup() {
          try {
               const job = await cleanupQueue.add(
                    'deep-cleanup',
                    {
                         type: 'all-notifications',
                    },
                    JobOptionsPresets.ONE_TIME,
               );

               logger.info(colors.green(`🧹 Deep cleanup queued - Job ID: ${job.id}`));
               return job.id;
          } catch (error) {
               logger.error(colors.red('Failed to queue deep cleanup:'), error);
               throw error;
          }
     }
}
