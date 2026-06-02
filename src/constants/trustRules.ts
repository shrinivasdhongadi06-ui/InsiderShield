// ─── Trust Intelligence Engine — Rule Constants ───────────────────────────────
// Single source of truth for all trust scoring weights, multipliers, and thresholds.
// Consumed ONLY by /services/trustEngine.ts — do not reference inline elsewhere.

// ─── Per-Event Trust Weight Table ────────────────────────────────────────────
// Positive = trust gained, Negative = trust lost

export const EVENT_WEIGHTS = {
  // ── Normal / Positive Events ─────────────────────────────────────────────
  NORMAL_LOGIN:         +1,
  TRUSTED_DEVICE:       +2,
  NORMAL_HOURS:         +1,
  ROUTINE_FILE_ACCESS:  +1,
  EMAIL_SENT:           +1,
  MEETING_JOINED:       +1,
  READ_DOCUMENT:        +1,

  // ── Suspicious / Negative Events ─────────────────────────────────────────
  UNKNOWN_DEVICE:          -15,
  AFTER_HOURS_LOGIN:       -10,
  BULK_DOWNLOAD:           -20,
  ABNORMAL_SESSION:        -8,
  FOREIGN_LOCATION:        -18,
  FAILED_LOGIN_REPEATED:   -12,
  USB_INSERTION:           -10,
  UNAUTHORIZED_FILE_ACCESS:-16,
  EXCESSIVE_FILE_ACCESS:   -10,
  HIGH_DOWNLOAD_VOLUME:    -14,
  LOCATION_ANOMALY:        -12,
} as const;

// ─── Contextual Risk Multipliers ──────────────────────────────────────────────
// Applied when multiple suspicious signals co-occur in the same event.

export const CONTEXT_MULTIPLIERS = {
  // Two suspicious signals at once
  DUAL_SIGNAL:        1.4,
  // Three or more suspicious signals
  TRIPLE_SIGNAL:      1.8,
  // After-hours + foreign location
  AFTER_HOURS_FOREIGN: 1.6,
  // Unknown device + bulk download
  UNKNOWN_DEVICE_BULK: 1.7,
  // After-hours + unknown device
  AFTER_HOURS_UNKNOWN: 1.5,
  // Repeated anomalies within a short window (compounding)
  REPEATED_ANOMALY:   1.3,
  // Session that spans multiple anomaly types
  MULTI_TYPE_SESSION: 1.5,
} as const;

// ─── Sensitivity Multipliers ─────────────────────────────────────────────────
// Adjust scoring globally based on the Settings sensitivity mode.

export const SENSITIVITY_MULTIPLIERS: Record<string, number> = {
  Conservative: 0.7,   // attenuate risk signals
  Balanced:     1.0,   // default
  Aggressive:   1.35,  // amplify risk signals
};

// ─── Trust Decay / Recovery ───────────────────────────────────────────────────

export const TRUST_DECAY = {
  // Points of recovery per normal event
  NORMAL_RECOVERY_PER_EVENT: 1.5,
  // Max recovery per day (cap)
  MAX_DAILY_RECOVERY: 8,

  // Base decay per suspicious event (before weight application)
  SUSPICIOUS_DECAY_BASE: 5,
  // Compound multiplier when anomalies repeat within a window
  COMPOUND_FACTOR: 1.25,

  // History window (days) for trend analysis
  TREND_WINDOW_DAYS: 7,
  // Threshold of recent anomaly events to trigger compounding
  COMPOUND_ANOMALY_COUNT_THRESHOLD: 3,
} as const;

// ─── Adaptive Isolation Thresholds ───────────────────────────────────────────
// These are the defaults; Settings page overrides take precedence at runtime.

export const DEFAULT_THRESHOLDS = {
  SAFE:               80,   // ≥ 80 → safe / trusted
  MEDIUM_RISK:        60,   // 60–79 → medium risk
  HIGH_RISK:          50,   // 50–59 → high risk
  ISOLATION:          30,   // < 30 → auto-isolate
  CRITICAL_ANOMALY:   40,   // anomalyScore > 40 → Critical severity
  HIGH_ANOMALY:       25,   // anomalyScore 25–40 → High severity
  MEDIUM_ANOMALY:     10,   // anomalyScore 10–25 → Medium severity
} as const;

// ─── Alert Severity Thresholds ───────────────────────────────────────────────

export const ALERT_GENERATION_THRESHOLD = 10;   // min anomalyScore to create an alert

// ─── Reasonable Baseline Deviations ─────────────────────────────────────────
// How much above the employee's normal baseline triggers a flag.

export const BASELINE_DEVIATION = {
  DOWNLOAD_MULTIPLIER:       3.0,  // downloads > 3× normal
  FILES_ACCESSED_MULTIPLIER: 2.5,  // filesAccessed > 2.5× normal
  SESSION_DURATION_MINUTES:  180,  // extra minutes above normal before flagging
  AFTER_HOURS_RANGE_START:   18,   // 18:00 → 08:00 = "after hours"
  AFTER_HOURS_RANGE_END:     8,
} as const;
