import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { Employee } from '@/models/Employee';
import { TrustHistory } from '@/models/TrustHistory';

export async function GET() {
  try {
    await connectDB();
    const employees = await Employee.find({}).sort({ currentTrustScore: 1 });
    return NextResponse.json(employees);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.name || !body.department || !body.role) {
      return NextResponse.json({ error: 'Name, department and role are required.' }, { status: 400 });
    }

    const email = body.email?.trim() ||
      `${body.name.toLowerCase().replace(/\s+/g, '.')}@insidershield.local`;

    const trustedDevices = body.trustedDevices
      ? body.trustedDevices.split(',').map((d: string) => d.trim()).filter(Boolean)
      : ['Corporate Laptop'];

    const usualIPs = body.usualIPs
      ? body.usualIPs.split(',').map((ip: string) => ip.trim()).filter(Boolean)
      : ['192.168.1.100'];

    const newEmployee = await Employee.create({
      name: body.name.trim(),
      department: body.department.trim(),
      role: body.role.trim(),
      email,
      currentTrustScore: 100,
      status: 'Active',
      baseline: {
        normalLoginHourRange: body.normalLoginHourRange?.trim() || '09:00-17:00',
        trustedDevices,
        normalLocation: body.normalLocation?.trim() || 'Office',
        normalDownloads: Number(body.normalDownloads) || 5,
        normalFilesAccessed: Number(body.normalFilesAccessed) || 20,
        normalSessionDuration: Number(body.normalSessionDuration) || 480,
        usualIPs,
      },
    });

    await TrustHistory.create({
      employeeId: newEmployee._id,
      score: 100,
      changeReason: 'Employee profile initialized',
    });

    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
