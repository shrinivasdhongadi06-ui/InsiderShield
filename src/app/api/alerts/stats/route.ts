import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { Alert } from '@/models/Alert';
import { Employee } from '@/models/Employee';
import { ActivityLog } from '@/models/ActivityLog';

export async function GET() {
  try {
    await connectDB();

    const activeThreats = await Alert.countDocuments({ status: { $in: ['Open', 'Investigating'] } });
    const criticalIncidents = await Alert.countDocuments({ severity: 'Critical' });
    const isolatedSessions = await Employee.countDocuments({ status: 'Isolated' });

    const logs = await ActivityLog.find({}, 'anomalyScore');
    const avgRiskScore = logs.length
      ? Math.round(logs.reduce((acc, l) => acc + (l.anomalyScore || 0), 0) / logs.length)
      : 0;

    return NextResponse.json({ activeThreats, criticalIncidents, isolatedSessions, avgRiskScore });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
