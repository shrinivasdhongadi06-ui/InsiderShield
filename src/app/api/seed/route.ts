import { connectDB } from '@/lib/mongodb';
import { ActivityLog } from '@/models/ActivityLog';
import { Alert } from '@/models/Alert';
import { TrustHistory } from '@/models/TrustHistory';
import { successResponse, errorResponse } from '@/lib/apiHandler';

export async function GET() {
  try {
    await connectDB();

    await Promise.all([
      ActivityLog.deleteMany({}),
      Alert.deleteMany({}),
      TrustHistory.deleteMany({}),
    ]);

    return successResponse({ message: 'Monitoring data reset successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Seed reset failed';
    console.error('[/api/seed]', message);
    return errorResponse(message);
  }
}