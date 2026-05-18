import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { Employee } from '@/models/Employee';
import { ActivityLog } from '@/models/ActivityLog';
import { Alert } from '@/models/Alert';
import { TrustHistory } from '@/models/TrustHistory';

export async function GET() {
  try {
    await connectDB();

    // Clear existing data
    await Employee.deleteMany({});
    await ActivityLog.deleteMany({});
    await Alert.deleteMany({});
    await TrustHistory.deleteMany({});

    // Seed Employees
    const employees = [
      {
        name: 'Alice Johnson',
        department: 'Engineering',
        role: 'Senior Developer',
        email: 'alice.j@insidershield.local',
        currentTrustScore: 98,
        status: 'Active',
        baseline: {
          usualLoginHours: ['09:00', '17:00'],
          trustedDevices: ['MacBook Pro 16', 'iPhone 13'],
          usualIPs: ['192.168.1.10', '10.0.0.5'],
        },
      },
      {
        name: 'Bob Smith',
        department: 'Sales',
        role: 'Account Executive',
        email: 'bob.s@insidershield.local',
        currentTrustScore: 95,
        status: 'Active',
        baseline: {
          usualLoginHours: ['08:30', '18:00'],
          trustedDevices: ['Dell XPS 15', 'iPad Pro'],
          usualIPs: ['192.168.1.22'],
        },
      },
      {
        name: 'Charlie Davis',
        department: 'Finance',
        role: 'Financial Analyst',
        email: 'charlie.d@insidershield.local',
        currentTrustScore: 82,
        status: 'Active',
        baseline: {
          usualLoginHours: ['09:00', '17:00'],
          trustedDevices: ['ThinkPad X1'],
          usualIPs: ['10.0.0.8'],
        },
      },
      {
        name: 'Diana Prince',
        department: 'HR',
        role: 'HR Manager',
        email: 'diana.p@insidershield.local',
        currentTrustScore: 45,
        status: 'Isolated',
        baseline: {
          usualLoginHours: ['09:00', '17:00'],
          trustedDevices: ['MacBook Air'],
          usualIPs: ['192.168.1.50'],
        },
      },
    ];

    const createdEmployees = await Employee.insertMany(employees);

    // Initial Trust History
    for (const emp of createdEmployees) {
      await TrustHistory.create({
        employeeId: emp._id,
        score: emp.currentTrustScore,
        changeReason: 'Initial baseline established',
      });
    }

    // Seed some initial alerts for the isolated user
    const diana = createdEmployees.find(e => e.name === 'Diana Prince');
    if (diana) {
      await Alert.create({
        employeeId: diana._id,
        severity: 'Critical',
        title: 'Mass Data Export Detected',
        description: 'User downloaded 50GB of confidential HR records outside of normal working hours.',
        reasoning: [
          'Unusual login time (02:14 AM)',
          'Unknown device detected (Windows PC - Unknown Location)',
          'Abnormal download spike (50GB+ in 10 mins)',
        ],
        status: 'Investigating',
      });
      
      await ActivityLog.create({
        employeeId: diana._id,
        action: 'File Download',
        details: 'Downloaded payroll_2025.zip (50GB)',
        device: 'Windows PC',
        ipAddress: '203.0.113.45',
        riskScore: -40,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      });
    }

    // Normal activity for Alice
    const alice = createdEmployees.find(e => e.name === 'Alice Johnson');
    if (alice) {
      await ActivityLog.create({
        employeeId: alice._id,
        action: 'Login',
        details: 'Successful login from trusted device',
        device: 'MacBook Pro 16',
        ipAddress: '192.168.1.10',
        riskScore: 2,
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
      });
    }

    return NextResponse.json({ message: 'Database seeded successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
