import { Employee } from '@/models/Employee';
import { ActivityLog } from '@/models/ActivityLog';
import { Alert } from '@/models/Alert';
import { TrustHistory } from '@/models/TrustHistory';
import { SIMULATION, QUERY_LIMITS } from '@/constants';
import { randomBetween, randomFrom } from '@/utils';
import {
  evaluateTrust,
  analyzeTrustHistory,
  generateAlertTitle,
  generateAlertDescription,
  buildChangeReason,
} from '@/services/trustEngine';
import { DEFAULT_SETTINGS, toEngineSettings } from '@/services/settingsStore';
import type { PlatformSettings } from '@/services/settingsStore';

// ─── Simulation Engine Service ────────────────────────────────────────────────

interface SimulationResult {
  employee: string;
  action: string;
  anomalyScore: number;
  trustImpact: number;
  newScore: number;
  status: string;
  alertCreated: boolean;
  reasoning: string[];
}

/**
 * Picks a random active employee and simulates a behavioral event.
 * All trust scoring is delegated to the Trust Intelligence Engine (trustEngine.ts).
 * Creates an ActivityLog, updates Employee trust score, and optionally creates an Alert.
 */
export async function runSimulation(): Promise<SimulationResult> {
  const activeEmployees = await Employee.find({ status: 'Active' });

  if (activeEmployees.length === 0) {
    throw new Error('No active employees found.');
  }

  const employee = randomFrom(activeEmployees);
  const isSuspicious = Math.random() < SIMULATION.SUSPICIOUS_PROBABILITY;
  const baseline = employee.baseline;

  // ── Build activity context fields ─────────────────────────────────────────
  let action: string;
  let loginHour: number;
  let device: string;
  let downloads: number;
  let filesAccessed: number;
  let location: string;
  let sessionDuration: number;

  if (isSuspicious) {
    action        = randomFrom(SIMULATION.SUSPICIOUS_ACTIONS);
    loginHour     = randomBetween(1, 5);
    device        = 'Unknown Device';
    downloads     = (baseline.normalDownloads || 5) + randomBetween(50, 300);
    filesAccessed = (baseline.normalFilesAccessed || 20) + randomBetween(50, 200);
    location      = 'Foreign Location';
    sessionDuration = (baseline.normalSessionDuration || 480) + randomBetween(200, 500);
  } else {
    action        = randomFrom(SIMULATION.NORMAL_ACTIONS);
    loginHour     = randomBetween(9, 17);
    device        = baseline.trustedDevices?.[0] || 'Corporate Laptop';
    downloads     = randomBetween(1, baseline.normalDownloads || 5);
    filesAccessed = randomBetween(5, baseline.normalFilesAccessed || 20);
    location      = baseline.normalLocation || 'Office';
    sessionDuration = randomBetween(30, baseline.normalSessionDuration || 480);
  }

  // ── Session Correlation ───────────────────────────────────────────────────
  let sessionId = `sess_${Math.random().toString(36).substring(2, 11)}`;
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentLog = await ActivityLog.findOne({
    employeeId: employee._id,
    timestamp: { $gte: oneHourAgo },
    sessionId: { $exists: true, $ne: null },
  }).sort({ timestamp: -1 });

  if (recentLog && recentLog.sessionId) {
    sessionId = recentLog.sessionId;
  }

  // ── Trust Intelligence Engine Evaluation ─────────────────────────────────
  // Fetch recent TrustHistory to detect trends and compounding anomalies
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

  // Read live settings from server-side cache (synced by Settings page via POST /api/settings)
  const liveSettings = (global as any).__trustEngineSettings ?? DEFAULT_SETTINGS;
  const engineSettings = toEngineSettings(liveSettings as PlatformSettings);

  // Delegate ALL trust math to the engine
  const evaluation = evaluateTrust(
    employee,
    { action, loginHour, device, downloads, filesAccessed, location, sessionDuration, isSuspicious },
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
  } = evaluation;

  // ── Persist activity log ──────────────────────────────────────────────────
  await ActivityLog.create({
    employeeId: employee._id,
    action,
    details: isSuspicious
      ? `Suspicious behavior detected: ${action}`
      : `Normal activity detected: ${action}`,
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
    timestamp: new Date(),
  });

  // ── Apply trust score and status changes ──────────────────────────────────
  let newStatus = employee.status;
  let alertCreated = false;

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

  // ── Persist employee updates ──────────────────────────────────────────────
  employee.currentTrustScore = newTrustScore;
  employee.status = newStatus;
  await employee.save();

  const changeReason = buildChangeReason(action, anomalyScore, riskFactors);

  await TrustHistory.create({
    employeeId:   employee._id,
    score:        newTrustScore,
    changeReason,
    anomalyScore,
    riskFactors,
    sensitivity:  'Balanced',
  });

  return {
    employee:     employee.name,
    action,
    anomalyScore,
    trustImpact,
    newScore:     newTrustScore,
    status:       newStatus,
    alertCreated,
    reasoning,
  };
}
