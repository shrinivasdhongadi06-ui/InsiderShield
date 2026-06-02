import { Alert } from '@/models/Alert';
import { Employee } from '@/models/Employee';
import { ActivityLog } from '@/models/ActivityLog';
import type { IThreatStats } from '@/types';
import { average } from '@/utils';

// ─── Alert / Threat Stats Service ─────────────────────────────────────────────

/**
 * Fetches aggregated threat center statistics.
 */
export async function getThreatStats(): Promise<IThreatStats> {
  const [activeThreats, criticalIncidents, isolatedSessions, logs] = await Promise.all([
    Alert.countDocuments({ status: { $in: ['Open', 'Investigating', 'Escalated'] } }),
    Alert.countDocuments({ severity: 'Critical' }),
    Employee.countDocuments({ status: 'Isolated' }),
    ActivityLog.find({}, 'anomalyScore').lean(),
  ]);

  const avgRiskScore = average((logs as any[]).map((l) => l.anomalyScore || 0));

  return { activeThreats, criticalIncidents, isolatedSessions, avgRiskScore };
}
