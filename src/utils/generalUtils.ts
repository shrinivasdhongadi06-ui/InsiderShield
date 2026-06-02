/**
 * Returns a random integer between min and max (inclusive).
 */
export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns a random element from an array.
 */
export function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Safely parses a comma-separated string into an array of trimmed strings.
 */
export function parseCommaSeparated(value: string | undefined, fallback: string[]): string[] {
  if (!value?.trim()) return fallback;
  const result = value.split(',').map((s) => s.trim()).filter(Boolean);
  return result.length > 0 ? result : fallback;
}

/**
 * Safely accesses an array — returns empty array if not an array.
 */
export function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
