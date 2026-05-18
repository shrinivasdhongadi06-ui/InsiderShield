import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { ActivityLog } from '@/models/ActivityLog';

export async function GET() {
  try {
    await connectDB();
    const logs = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(20)
      .populate('employeeId', 'name department');
      
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
