/**
 * Centralized Date Management
 * 
 * Provides a consistent "current date/time" throughout the application.
 * - In production: Uses real current date
 * - For development/demo: Can be overridden to match mock data
 * 
 * This ensures consistency between:
 * - Calendar events
 * - Task scheduling
 * - Energy profiles  
 * - Resonance calculations
 */

// DEMO MODE: Set to false to use real current date
const DEMO_MODE = false;

// Demonstration date (only used when DEMO_MODE is true)
const DEMO_DATE = new Date(2026, 1, 6, 10, 30, 0, 0); // 10:30 AM on Feb 6, 2026 (Friday)

/**
 * Get the current application date
 * Returns real date in production, demo date in demo mode
 */
export function getCurrentDate(): Date {
  if (DEMO_MODE) {
    return new Date(DEMO_DATE);
  }
  return new Date();
}

/**
 * Get the current application time (for time-sensitive operations)
 * This advances the demo time by the actual elapsed time
 */
export function getCurrentTime(): Date {
  return getCurrentDate();
}

/**
 * Check if a date is "today" in application context
 */
export function isToday(date: Date | string): boolean {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const today = getCurrentDate();
  
  return (
    checkDate.getFullYear() === today.getFullYear() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getDate() === today.getDate()
  );
}

/**
 * Get start of "today" (application context)
 */
export function getStartOfToday(): Date {
  const today = getCurrentDate();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
}

/**
 * Get end of "today" (application context)
 */
export function getEndOfToday(): Date {
  const today = getCurrentDate();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
}

/**
 * Format date for display (respects application date)
 */
export function formatAppDate(
  format: 'short' | 'long' | 'full' = 'short'
): string {
  const date = getCurrentDate();
  
  const options: Intl.DateTimeFormatOptions = {
    weekday: format === 'full' || format === 'long' ? 'long' : undefined,
    year: 'numeric',
    month: format === 'full' ? 'long' : 'short',
    day: 'numeric',
  };
  
  return date.toLocaleDateString('en-US', options);
}

/**
 * Get application date info
 */
export function getAppDateInfo() {
  const date = getCurrentDate();
  return {
    date,
    formatted: formatAppDate('full'),
    isDemo: DEMO_MODE,
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    dayOfWeek: date.getDay(),
    timestamp: date.getTime(),
  };
}