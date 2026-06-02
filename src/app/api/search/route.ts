import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Employee } from '@/models/Employee';
import { Alert } from '@/models/Alert';
import { successResponse, errorResponse } from '@/lib/apiHandler';
import { QUERY_LIMITS } from '@/constants';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      return successResponse({ employees: [], alerts: [] });
    }

    const regex = new RegExp(q, 'i');

    const [employees, alerts] = await Promise.all([
      Employee.find({
        $or: [{ name: regex }, { department: regex }, { role: regex }, { email: regex }],
      })
        .select('name email department role currentTrustScore status')
        .limit(QUERY_LIMITS.SEARCH_EMPLOYEES)
        .lean(),

      Alert.find({ $or: [{ title: regex }, { description: regex }] })
        .select('title severity status timestamp employeeId')
        .populate('employeeId', 'name')
        .sort({ timestamp: -1 })
        .limit(QUERY_LIMITS.SEARCH_ALERTS)
        .lean(),
    ]);

    return successResponse({ employees, alerts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Search failed';
    console.error('[/api/search]', message);
    return errorResponse(message);
  }
}
