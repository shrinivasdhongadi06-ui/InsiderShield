import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { Employee } from '@/models/Employee';
import { ActivityLog } from '@/models/ActivityLog';
import { Alert } from '@/models/Alert';
import { TrustHistory } from '@/models/TrustHistory';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const [logs, alerts, trustHistory] = await Promise.all([
      ActivityLog.find({ employeeId: id }).sort({ timestamp: -1 }).limit(50),
      Alert.find({ employeeId: id }).sort({ timestamp: -1 }).limit(20),
      TrustHistory.find({ employeeId: id }).sort({ timestamp: 1 }).limit(100),
    ]);

    return NextResponse.json({ employee, logs, alerts, trustHistory });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
