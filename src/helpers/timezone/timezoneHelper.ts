import { DateTime } from 'luxon';

// Default timezone
const DEFAULT_TIMEZONE = 'Asia/Dhaka';

/**
 * Calculate days until a date
 */
export const calculateDaysUntil = (date: Date, timezone: string = DEFAULT_TIMEZONE): number => {
     const now = DateTime.now().setZone(timezone).startOf('day');
     const target = DateTime.fromJSDate(date).setZone(timezone).startOf('day');
     return Math.ceil(target.diff(now, 'days').days);
};

/**
 * Calculate hours until a date
 */
export const calculateHoursUntil = (date: Date, timezone: string = DEFAULT_TIMEZONE): number => {
     const now = DateTime.now().setZone(timezone);
     const target = DateTime.fromJSDate(date).setZone(timezone);
     return Math.ceil(target.diff(now, 'hours').hours);
};

/**
 * Calculate minutes until a date
 */
export const calculateMinutesUntil = (date: Date, timezone: string = DEFAULT_TIMEZONE): number => {
     const now = DateTime.now().setZone(timezone);
     const target = DateTime.fromJSDate(date).setZone(timezone);
     return Math.ceil(target.diff(now, 'minutes').minutes);
};

/**
 * Format date (e.g., "25 Dec 2024, 10:30 AM")
 * Common formats:
 * - 'dd LLL yyyy, hh:mm a' => "25 Dec 2024, 10:30 AM"
 * - 'yyyy-MM-dd' => "2024-12-25"
 * - 'dd/MM/yyyy' => "25/12/2024"
 * - 'DDDD' => "December 25, 2024"
 */
export const formatDate = (
     date: Date,
     format: string = 'dd LLL yyyy, hh:mm a',
     timezone: string = DEFAULT_TIMEZONE,
): string => {
     return DateTime.fromJSDate(date).setZone(timezone).toFormat(format);
};

/**
 * Format date in relative time (e.g., "2 days ago", "in 3 hours")
 */
export const formatRelativeTime = (date: Date, timezone: string = DEFAULT_TIMEZONE): string => {
     const dt = DateTime.fromJSDate(date).setZone(timezone);
     return dt.toRelative() || '';
};

/**
 * Check if date is today
 */
export const isToday = (date: Date, timezone: string = DEFAULT_TIMEZONE): boolean => {
     const today = DateTime.now().setZone(timezone).startOf('day');
     const checkDate = DateTime.fromJSDate(date).setZone(timezone).startOf('day');
     return today.equals(checkDate);
};

/**
 * Check if date is tomorrow
 */
export const isTomorrow = (date: Date, timezone: string = DEFAULT_TIMEZONE): boolean => {
     const tomorrow = DateTime.now().setZone(timezone).plus({ days: 1 }).startOf('day');
     const checkDate = DateTime.fromJSDate(date).setZone(timezone).startOf('day');
     return tomorrow.equals(checkDate);
};

/**
 * Check if date is in the past
 */
export const isPast = (date: Date, timezone: string = DEFAULT_TIMEZONE): boolean => {
     const now = DateTime.now().setZone(timezone);
     const checkDate = DateTime.fromJSDate(date).setZone(timezone);
     return checkDate < now;
};

/**
 * Check if date is in the future
 */
export const isFuture = (date: Date, timezone: string = DEFAULT_TIMEZONE): boolean => {
     const now = DateTime.now().setZone(timezone);
     const checkDate = DateTime.fromJSDate(date).setZone(timezone);
     return checkDate > now;
};

/**
 * Check if date is this week
 */
export const isThisWeek = (date: Date, timezone: string = DEFAULT_TIMEZONE): boolean => {
     const now = DateTime.now().setZone(timezone);
     const checkDate = DateTime.fromJSDate(date).setZone(timezone);
     return now.hasSame(checkDate, 'week');
};

/**
 * Check if date is this month
 */
export const isThisMonth = (date: Date, timezone: string = DEFAULT_TIMEZONE): boolean => {
     const now = DateTime.now().setZone(timezone);
     const checkDate = DateTime.fromJSDate(date).setZone(timezone);
     return now.hasSame(checkDate, 'month');
};

/**
 * Get start of day (12:00 AM)
 */
export const getStartOfDay = (date: Date, timezone: string = DEFAULT_TIMEZONE): Date => {
     return DateTime.fromJSDate(date).setZone(timezone).startOf('day').toJSDate();
};

/**
 * Get end of day (11:59:59 PM)
 */
export const getEndOfDay = (date: Date, timezone: string = DEFAULT_TIMEZONE): Date => {
     return DateTime.fromJSDate(date).setZone(timezone).endOf('day').toJSDate();
};

/**
 * Get start of week
 */
export const getStartOfWeek = (date: Date, timezone: string = DEFAULT_TIMEZONE): Date => {
     return DateTime.fromJSDate(date).setZone(timezone).startOf('week').toJSDate();
};

/**
 * Get end of week
 */
export const getEndOfWeek = (date: Date, timezone: string = DEFAULT_TIMEZONE): Date => {
     return DateTime.fromJSDate(date).setZone(timezone).endOf('week').toJSDate();
};

/**
 * Get start of month
 */
export const getStartOfMonth = (date: Date, timezone: string = DEFAULT_TIMEZONE): Date => {
     return DateTime.fromJSDate(date).setZone(timezone).startOf('month').toJSDate();
};

/**
 * Get end of month
 */
export const getEndOfMonth = (date: Date, timezone: string = DEFAULT_TIMEZONE): Date => {
     return DateTime.fromJSDate(date).setZone(timezone).endOf('month').toJSDate();
};

/**
 * Add time to a date
 */
export const addTime = (
     date: Date,
     amount: number,
     unit: 'days' | 'hours' | 'minutes' | 'weeks' | 'months' | 'years',
     timezone: string = DEFAULT_TIMEZONE,
): Date => {
     const dt = DateTime.fromJSDate(date).setZone(timezone);
     return dt.plus({ [unit]: amount }).toJSDate();
};

/**
 * Subtract time from a date
 */
export const subtractTime = (
     date: Date,
     amount: number,
     unit: 'days' | 'hours' | 'minutes' | 'weeks' | 'months' | 'years',
     timezone: string = DEFAULT_TIMEZONE,
): Date => {
     const dt = DateTime.fromJSDate(date).setZone(timezone);
     return dt.minus({ [unit]: amount }).toJSDate();
};

/**
 * Calculate leave by time (subtract travel time from event start)
 */
export const calculateLeaveByTime = (
     eventStartDate: Date,
     travelMinutes: number,
     timezone: string = DEFAULT_TIMEZONE,
): Date => {
     const dt = DateTime.fromJSDate(eventStartDate).setZone(timezone);
     return dt.minus({ minutes: travelMinutes }).toJSDate();
};

/**
 * Check if date is between two dates (inclusive)
 */
export const isBetween = (
     date: Date,
     startDate: Date,
     endDate: Date,
     timezone: string = DEFAULT_TIMEZONE,
): boolean => {
     const dt = DateTime.fromJSDate(date).setZone(timezone);
     const start = DateTime.fromJSDate(startDate).setZone(timezone);
     const end = DateTime.fromJSDate(endDate).setZone(timezone);

     return dt >= start && dt <= end;
};

/**
 * Parse date string with timezone
 */
export const parseDate = (
     dateString: string,
     format: string = 'yyyy-MM-dd',
     timezone: string = DEFAULT_TIMEZONE,
): Date => {
     return DateTime.fromFormat(dateString, format, { zone: timezone }).toJSDate();
};

/**
 * Get current date and time
 */
export const getCurrentDateTime = (timezone: string = DEFAULT_TIMEZONE): Date => {
     return DateTime.now().setZone(timezone).toJSDate();
};

/**
 * Convert date to different timezone
 */
export const convertTimezone = (date: Date, toTimezone: string): Date => {
     return DateTime.fromJSDate(date).setZone(toTimezone).toJSDate();
};

/**
 * Get time remaining in detailed format
 */
export const getTimeRemaining = (
     date: Date,
     timezone: string = DEFAULT_TIMEZONE,
): {
     days: number;
     hours: number;
     minutes: number;
     seconds: number;
     totalSeconds: number;
} => {
     const now = DateTime.now().setZone(timezone);
     const target = DateTime.fromJSDate(date).setZone(timezone);
     const diff = target.diff(now, ['days', 'hours', 'minutes', 'seconds']).toObject();

     return {
          days: Math.floor(diff.days || 0),
          hours: Math.floor(diff.hours || 0),
          minutes: Math.floor(diff.minutes || 0),
          seconds: Math.floor(diff.seconds || 0),
          totalSeconds: Math.floor(target.diff(now, 'seconds').seconds),
     };
};

/**
 * Get day name (e.g., "Monday", "Tuesday")
 */
export const getDayName = (date: Date, timezone: string = DEFAULT_TIMEZONE): string => {
     return DateTime.fromJSDate(date).setZone(timezone).toFormat('EEEE');
};

/**
 * Get month name (e.g., "January", "February")
 */
export const getMonthName = (date: Date, timezone: string = DEFAULT_TIMEZONE): string => {
     return DateTime.fromJSDate(date).setZone(timezone).toFormat('LLLL');
};

/**
 * Check if a year is leap year
 */
export const isLeapYear = (date: Date, timezone: string = DEFAULT_TIMEZONE): boolean => {
     return DateTime.fromJSDate(date).setZone(timezone).isInLeapYear;
};

export default {
     calculateDaysUntil,
     calculateHoursUntil,
     calculateMinutesUntil,
     formatDate,
     formatRelativeTime,
     isToday,
     isTomorrow,
     isPast,
     isFuture,
     isThisWeek,
     isThisMonth,
     getStartOfDay,
     getEndOfDay,
     getStartOfWeek,
     getEndOfWeek,
     getStartOfMonth,
     getEndOfMonth,
     addTime,
     subtractTime,
     calculateLeaveByTime,
     isBetween,
     parseDate,
     getCurrentDateTime,
     convertTimezone,
     getTimeRemaining,
     getDayName,
     getMonthName,
     isLeapYear,
};
