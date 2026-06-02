/**
 * Activity Ingestion Service
 * ──────────────────────────
 * Handles real employee activity submission from the Employee Monitor page.
 * Mirrors the flow of simulationService.ts but uses admin-provided context
 * instead of randomly generated values.
 *
 * Flow:
 *   Activity Payload → Trust Engine → ActivityLog + TrustHistory + Alert + Employee Update
 *
 * IMPORTANT: All trust math is delegated exclusively to evaluateTrust() in trustEngine.ts.
 * This service NEVER calculates trust inline.
 */

import { Employee } from '@/models/Employee';
import { ActivityLog } from '@/models/ActivityLog';
import { Alert } from '@/models/Alert';
import { TrustHistory } from '@/models/TrustHistory';
import { QUERY_LIMITS } from '@/constants';
import {
  evaluateTrust,
  analyzeTrustHistory,
  generateAlertTitle,
  generateAlertDescription,
  buildChangeReason,
} from '@/services/trustEngine';
import { DEFAULT_SETTINGS, toEngineSettings } from '@/services/settingsStore';
import type { PlatformSettings } from '@/services/settingsStore';

// ─── Public Interface ─────────────────────────────────────────────────────────

export interface ActivityIngestionPayload {
  employeeId: string;
  action: string;
  device?: string;
  location?: string;
  downloads?: number;
  filesAccessed?: number;
  sessionDuration?: number;
  loginHour?: number;
}

export interface ActivityIngestionResult {
  employeeId: string;
  employeeName: string;
  action: string;
  anomalyScore: number;
  trustImpact: number;
  newTrustScore: number;
  previousTrustScore: number;
  severity: string | null;
  shouldCreateAlert: boolean;
  alertCreated: boolean;
  reasoning: string[];
  riskFactors: string[];
  contextFlags: Record<string, boolean>;
  sessionId: string;
  timestamp: string;
}

// ─── Main Ingestion Function ──────────────────────────────────────────────────

/**
 * Processes a real employee activity submitted from the Employee Monitor page.
 * Delegates ALL trust scoring to evaluateTrust() — never computes trust inline.
 */
export async function ingestEmployeeActivity(
  payload: ActivityIngestionPayload
): Promise<ActivityIngestionResult> {
  const employee = await Employee.findById(payload.employeeId);
  if (!employee) {
    throw new Error(`Employee not found: ${payload.employeeId}`);
  }

  const baseline = employee.baseline;

  // ── Resolve context — use provided values or fall back to employee baseline ─
  const action         = payload.action.trim();
  const loginHour      = payload.loginHour       ?? new Date().getHours();
  const device         = payload.device?.trim()   || baseline.trustedDevices?.[0] || 'Corporate Laptop';
  const downloads      = payload.downloads        ?? 0;
  const filesAccessed  = payload.filesAccessed    ?? 0;
  const location       = payload.location?.trim() || baseline.normalLocation || 'Office';
  const sessionDuration = payload.sessionDuration ?? 0;

  const previousTrustScore = employee.currentTrustScore;

  // ── Session Correlation ───────────────────────────────────────────────────
  let sessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentLog = await ActivityLog.findOne({
    employeeId: employee._id,
    timestamp: { $gte: oneHourAgo },
    sessionId: { $exists: true, $ne: null },
  }).sort({ timestamp: -1 });

  if (recentLog?.sessionId) {
    sessionId = recentLog.sessionId;
  }

  // ── Fetch Trust History for Trend Analysis ────────────────────────────────
  const recentHistory = await TrustHistory.find({ employeeId: employee._id })
    .sort({ timestamp: -1 })
    .limit(QUERY_LIMITS.TRUST_HISTORY)
    .lean();

  const historyTrend = analyzeTrustHistory(
    recentHistory.map((h) => ({
      score: h.score,
      changeReason: h.changeReason,
      timestamp: h.timestamp,
    }))
  );

  // ── Read Live Settings (synced from Settings page) ────────────────────────
  const liveSettings = (global as any).__trustEngineSettings ?? DEFAULT_SETTINGS;
  const engineSettings = toEngineSettings(liveSettings as PlatformSettings);

  // ── Delegate ALL Trust Math to the Trust Intelligence Engine ──────────────
  const evaluation = evaluateTrust(
    employee,
    { action, loginHour, device, downloads, filesAccessed, location, sessionDuration },
    historyTrend,
    engineSettings
  );

  const {
    anomalyScore,
    trustImpact,
    newTrustScore,
    severity,
    shouldCreateAlert,
    shouldIsolate,
    reasoning,
    riskFactors,
    contextFlags,
  } = evaluation;

  // ── Persist Activity Log ──────────────────────────────────────────────────
  const timestamp = new Date();

  await ActivityLog.create({
    employeeId: employee._id,
    action,
    details: anomalyScore > 0
      ? `Behavioral anomaly detected: ${action}`
      : `Normal activity: ${action}`,
    loginHour,
    device,
    downloads,
    filesAccessed,
    location,
    sessionDuration,
    ipAddress: baseline.usualIPs?.[0] || '192.168.1.1',
    anomalyScore,
    trustImpact,
    sessionId,
    timestamp,
  });

  // ── Create Alert if Needed ────────────────────────────────────────────────
  let alertCreated = false;
  let newStatus = employee.status;

  if (shouldCreateAlert && severity) {
    alertCreated = true;

    if (shouldIsolate) {
      newStatus = 'Isolated';
    }

    const alertTitle       = generateAlertTitle(riskFactors, severity, action);
    const alertDescription = generateAlertDescription(employee.name, riskFactors, anomalyScore, action);

    await Alert.create({
      employeeId:  employee._id,
      severity,
      title:       alertTitle,
      description: alertDescription,
      reasoning,
      status:      newStatus === 'Isolated' ? 'Isolated' : 'Open',
    });
  }

  // ── Update Employee Trust Score and Status ────────────────────────────────
  employee.currentTrustScore = newTrustScore;
  employee.status = newStatus;
  await employee.save();

  // ── Persist Trust History Entry ───────────────────────────────────────────
  const changeReason = buildChangeReason(action, anomalyScore, riskFactors);

  await TrustHistory.create({
    employeeId:   employee._id,
    score:        newTrustScore,
    changeReason,
    anomalyScore,
    riskFactors,
    sensitivity:  engineSettings.sensitivity ?? 'Balanced',
  });

  return {
    employeeId:        String(employee._id),
    employeeName:      employee.name,
    action,
    anomalyScore,
    trustImpact,
    newTrustScore,
    previousTrustScore,
    severity:          severity ?? null,
    shouldCreateAlert,
    alertCreated,
    reasoning,
    riskFactors,
    contextFlags:      contextFlags as unknown as Record<string, boolean>,
    sessionId,
    timestamp:         timestamp.toISOString(),
  };
}
