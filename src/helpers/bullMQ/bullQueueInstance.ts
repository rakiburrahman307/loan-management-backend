import { Queue } from 'bullmq';
import { BULLMQ_PREFIX, redisConnection } from '../../DB/bullMQ';
import {
     CleanupJobData,
     EmailJobData,
     NotificationJobData,
     QUEUE_NAMES,
     ScheduleJobData,
     SMSJobData,
} from './bullInterface';

export const emailQueue = new Queue<EmailJobData>(QUEUE_NAMES.EMAIL, {
     connection: redisConnection,
     prefix: BULLMQ_PREFIX,
     defaultJobOptions: {
          attempts: 3,
          backoff: {
               type: 'exponential',
               delay: 2000,
          },
          removeOnComplete: {
               count: 100,
               age: 24 * 3600,
          },
          removeOnFail: {
               count: 500,
          },
     },
});

export const notificationQueue = new Queue<NotificationJobData>(QUEUE_NAMES.NOTIFICATION, {
     connection: redisConnection,
     prefix: BULLMQ_PREFIX,
     defaultJobOptions: {
          attempts: 2,
          backoff: {
               type: 'fixed',
               delay: 5000,
          },
          removeOnComplete: {
               count: 50,
               age: 12 * 3600,
          },
     },
});

export const smsQueue = new Queue<SMSJobData>(QUEUE_NAMES.SMS, {
     connection: redisConnection,
     prefix: BULLMQ_PREFIX,
     defaultJobOptions: {
          attempts: 3,
          backoff: {
               type: 'exponential',
               delay: 3000,
          },
          removeOnComplete: {
               count: 100,
               age: 24 * 3600,
          },
     },
});

export const cleanupQueue = new Queue<CleanupJobData>(QUEUE_NAMES.CLEANUP, {
     connection: redisConnection,
     prefix: BULLMQ_PREFIX,
     defaultJobOptions: {
          attempts: 1,
          removeOnComplete: true,
     },
});

export const scheduleQueue = new Queue<ScheduleJobData>(QUEUE_NAMES.SCHEDULE, {
     connection: redisConnection,
     prefix: BULLMQ_PREFIX,
     defaultJobOptions: {
          attempts: 1,
          removeOnComplete: true,
     },
});
