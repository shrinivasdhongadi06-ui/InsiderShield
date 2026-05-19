import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { Employee } from '@/models/Employee';
import { Alert } from '@/models/Alert';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ employees: [], alerts: [] });
    }

    const regex = new RegExp(q, 'i');

    const [employees, alerts] = await Promise.all([
      Employee.find({
        $or: [{ name: regex }, { department: regex }, { role: regex }, { email: regex }],
      })
        .select('name email department role currentTrustScore status')
        .limit(6)
        .lean(),

      Alert.find({ $or: [{ title: regex }, { description: regex }] })
        .select('title severity status timestamp employeeId')
        .populate('employeeId', 'name')
        .sort({ timestamp: -1 })
        .limit(4)
        .lean(),
    ]);

    return NextResponse.json({ employees, alerts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
