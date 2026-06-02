// ─── Date Formatting Utilities ────────────────────────────────────────────────

/**
 * Formats a date string/Date to "MM/DD" short format.
 */
export function formatShortDate(dateStr: string): string {
  return dateStr.split('-').slice(1).join('/');
}

/**
 * Derives an ISO date key (YYYY-MM-DD) from a timestamp.
 */
export function getDayKey(timestamp: string | Date): string {
  return new Date(timestamp).toISOString().split('T')[0];
}

/**
 * Aggregates an array of numbers into a rounded average.
 */
export function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

/**
 * Returns a Date that is N days before now.
 */
export function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}
