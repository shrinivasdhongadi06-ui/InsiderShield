import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { Employee } from '@/models/Employee';
import { Alert } from '@/models/Alert';

export async function GET() {
  try {
    await connectDB();

    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'Active' });
    const isolatedSessions = await Employee.countDocuments({ status: 'Isolated' });
    
    const threatsDetected = await Alert.countDocuments({ status: { $in: ['Open', 'Investigating'] } });
    
    const employees = await Employee.find({}, 'currentTrustScore');
    const avgTrustScore = employees.length 
      ? Math.round(employees.reduce((acc, emp) => acc + emp.currentTrustScore, 0) / employees.length)
      : 100;

    return NextResponse.json({
      totalEmployees,
      activeEmployees,
      isolatedSessions,
      threatsDetected,
      avgTrustScore
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
