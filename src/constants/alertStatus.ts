// ─── Alert Status Constants ───────────────────────────────────────────────────
// Single source of truth for all alert status values used across frontend and backend.
// These values MUST match the enum in src/models/Alert.ts and src/types/index.ts

export const ALERT_STATUSES = {
  OPEN: 'Open',
  INVESTIGATING: 'Investigating',
  RESOLVED: 'Resolved',
  ESCALATED: 'Escalated',
  FALSE_POSITIVE: 'FalsePositive',
  ISOLATED: 'Isolated',
} as const;

export type AlertStatusValue = (typeof ALERT_STATUSES)[keyof typeof ALERT_STATUSES];

/** Statuses that represent a closed/terminal lifecycle state */
export const TERMINAL_STATUSES: AlertStatusValue[] = [
  ALERT_STATUSES.RESOLVED,
  ALERT_STATUSES.FALSE_POSITIVE,
];

/** Statuses that count as "active threats" for dashboard metrics */
export const ACTIVE_THREAT_STATUSES: AlertStatusValue[] = [
  ALERT_STATUSES.OPEN,
  ALERT_STATUSES.INVESTIGATING,
  ALERT_STATUSES.ESCALATED,
];
