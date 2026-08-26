export const CRON_JOBS = {
     DAILY_MORNING_AI: {
          name: 'daily-ai-summary',
          data: { type: 'DAILY_MORNING_AI' },
          pattern: '0 * * * *',
     },

     // WEEKLY_REPORT: {
     //      name: 'weekly-report',
     //      data: { type: 'WEEKLY_REPORT' },
     //      pattern: '0 9 * * 1',
     // },
     // MONTHLY_CLEANUP: {
     //      name: 'monthly-cleanup',
     //      data: { type: 'MONTHLY_CLEANUP' },
     //      pattern: '0 0 1 * *',
     // },
} as const;

export type CronJobKey = keyof typeof CRON_JOBS;
