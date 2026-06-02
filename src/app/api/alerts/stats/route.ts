import { connectDB } from '@/lib/mongodb';
import { getThreatStats } from '@/services/alertService';
import { successResponse, errorResponse } from '@/lib/apiHandler';

export async function GET() {
  try {
    await connectDB();
    const data = await getThreatStats();
    return successResponse(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch threat stats';
    console.error('[/api/alerts/stats]', message);
    return errorResponse(message);
  }
}
