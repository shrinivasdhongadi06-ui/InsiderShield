/**
 * Trust Intelligence Engine (TIE)
 * ────────────────────────────────
 * Centralized behavioral trust scoring, anomaly detection, severity assignment,
 * explainable reasoning, adaptive isolation, and trust history intelligence.
 *
 * This is the ONLY place trust scores are calculated and anomaly scores are produced.
 * Import helpers from here — never compute trust inline in API routes or components.
 *
 * Does NOT add ML models, LLMs, or external infrastructure.
 * Uses only TypeScript + existing MongoDB models.
 */

import type { IEmployee } from '@/models/Employee';
import {
  EVENT_WEIGHTS,
  CONTEXT_MULTIPLIERS,
  SENSITIVITY_MULTIPLIERS,
  TRUST_DECAY,
  DEFAULT_THRESHOLDS,
  BASELINE_DEVIATION,
  ALERT_GENERATION_THRESHOLD,
} from '@/constants/trustRules';
import type { AlertSeverity } from '@/types';

// ─── Public Interfaces ────────────────────────────────────────────────────────

export interface ActivityContext {
  action: string;
  loginHour: number;
  device: string;
  downloads: number;
  filesAccessed: number;
  location: string;
  sessionDuration: number;
  isSuspicious?: boolean;       // override hint from simulation
}

export interface TrustEvaluation {
  anomalyScore: number;           // 0–100
  trustImpact: number;            // signed delta applied to trust score
  newTrustScore: number;          // clamped 0–100
  severity: AlertSeverity | null; // null → no alert
  shouldCreateAlert: boolean;
  shouldIsolate: boolean;
  reasoning: string[];            // human-readable explanation lines
  riskFactors: string[];          // short tags, e.g. "UNKNOWN_DEVICE"
  contextFlags: ContextFlags;
}

export interface ContextFlags {
  afterHours: boolean;
  unknownDevice: boolean;
  bulkDownload: boolean;
  foreignLocation: boolean;
  excessiveFiles: boolean;
  abnormalSession: boolean;
  suspiciousActionType: boolean;
}

export interface TrustEngineSettings {
  isolationThreshold?: number;     // default: DEFAULT_THRESHOLDS.ISOLATION
  criticalThreshold?: number;      // anomalyScore above which → Critical
  highThreshold?: number;
  sensitivity?: string;            // 'Conservative' | 'Balanced' | 'Aggressive'
  autoIsolate?: boolean;
}

export interface HistoryTrend {
  recentAnomaly: boolean;         // anomalies in last window
  recentAnomalyCount: number;
  isCompounding: boolean;
  avgRecentScore: number;
}

// ─── Context Flag Detection ───────────────────────────────────────────────────

function detectContextFlags(
  ctx: ActivityContext,
  employee: Pick<IEmployee, 'baseline'>
): ContextFlags {
  const baseline = employee.baseline;
  const { AFTER_HOURS_RANGE_START, AFTER_HOURS_RANGE_END,
          DOWNLOAD_MULTIPLIER, FILES_ACCESSED_MULTIPLIER,
          SESSION_DURATION_MINUTES } = BASELINE_DEVIATION;

  const afterHours =
    ctx.loginHour >= AFTER_HOURS_RANGE_START || ctx.loginHour < AFTER_HOURS_RANGE_END;

  const trustedDevices = baseline.trustedDevices ?? ['Corporate Laptop'];
  const unknownDevice = !trustedDevices.some((d) =>
    ctx.device.toLowerCase().includes(d.toLowerCase())
  );

  const normalDownloads = baseline.normalDownloads ?? 5;
  const bulkDownload = ctx.downloads > normalDownloads * DOWNLOAD_MULTIPLIER;

  const normalLocation = (baseline.normalLocation ?? 'Office').toLowerCase();
  const foreignLocation =
    !ctx.location.toLowerCase().includes(normalLocation) &&
    ctx.location.toLowerCase() !== 'office';

  const normalFiles = baseline.normalFilesAccessed ?? 20;
  const excessiveFiles = ctx.filesAccessed > normalFiles * FILES_ACCESSED_MULTIPLIER;

  const normalSession = baseline.normalSessionDuration ?? 480;
  const abnormalSession = ctx.sessionDuration > normalSession + SESSION_DURATION_MINUTES;

  const suspiciousActionTypes = [
    'bulk download',
    'unauthorized file access',
    'login outside working hours',
    'unknown device access',
  ];
  const suspiciousActionType = suspiciousActionTypes.some((s) =>
    ctx.action.toLowerCase().includes(s)
  );

  return {
    afterHours,
    unknownDevice,
    bulkDownload,
    foreignLocation,
    excessiveFiles,
    abnormalSession,
    suspiciousActionType,
  };
}

// ─── Anomaly Score Calculator ─────────────────────────────────────────────────

function calculateAnomalyScore(
  flags: ContextFlags,
  settings: TrustEngineSettings,
  historyTrend: HistoryTrend
): { anomalyScore: number; rawDelta: number; riskFactors: string[] } {
  const sensitivity = settings.sensitivity ?? 'Balanced';
  const sensitivityMult = SENSITIVITY_MULTIPLIERS[sensitivity] ?? 1.0;
  let delta = 0;
  const riskFactors: string[] = [];

  if (flags.unknownDevice)       { delta += Math.abs(EVENT_WEIGHTS.UNKNOWN_DEVICE);          riskFactors.push('UNKNOWN_DEVICE'); }
  if (flags.afterHours)          { delta += Math.abs(EVENT_WEIGHTS.AFTER_HOURS_LOGIN);        riskFactors.push('AFTER_HOURS'); }
  if (flags.bulkDownload)        { delta += Math.abs(EVENT_WEIGHTS.BULK_DOWNLOAD);            riskFactors.push('BULK_DOWNLOAD'); }
  if (flags.foreignLocation)     { delta += Math.abs(EVENT_WEIGHTS.FOREIGN_LOCATION);         riskFactors.push('FOREIGN_LOCATION'); }
  if (flags.excessiveFiles)      { delta += Math.abs(EVENT_WEIGHTS.EXCESSIVE_FILE_ACCESS);    riskFactors.push('EXCESSIVE_FILES'); }
  if (flags.abnormalSession)     { delta += Math.abs(EVENT_WEIGHTS.ABNORMAL_SESSION);         riskFactors.push('ABNORMAL_SESSION'); }
  if (flags.suspiciousActionType){ delta += Math.abs(EVENT_WEIGHTS.UNAUTHORIZED_FILE_ACCESS); riskFactors.push('SUSPICIOUS_ACTION'); }

  // Contextual multipliers
  let contextMult = 1.0;
  const flagCount = riskFactors.length;

  if (flags.unknownDevice && flags.bulkDownload) {
    contextMult = Math.max(contextMult, CONTEXT_MULTIPLIERS.UNKNOWN_DEVICE_BULK);
  }
  if (flags.afterHours && flags.foreignLocation) {
    contextMult = Math.max(contextMult, CONTEXT_MULTIPLIERS.AFTER_HOURS_FOREIGN);
  }
  if (flags.afterHours && flags.unknownDevice) {
    contextMult = Math.max(contextMult, CONTEXT_MULTIPLIERS.AFTER_HOURS_UNKNOWN);
  }
  if (flagCount >= 3) {
    contextMult = Math.max(contextMult, CONTEXT_MULTIPLIERS.TRIPLE_SIGNAL);
  } else if (flagCount >= 2 && contextMult === 1.0) {
    contextMult = Math.max(contextMult, CONTEXT_MULTIPLIERS.DUAL_SIGNAL);
  }

  // History compounding: repeated anomalies amplify
  if (historyTrend.isCompounding) {
    contextMult = Math.max(contextMult, CONTEXT_MULTIPLIERS.REPEATED_ANOMALY);
  }

  const rawDelta = delta * contextMult * sensitivityMult;
  const anomalyScore = Math.min(100, Math.round(rawDelta));

  return { anomalyScore, rawDelta, riskFactors };
}

// ─── Trust Impact Calculator ──────────────────────────────────────────────────

function calculateTrustImpact(
  anomalyScore: number,
  isNormalBehavior: boolean,
  historyTrend: HistoryTrend,
  settings: TrustEngineSettings
): number {
  const sensitivity = settings.sensitivity ?? 'Balanced';
  const sensitivityMult = SENSITIVITY_MULTIPLIERS[sensitivity] ?? 1.0;

  if (isNormalBehavior) {
    // Gradual trust recovery — does NOT instantly recover
    let recovery = TRUST_DECAY.NORMAL_RECOVERY_PER_EVENT * sensitivityMult;
    // Recovery is slower if there's a recent anomaly history
    if (historyTrend.recentAnomalyCount > 0) {
      recovery *= 0.6;
    }
    return Math.min(recovery, TRUST_DECAY.MAX_DAILY_RECOVERY);
  }

  // Suspicious: trust reduction based on anomaly score
  let reduction = (anomalyScore / 100) * 30 * sensitivityMult;

  // Compound: repeated anomalies add additional penalty
  if (historyTrend.isCompounding) {
    reduction *= TRUST_DECAY.COMPOUND_FACTOR;
  }

  return -Math.round(reduction);
}

// ─── Severity Calculator ──────────────────────────────────────────────────────

function calculateSeverity(
  anomalyScore: number,
  trustScore: number,
  historyTrend: HistoryTrend,
  settings: TrustEngineSettings
): AlertSeverity | null {
  if (anomalyScore < ALERT_GENERATION_THRESHOLD) return null;

  const criticalThreshold = settings.criticalThreshold ?? DEFAULT_THRESHOLDS.CRITICAL_ANOMALY;
  const highThreshold     = settings.highThreshold     ?? DEFAULT_THRESHOLDS.HIGH_ANOMALY;

  // Elevate severity if trust is already critically low
  const trustPressure = trustScore < 30 ? 2 : trustScore < 50 ? 1 : 0;

  const effectiveScore = anomalyScore + trustPressure * 8;

  if (effectiveScore >= criticalThreshold || historyTrend.recentAnomalyCount >= 5) {
    return 'Critical';
  }
  if (effectiveScore >= highThreshold || historyTrend.recentAnomalyCount >= 3) {
    return 'High';
  }
  if (effectiveScore >= ALERT_GENERATION_THRESHOLD) {
    return anomalyScore > 20 ? 'Medium' : 'Low';
  }
  return null;
}

// ─── Isolation Decision ───────────────────────────────────────────────────────

function shouldIsolate(
  newTrustScore: number,
  severity: AlertSeverity | null,
  historyTrend: HistoryTrend,
  settings: TrustEngineSettings
): boolean {
  if (!settings.autoIsolate) return false;

  const isolationThreshold = settings.isolationThreshold ?? DEFAULT_THRESHOLDS.ISOLATION;

  if (newTrustScore < isolationThreshold) return true;
  if (severity === 'Critical' && historyTrend.recentAnomalyCount >= 3) return true;

  return false;
}

// ─── Explainable Reasoning Generator ─────────────────────────────────────────

function generateReasoning(
  ctx: ActivityContext,
  flags: ContextFlags,
  anomalyScore: number,
  trustImpact: number,
  historyTrend: HistoryTrend,
  employee: Pick<IEmployee, 'baseline' | 'name'>
): string[] {
  const lines: string[] = [];

  if (anomalyScore === 0 || Object.values(flags).every((f) => !f)) {
    lines.push(`Normal activity detected: ${ctx.action}`);
    lines.push(`${ctx.action} at ${ctx.loginHour}:00 is within expected working hours`);
    lines.push(`Trusted device recognized — no device anomaly`);
    if (trustImpact > 0) {
      lines.push(`Trust score improving: +${trustImpact.toFixed(1)} pts for consistent normal behavior`);
    }
    return lines;
  }

  lines.push(`Behavioral anomaly detected — trust score reduced by ${Math.abs(trustImpact).toFixed(1)} pts`);

  if (flags.afterHours) {
    const actionLower = ctx.action.toLowerCase();
    if (actionLower.includes('login') || actionLower.includes('logout')) {
      lines.push(`${ctx.action} detected at ${ctx.loginHour}:00 — outside expected work hours (09:00–18:00)`);
    } else if (actionLower.includes('access')) {
      lines.push(`${ctx.action} detected outside expected work hours (09:00–18:00)`);
    } else {
      lines.push(`${ctx.action} activity detected outside expected work hours (09:00–18:00)`);
    }
  }
  if (flags.unknownDevice) {
    lines.push(`Unrecognized device used: "${ctx.device}" — not in employee's trusted device list`);
  }
  if (flags.bulkDownload) {
    const norm = employee.baseline?.normalDownloads ?? 5;
    lines.push(
      `Excessive download activity: ${ctx.downloads} files vs. baseline of ~${norm} — ${(ctx.downloads / norm).toFixed(1)}× above normal`
    );
  }
  if (flags.foreignLocation) {
    const normalLoc = employee.baseline?.normalLocation ?? 'Office';
    lines.push(`Location anomaly: access from "${ctx.location}" — expected location is "${normalLoc}"`);
  }
  if (flags.excessiveFiles) {
    const norm = employee.baseline?.normalFilesAccessed ?? 20;
    lines.push(
      `File access count elevated: ${ctx.filesAccessed} files vs. baseline of ~${norm} — potential data reconnaissance`
    );
  }
  if (flags.abnormalSession) {
    const norm = employee.baseline?.normalSessionDuration ?? 480;
    lines.push(
      `Session duration extended: ${ctx.sessionDuration} min vs. normal ${norm} min — abnormal persistence pattern`
    );
  }
  if (flags.suspiciousActionType) {
    lines.push(`High-risk action type recorded: "${ctx.action}"`);
  }

  if (historyTrend.isCompounding) {
    lines.push(
      `Behavioral pattern is escalating: ${historyTrend.recentAnomalyCount} anomalies detected in recent history — risk is compounding`
    );
  }

  const riskFlagCount = Object.values(flags).filter(Boolean).length;
  if (riskFlagCount >= 3) {
    lines.push(
      `Multiple simultaneous risk signals (${riskFlagCount}) detected — severity amplified via contextual multiplier`
    );
  }

  return lines;
}

// ─── Trust History Intelligence ───────────────────────────────────────────────

/**
 * Analyzes recent TrustHistory records to detect trends, compounding behavior,
 * and provide a context snapshot for the current evaluation.
 */
export function analyzeTrustHistory(
  recentScores: Array<{ score: number; changeReason: string; timestamp: Date | string }>
): HistoryTrend {
  if (!recentScores || recentScores.length === 0) {
    return {
      recentAnomaly: false,
      recentAnomalyCount: 0,
      isCompounding: false,
      avgRecentScore: 100,
    };
  }

  const windowMs = TRUST_DECAY.TREND_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - windowMs;

  const recentWindow = recentScores.filter(
    (h) => new Date(h.timestamp).getTime() >= cutoff
  );

  const anomalousEntries = recentWindow.filter((h) =>
    /suspicious|anomal|bulk|unknown|foreign|unauthorized|escalat/i.test(h.changeReason)
  );

  const recentAnomalyCount = anomalousEntries.length;
  const recentAnomaly = recentAnomalyCount > 0;
  const isCompounding = recentAnomalyCount >= TRUST_DECAY.COMPOUND_ANOMALY_COUNT_THRESHOLD;

  const scores = recentWindow.map((h) => h.score);
  const avgRecentScore =
    scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 100;

  return { recentAnomaly, recentAnomalyCount, isCompounding, avgRecentScore };
}

// ─── Main Evaluation Entry Point ──────────────────────────────────────────────

/**
 * evaluateTrust — Core trust intelligence function.
 *
 * Given an employee, activity context, trust history, and optional settings,
 * returns a complete TrustEvaluation with:
 *   - anomalyScore (0–100)
 *   - trustImpact (signed delta)
 *   - newTrustScore (clamped 0–100)
 *   - severity (Low/Medium/High/Critical or null)
 *   - shouldCreateAlert
 *   - shouldIsolate
 *   - reasoning[] (readable explanation lines)
 *   - riskFactors[] (short tag labels)
 *   - contextFlags
 */
export function evaluateTrust(
  employee: Pick<IEmployee, 'name' | 'currentTrustScore' | 'baseline'>,
  ctx: ActivityContext,
  historyTrend: HistoryTrend,
  settings: TrustEngineSettings = {}
): TrustEvaluation {
  const flags = detectContextFlags(ctx, employee);

  // Determine if this event is genuinely normal
  const isNormalBehavior =
    !flags.afterHours &&
    !flags.unknownDevice &&
    !flags.bulkDownload &&
    !flags.foreignLocation &&
    !flags.excessiveFiles &&
    !flags.abnormalSession &&
    !flags.suspiciousActionType;

  const { anomalyScore, riskFactors } = calculateAnomalyScore(flags, settings, historyTrend);
  const trustImpact = calculateTrustImpact(anomalyScore, isNormalBehavior, historyTrend, settings);
  const newTrustScore = Math.max(0, Math.min(100, Math.round(employee.currentTrustScore + trustImpact)));

  const severity = calculateSeverity(anomalyScore, newTrustScore, historyTrend, settings);
  const shouldCreateAlert = anomalyScore >= ALERT_GENERATION_THRESHOLD;
  const isolate = shouldIsolate(newTrustScore, severity, historyTrend, settings);

  const reasoning = generateReasoning(ctx, flags, anomalyScore, trustImpact, historyTrend, employee);

  return {
    anomalyScore,
    trustImpact,
    newTrustScore,
    severity,
    shouldCreateAlert,
    shouldIsolate: isolate,
    reasoning,
    riskFactors,
    contextFlags: flags,
  };
}

// ─── Alert Title Generator ────────────────────────────────────────────────────

/**
 * Generates a context-aware alert title based on the dominant risk factor.
 */
export function generateAlertTitle(riskFactors: string[], severity: AlertSeverity, action?: string): string {
  if (riskFactors.includes('BULK_DOWNLOAD') && riskFactors.includes('UNKNOWN_DEVICE')) {
    return 'Data Exfiltration Attempt Detected';
  }
  if (riskFactors.includes('AFTER_HOURS') && riskFactors.includes('FOREIGN_LOCATION')) {
    return 'Off-Hours Remote Access Anomaly';
  }
  if (riskFactors.includes('BULK_DOWNLOAD')) {
    return 'Excessive Data Download Activity';
  }
  if (riskFactors.includes('UNKNOWN_DEVICE')) {
    return 'Unrecognized Device Access Detected';
  }
  if (riskFactors.includes('AFTER_HOURS')) {
    return action ? `${action} Anomaly Detected` : 'After-Hours System Access Detected';
  }
  if (riskFactors.includes('FOREIGN_LOCATION')) {
    return 'Unusual Geographic Access Pattern';
  }
  if (riskFactors.includes('EXCESSIVE_FILES')) {
    return 'Abnormal File Access Volume Detected';
  }
  if (riskFactors.includes('SUSPICIOUS_ACTION')) {
    return action ? `${action} Activity Detected` : 'Unauthorized Action Behavior Detected';
  }
  if (severity === 'Critical') return 'Critical Behavioral Anomaly Detected';
  if (severity === 'High')     return 'High-Risk Behavioral Pattern Identified';
  return 'Behavioral Anomaly Detected';
}

/**
 * Generates a descriptive alert description with employee context.
 */
export function generateAlertDescription(
  employeeName: string,
  riskFactors: string[],
  anomalyScore: number,
  action?: string
): string {
  const factorDescriptions: Record<string, string> = {
    UNKNOWN_DEVICE:    'unrecognized device access',
    AFTER_HOURS:       action ? `after-hours ${action.toLowerCase()} activity` : 'after-hours login activity',
    BULK_DOWNLOAD:     'excessive data download behavior',
    FOREIGN_LOCATION:  'geographic access anomaly',
    EXCESSIVE_FILES:   'abnormal file access patterns',
    ABNORMAL_SESSION:  'extended session duration anomaly',
    SUSPICIOUS_ACTION: action ? `unauthorized execution of ${action.toLowerCase()}` : 'high-risk action execution',
  };

  const described = riskFactors
    .slice(0, 3)
    .map((f) => factorDescriptions[f] ?? f.toLowerCase().replace(/_/g, ' '))
    .join(', ');

  return `${employeeName} triggered a behavioral anomaly (score: ${anomalyScore}) involving ${described}. Immediate review recommended.`;
}

// ─── Trust Score Color Helper (Frontend) ─────────────────────────────────────

/**
 * Returns Tailwind color classes for a trust score value.
 * Safe to import in client components — no server-only dependencies.
 */
export function getTrustScoreStyle(score: number): {
  bar: string;
  text: string;
  badge: string;
  label: string;
} {
  if (score >= DEFAULT_THRESHOLDS.SAFE) {
    return {
      bar:   'bg-green-500',
      text:  'text-green-700',
      badge: 'bg-green-50 text-green-700 border-green-200',
      label: 'Trusted',
    };
  }
  if (score >= DEFAULT_THRESHOLDS.MEDIUM_RISK) {
    return {
      bar:   'bg-amber-400',
      text:  'text-amber-600',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      label: 'Caution',
    };
  }
  if (score >= DEFAULT_THRESHOLDS.HIGH_RISK) {
    return {
      bar:   'bg-orange-500',
      text:  'text-orange-700',
      badge: 'bg-orange-50 text-orange-700 border-orange-200',
      label: 'High Risk',
    };
  }
  return {
    bar:   'bg-red-500',
    text:  'text-red-700',
    badge: 'bg-red-50 text-red-700 border-red-200',
    label: 'Critical',
  };
}

// ─── Change Reason Builder ────────────────────────────────────────────────────

/**
 * Generates a structured TrustHistory changeReason string with the action,
 * risk level, and key flags — supports future trend analysis and ML tagging.
 */
export function buildChangeReason(
  action: string,
  anomalyScore: number,
  riskFactors: string[]
): string {
  if (riskFactors.length === 0) {
    return `Normal: ${action}`;
  }
  const level = anomalyScore >= 40 ? 'CRITICAL' : anomalyScore >= 25 ? 'HIGH' : anomalyScore >= 10 ? 'MEDIUM' : 'LOW';
  return `Suspicious[${level}]: ${action} — ${riskFactors.join(', ')}`;
}
