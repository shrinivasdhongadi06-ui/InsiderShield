import type { AlertSeverity, RiskLevel } from '@/types';
import { TRUST_THRESHOLDS, SEVERITY_BADGE_CLASSES, STATUS_BADGE_CLASSES } from '@/constants';

// ─── Trust Score Helpers ──────────────────────────────────────────────────────

/**
 * Returns the risk level label and CSS classes based on trust score.
 */
export function getRiskLevelFromScore(score: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (score >= TRUST_THRESHOLDS.SAFE)
    return { label: 'Low', color: 'text-green-700', bg: 'bg-green-50 border-green-200' };
  if (score >= TRUST_THRESHOLDS.MEDIUM)
    return { label: 'Medium', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' };
  if (score >= TRUST_THRESHOLDS.HIGH_RISK)
    return { label: 'High', color: 'text-red-700', bg: 'bg-red-50 border-red-200' };
  return { label: 'Critical', color: 'text-red-900', bg: 'bg-red-100 border-red-300' };
}

/**
 * Returns Tailwind color class for trust score number.
 */
export function getTrustScoreColor(score: number): string {
  if (score >= TRUST_THRESHOLDS.SAFE) return 'text-green-600';
  if (score >= TRUST_THRESHOLDS.MEDIUM) return 'text-orange-500';
  return 'text-red-600';
}

/**
 * Returns progress bar color class based on trust score.
 */
export function getTrustBarColor(score: number): string {
  if (score >= TRUST_THRESHOLDS.SAFE) return 'bg-green-500';
  if (score >= TRUST_THRESHOLDS.MEDIUM) return 'bg-amber-500';
  return 'bg-red-500';
}

/**
 * Clamps trust score between 0 and 100.
 */
export function clampTrustScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

// ─── Anomaly / Risk Level Helpers ─────────────────────────────────────────────

/**
 * Derives risk level from anomaly and risk score fields.
 */
export function getRiskLevel(
  anomalyScore: number,
  riskScore: number
): RiskLevel {
  if (anomalyScore >= 70 || riskScore < -50) return 'critical';
  if (anomalyScore >= 30 || riskScore < 0) return 'suspicious';
  return 'normal';
}

export const RISK_BADGE_CLASSES: Record<RiskLevel, string> = {
  critical: 'bg-red-100 text-red-700 border border-red-200',
  suspicious: 'bg-orange-100 text-orange-700 border border-orange-200',
  normal: 'bg-green-100 text-green-700 border border-green-200',
};

export const RISK_DOT_CLASSES: Record<RiskLevel, string> = {
  critical: 'bg-red-500',
  suspicious: 'bg-orange-500',
  normal: 'bg-green-500',
};

// ─── Severity Helpers ─────────────────────────────────────────────────────────

/**
 * Returns badge CSS classes for alert severity.
 */
export function getSeverityBadgeClass(severity: string): string {
  return SEVERITY_BADGE_CLASSES[severity] ?? 'bg-slate-100 text-slate-600 border border-slate-200';
}

/**
 * Returns badge CSS classes for alert status.
 */
export function getStatusBadgeClass(status: string): string {
  return STATUS_BADGE_CLASSES[status] ?? 'bg-slate-100 text-slate-600 border border-slate-200';
}

/**
 * Maps severity to a numeric risk score percentage (for display bars).
 */
export function getSeverityRiskPercent(severity: AlertSeverity): number {
  const map: Record<AlertSeverity, number> = {
    Critical: 92,
    High: 70,
    Medium: 45,
    Low: 20,
  };
  return map[severity] ?? 0;
}

/**
 * Returns a bar color class for a given severity.
 */
export function getSeverityBarColor(severity: AlertSeverity): string {
  const map: Record<AlertSeverity, string> = {
    Critical: 'bg-red-500',
    High: 'bg-orange-500',
    Medium: 'bg-yellow-500',
    Low: 'bg-blue-500',
  };
  return map[severity] ?? 'bg-slate-400';
}
