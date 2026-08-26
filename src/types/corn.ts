export const CRON_PATTERNS = {
     EVERY_SECOND: '* * * * * *',
     EVERY_5_SECONDS: '*/5 * * * * *',
     EVERY_10_SECONDS: '*/10 * * * * *',
     EVERY_30_SECONDS: '*/30 * * * * *',

     EVERY_MINUTE: '* * * * *',
     EVERY_5_MINUTES: '*/5 * * * *',
     EVERY_10_MINUTES: '*/10 * * * *',
     EVERY_30_MINUTES: '*/30 * * * *',

     EVERY_HOUR: '0 * * * *',
     EVERY_6_HOURS: '0 */6 * * *',
     EVERY_12_HOURS: '0 */12 * * *',

     DAILY_AT_MIDNIGHT: '0 0 * * *',
     DAILY_AT_9_AM: '0 9 * * *',
     DAILY_AT_NOON: '0 12 * * *',

     EVERY_SUNDAY: '0 0 * * 0',
     EVERY_MONDAY: '0 0 * * 1',
     EVERY_FRIDAY: '0 0 * * 5',

     FIRST_DAY_OF_MONTH: '0 0 1 * *',
     LAST_DAY_OF_MONTH: '0 0 L * *',
} as const;

export type CronPattern = (typeof CRON_PATTERNS)[keyof typeof CRON_PATTERNS];
