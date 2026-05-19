import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { ActivityLog } from '@/models/ActivityLog';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // normal | suspicious | critical
    const search = searchParams.get('search'); // employee name / device / location

    const query: Record<string, any> = {};

    if (filter === 'suspicious') {
      query.riskScore = { $lt: 0 };
      query.anomalyScore = { $gte: 30, $lt: 70 };
    } else if (filter === 'critical') {
      query.anomalyScore = { $gte: 70 };
    } else if (filter === 'normal') {
      query.riskScore = { $gte: 0 };
      query.anomalyScore = { $lt: 30 };
    }

    let logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(50)
      .populate('employeeId', 'name department email');

    // Apply client-side search if needed
    if (search) {
      const s = search.toLowerCase();
      logs = logs.filter((l: any) => {
        const empName = l.employeeId?.name?.toLowerCase() || '';
        const device = (l.device || '').toLowerCase();
        const location = (l.location || '').toLowerCase();
        return empName.includes(s) || device.includes(s) || location.includes(s);
      });
    }

    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
