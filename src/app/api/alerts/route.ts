import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { Alert } from '@/models/Alert';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const severity = searchParams.get('severity'); // Critical | High | Medium | Low
    const status = searchParams.get('status');     // Open | Investigating | Resolved | Isolated

    const query: Record<string, any> = {};
    if (severity) query.severity = severity;
    if (status) {
      if (status === 'Resolved') {
        query.status = 'Resolved';
      } else {
        query.status = status;
      }
    }

    const alerts = await Alert.find(query)
      .sort({ timestamp: -1 })
      .limit(100)
      .populate('employeeId', 'name email department currentTrustScore');

    return NextResponse.json(alerts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
