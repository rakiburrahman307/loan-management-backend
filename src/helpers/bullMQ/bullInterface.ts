// ==========================================
// JOB DATA TYPES
// ==========================================
export interface EmailJobData {
     to: string;
     subject: string;
     template?: string;
     data?: Record<string, any>;
     attachments?: Array<{
          filename: string;
          path?: string;
          content?: Buffer;
     }>;
}

export interface NotificationJobData {
     userId?: string; // undefined hole all users
     title?: string;
     message: string;
     type?:
          | 'info'
          | 'success'
          | 'warning'
          | 'error'
          | 'ADMIN'
          | 'SYSTEM'
          | 'PAYMENT'
          | 'MESSAGE'
          | 'REFUND'
          | 'ALERT'
          | 'ORDER'
          | 'DELIVERY'
          | 'CANCELLED';
     channels?: Array<'push' | 'in-app' | 'socket'>;
     data?: any;
     reference?: string; // MongoDB ObjectId
     referenceModel?:
          | 'PAYMENT'
          | 'ORDER'
          | 'MESSAGE'
          | 'REFUND'
          | 'ALERT'
          | 'DELIVERY'
          | 'CANCELLED';
     screen?: 'DASHBOARD' | 'PAYMENT_HISTORY' | 'PROFILE';
}

export interface SMSJobData {
     phone: string;
     message: string;
     countryCode?: string;
}

export interface CleanupJobData {
     type: 'old-notifications' | 'completed-jobs' | 'failed-jobs' | 'all-notifications';
     olderThan?: number; // Days
}

export enum JobPriority {
     CRITICAL = 1,
     HIGH = 2,
     NORMAL = 3,
     LOW = 4,
     VERY_LOW = 5,
}
export interface QueueStats {
     name: string;
     waiting: number;
     active: number;
     completed: number;
     failed: number;
     delayed: number;
     paused: boolean;
     total: number;
}

export interface ScheduleJobData {
     type: 'DAILY_MORNING_AI';
}

export const QUEUE_NAMES = {
     EMAIL: 'email-queue',
     NOTIFICATION: 'notification-queue',
     SMS: 'sms-queue',
     SCHEDULE: 'schedule-queue',
     CLEANUP: 'cleanup-queue',
} as const;
