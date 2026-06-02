import type { AlertSeverity, AlertStatus, EmployeeStatus } from '@/types';

// ─── Trust Score Thresholds ───────────────────────────────────────────────────

export const TRUST_THRESHOLDS = {
  SAFE: 80,
  MEDIUM: 60,
  HIGH_RISK: 40,
  ISOLATION_THRESHOLD: 50,
} as const;

// ─── Alert Severity Levels ────────────────────────────────────────────────────

export const ALERT_SEVERITIES: AlertSeverity[] = ['Low', 'Medium', 'High', 'Critical'];

export const ALERT_STATUSES: AlertStatus[] = ['Open', 'Investigating', 'Resolved', 'Isolated', 'Escalated', 'FalsePositive'];

// ─── Employee Statuses ────────────────────────────────────────────────────────

export const EMPLOYEE_STATUSES: EmployeeStatus[] = ['Active', 'Isolated', 'Suspended'];

// ─── Simulation Settings ──────────────────────────────────────────────────────

export const SIMULATION = {
  SUSPICIOUS_PROBABILITY: 0.25,
  NORMAL_ACTIONS: ['Login', 'Read Document', 'Email Sent', 'Meeting Joined'] as const,
  SUSPICIOUS_ACTIONS: [
    'Bulk Download',
    'Unauthorized File Access',
    'Login Outside Working Hours',
    'Unknown Device Access',
  ] as const,
  ANOMALY_SCORE: {
    SUSPICIOUS_MIN: 20,
    SUSPICIOUS_MAX: 50,
    ALERT_THRESHOLD: 25,
    HIGH_THRESHOLD: 30,
    CRITICAL_THRESHOLD: 40,
  },
  TRUST_IMPACT: {
    NORMAL_MIN: 1,
    NORMAL_MAX: 3,
    SUSPICIOUS_MIN: 10,
    SUSPICIOUS_MAX: 25,
  },
} as const;

// ─── Monitoring Intervals (ms) ────────────────────────────────────────────────

export const POLLING_INTERVALS = {
  DASHBOARD: 5000,
  THREAT_CENTER: 10000,
  ACTIVITY_LOGS: 5000,
  EMPLOYEES: 5000,
} as const;

// ─── Severity Badge CSS Classes ───────────────────────────────────────────────

export const SEVERITY_BADGE_CLASSES: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700 border border-red-200',
  High: 'bg-orange-100 text-orange-700 border border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  Low: 'bg-blue-100 text-blue-700 border border-blue-200',
};

export const STATUS_BADGE_CLASSES: Record<string, string> = {
  Open: 'bg-red-50 text-red-600 border border-red-200',
  Investigating: 'bg-amber-50 text-amber-600 border border-amber-200',
  Resolved: 'bg-green-50 text-green-600 border border-green-200',
  Isolated: 'bg-purple-50 text-purple-600 border border-purple-200',
  Escalated: 'bg-orange-50 text-orange-600 border border-orange-200',
  FalsePositive: 'bg-slate-50 text-slate-500 border border-slate-200',
};

// ─── API Query Limits ─────────────────────────────────────────────────────────

export const QUERY_LIMITS = {
  ACTIVITY_LOGS: 50,
  ALERTS: 100,
  TRUST_HISTORY: 100,
  EMPLOYEE_LOGS: 50,
  EMPLOYEE_ALERTS: 20,
  SEARCH_EMPLOYEES: 6,
  SEARCH_ALERTS: 4,
  ANALYTICS_DAYS: 30,
  TRUST_HISTORY_DAYS: 14,
} as const;
