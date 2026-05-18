import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { Employee } from '@/models/Employee';
import { ActivityLog } from '@/models/ActivityLog';
import { Alert } from '@/models/Alert';
import { TrustHistory } from '@/models/TrustHistory';

const NORMAL_ACTIONS = ['Login', 'Read Document', 'Email Sent', 'Meeting Joined'];
const SUSPICIOUS_ACTIONS = ['Bulk Download', 'Access Denied', 'Login outside hours', 'Unknown Device Access'];

export async function POST() {
  try {
    await connectDB();
    
    // Pick a random active employee
    const activeEmployees = await Employee.find({ status: 'Active' });
    if (activeEmployees.length === 0) {
      return NextResponse.json({ message: 'No active employees to simulate.' });
    }
    
    const employee = activeEmployees[Math.floor(Math.random() * activeEmployees.length)];
    
    // 80% chance of normal action, 20% suspicious
    const isSuspicious = Math.random() < 0.2;
    
    let action = '';
    let riskScore = 0;
    let details = '';
    let device = employee.baseline.trustedDevices[0] || 'Unknown Device';
    
    if (isSuspicious) {
      action = SUSPICIOUS_ACTIONS[Math.floor(Math.random() * SUSPICIOUS_ACTIONS.length)];
      riskScore = - (Math.floor(Math.random() * 15) + 5); // -5 to -20
      
      if (action === 'Unknown Device Access') device = 'Unregistered Device';
      details = `Suspicious behavior detected: ${action}`;
    } else {
      action = NORMAL_ACTIONS[Math.floor(Math.random() * NORMAL_ACTIONS.length)];
      riskScore = Math.floor(Math.random() * 3) + 1; // +1 to +3
      details = `Normal activity: ${action}`;
    }
    
    // Create Activity Log
    await ActivityLog.create({
      employeeId: employee._id,
      action,
      details,
      device,
      ipAddress: employee.baseline.usualIPs[0] || '192.168.1.1',
      riskScore,
    });
    
    // Update Trust Score
    let newScore = employee.currentTrustScore + riskScore;
    if (newScore > 100) newScore = 100;
    
    // If score drops below threshold, trigger alert and isolation
    let newStatus = employee.status;
    let alertCreated = false;
    
    if (newScore < 50 && employee.status === 'Active') {
      newStatus = 'Isolated';
      alertCreated = true;
      
      await Alert.create({
        employeeId: employee._id,
        severity: newScore < 30 ? 'Critical' : 'High',
        title: 'Trust Score Dropped Below Threshold',
        description: `System automatically isolated user due to repeated suspicious activities resulting in a low trust score (${newScore}).`,
        reasoning: [
          `Recent ${action} triggered risk reduction`,
          'Historical behavioral deviation detected',
        ],
        status: 'Open',
      });
    }
    
    employee.currentTrustScore = newScore;
    employee.status = newStatus;
    await employee.save();
    
    await TrustHistory.create({
      employeeId: employee._id,
      score: newScore,
      changeReason: action,
    });
    
    return NextResponse.json({ 
      message: 'Simulation step completed.',
      employee: employee.name,
      action,
      newScore,
      alertCreated
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
