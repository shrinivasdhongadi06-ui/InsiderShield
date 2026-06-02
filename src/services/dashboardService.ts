import { Employee } from '@/models/Employee';
import { ActivityLog } from '@/models/ActivityLog';
import { Alert } from '@/models/Alert';
import { TrustHistory } from '@/models/TrustHistory';
import type { IDashboardStats } from '@/types';
import { clampTrustScore } from '@/utils';

// ─── Dashboard Stats Service ──────────────────────────────────────────────────

/**
 * Fetches all KPI stats for the dashboard.
 */
export async function getDashboardStats(): Promise<IDashboardStats> {
  const [
    totalEmployees,
    activeEmployees,
    isolatedSessions,
    threatsDetected,
    employees,
  ] = await Promise.all([
    Employee.countDocuments(),
    Employee.countDocuments({ status: 'Active' }),
    Employee.countDocuments({ status: 'Isolated' }),
    Alert.countDocuments({ status: { $in: ['Open', 'Investigating'] } }),
    Employee.find({}, 'currentTrustScore').lean(),
  ]);

  const avgTrustScore = employees.length
    ? Math.round(
        employees.reduce((acc, emp) => acc + (emp.currentTrustScore ?? 0), 0) /
          employees.length
      )
    : 100;

  return {
    totalEmployees,
    activeEmployees,
    isolatedSessions,
    threatsDetected,
    avgTrustScore,
  };
}

// ─── Trust Score Service ──────────────────────────────────────────────────────

/**
 * Applies a trust impact delta to an employee and persists changes.
 * Also records a TrustHistory entry.
 */
export async function applyTrustImpact(
  employee: any,
  trustImpact: number,
  changeReason: string
): Promise<{ newScore: number; newStatus: string }> {
  const newScore = clampTrustScore(employee.currentTrustScore + trustImpact);
  const newStatus =
    newScore < 50 && employee.status !== 'Suspended' ? 'Isolated' : employee.status;

  employee.currentTrustScore = newScore;
  employee.status = newStatus;
  await employee.save();

  await TrustHistory.create({
    employeeId: employee._id,
    score: newScore,
    changeReason,
  });

  return { newScore, newStatus };
}
