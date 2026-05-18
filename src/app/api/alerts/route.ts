import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { Alert } from '@/models/Alert';

export async function GET() {
  try {
    await connectDB();
    const alerts = await Alert.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('employeeId', 'name email');
      
    return NextResponse.json(alerts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
