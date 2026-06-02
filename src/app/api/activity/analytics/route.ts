import { connectDB } from '@/lib/mongodb';
import { getActivityAnalytics } from '@/services/activityService';
import { successResponse, errorResponse } from '@/lib/apiHandler';

export async function GET() {
  try {
    await connectDB();
    const data = await getActivityAnalytics();
    return successResponse(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch analytics';
    console.error('[/api/activity/analytics]', message);
    return errorResponse(message);
  }
}
