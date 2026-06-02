import { ActivityLog } from '@/models/ActivityLog';
import { TrustHistory } from '@/models/TrustHistory';
import type { IActivityAnalytics } from '@/types';
import { getDayKey, daysAgo, average } from '@/utils';
import { QUERY_LIMITS } from '@/constants';

// ─── Activity Analytics Service ───────────────────────────────────────────────

/**
 * Aggregates activity and trust history data for analytics charts.
 */
export async function getActivityAnalytics(): Promise<IActivityAnalytics> {
  const since = daysAgo(QUERY_LIMITS.ANALYTICS_DAYS);
  const trustSince = daysAgo(QUERY_LIMITS.TRUST_HISTORY_DAYS);

  const [logs, trustLogs] = await Promise.all([
    ActivityLog.find({ timestamp: { $gte: since } })
      .sort({ timestamp: 1 })
      .select('timestamp downloads anomalyScore loginHour')
      .lean(),
    TrustHistory.find({ timestamp: { $gte: trustSince } })
      .sort({ timestamp: 1 })
      .select('timestamp score')
      .lean(),
  ]);

  // ── Aggregate downloads and anomaly by day ────────────────────────────────
  const downloadsMap: Record<string, number> = {};
  const anomalyMap: Record<string, number[]> = {};
  const loginHourMap: Record<number, number> = {};

  for (const l of logs as any[]) {
    const day = getDayKey(l.timestamp);
    downloadsMap[day] = (downloadsMap[day] || 0) + (l.downloads || 0);
    if (!anomalyMap[day]) anomalyMap[day] = [];
    anomalyMap[day].push(l.anomalyScore || 0);
    const hour: number = l.loginHour ?? new Date(l.timestamp).getHours();
    loginHourMap[hour] = (loginHourMap[hour] || 0) + 1;
  }

  const downloadsByDay = Object.entries(downloadsMap).map(([date, downloads]) => ({
    date,
    downloads,
  }));

  const anomalyByDay = Object.entries(anomalyMap).map(([date, scores]) => ({
    date,
    anomaly: average(scores),
  }));

  const loginHours = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: loginHourMap[h] || 0,
  }));

  // ── Aggregate trust history by day ────────────────────────────────────────
  const trustByDay: Record<string, number[]> = {};
  for (const t of trustLogs as any[]) {
    const day = getDayKey(t.timestamp);
    if (!trustByDay[day]) trustByDay[day] = [];
    trustByDay[day].push(t.score);
  }

  const trustHistory = Object.entries(trustByDay).map(([date, scores]) => ({
    date,
    avgTrust: average(scores),
  }));

  return { downloadsByDay, anomalyByDay, loginHours, trustHistory };
}
