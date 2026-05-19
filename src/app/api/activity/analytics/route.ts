import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { ActivityLog } from '@/models/ActivityLog';
import { TrustHistory } from '@/models/TrustHistory';

export async function GET() {
  try {
    await connectDB();

    // Last 30 days of activity logs
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const logs = await ActivityLog.find({ timestamp: { $gte: since } })
      .sort({ timestamp: 1 })
      .select('timestamp downloads anomalyScore loginHour')
      .lean();

    // Aggregate downloads by day
    const downloadsMap: Record<string, number> = {};
    const anomalyMap: Record<string, number[]> = {};
    const loginHourMap: Record<number, number> = {};

    logs.forEach((l: any) => {
      const day = new Date(l.timestamp).toISOString().split('T')[0];
      downloadsMap[day] = (downloadsMap[day] || 0) + (l.downloads || 0);
      if (!anomalyMap[day]) anomalyMap[day] = [];
      anomalyMap[day].push(l.anomalyScore || 0);
      const hour = l.loginHour ?? new Date(l.timestamp).getHours();
      loginHourMap[hour] = (loginHourMap[hour] || 0) + 1;
    });

    const downloadsByDay = Object.entries(downloadsMap).map(([date, downloads]) => ({ date, downloads }));
    const anomalyByDay = Object.entries(anomalyMap).map(([date, scores]) => ({
      date,
      anomaly: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));

    const loginHours = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: loginHourMap[h] || 0,
    }));

    // Trust history last 14 days
    const trustSince = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const trustLogs = await TrustHistory.find({ timestamp: { $gte: trustSince } })
      .sort({ timestamp: 1 })
      .select('timestamp score')
      .lean();

    const trustByDay: Record<string, number[]> = {};
    trustLogs.forEach((t: any) => {
      const day = new Date(t.timestamp).toISOString().split('T')[0];
      if (!trustByDay[day]) trustByDay[day] = [];
      trustByDay[day].push(t.score);
    });
    const trustHistory = Object.entries(trustByDay).map(([date, scores]) => ({
      date,
      avgTrust: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));

    return NextResponse.json({ downloadsByDay, anomalyByDay, loginHours, trustHistory });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
