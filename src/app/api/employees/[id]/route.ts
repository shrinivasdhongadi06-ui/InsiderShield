import { connectDB } from '@/lib/mongodb';
import { Employee } from '@/models/Employee';
import { ActivityLog } from '@/models/ActivityLog';
import { Alert } from '@/models/Alert';
import { TrustHistory } from '@/models/TrustHistory';
import { successResponse, errorResponse } from '@/lib/apiHandler';
import { QUERY_LIMITS } from '@/constants';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return errorResponse('Employee not found', 404);
    }

    const [logs, alerts, trustHistory] = await Promise.all([
      ActivityLog.find({ employeeId: id }).sort({ timestamp: -1 }).limit(QUERY_LIMITS.EMPLOYEE_LOGS),
      Alert.find({ employeeId: id }).sort({ timestamp: -1 }).limit(QUERY_LIMITS.EMPLOYEE_ALERTS),
      TrustHistory.find({ employeeId: id }).sort({ timestamp: 1 }).limit(QUERY_LIMITS.TRUST_HISTORY),
    ]);

    return successResponse({ employee, logs, alerts, trustHistory });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch employee';
    console.error('[/api/employees/[id]]', message);
    return errorResponse(message);
  }
}
