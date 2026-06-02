import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ActivityLog } from '@/models/ActivityLog';
import { successResponse, errorResponse } from '@/lib/apiHandler';

// GET /api/employee/stats?employeeId=...
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return errorResponse('employeeId query parameter is required', 400);
    }

    const [uploaded, downloaded, emails, meetings] = await Promise.all([
      ActivityLog.countDocuments({ employeeId, action: 'Upload File' }),
      ActivityLog.countDocuments({ employeeId, action: 'Download File' }),
      ActivityLog.countDocuments({ employeeId, action: 'Email Sent' }),
      ActivityLog.countDocuments({ employeeId, action: 'Join Meeting' }),
    ]);

    return successResponse({
      filesUploaded: uploaded,
      filesDownloaded: downloaded,
      emailsSent: emails,
      meetingsJoined: meetings
    });
  } catch (error: any) {
    console.error('[GET /api/employee/stats]', error.message);
    return errorResponse(error.message || 'Failed to retrieve stats');
  }
}
