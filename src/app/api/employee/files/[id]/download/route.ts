import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { UploadedFile } from '@/models/UploadedFile';
import { ingestEmployeeActivity } from '@/services/activityIngestionService';
import { successResponse, errorResponse } from '@/lib/apiHandler';

// GET /api/employee/files/[id]/download?employeeId=...
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');
    const location = searchParams.get('location') || 'Office';

    if (!employeeId) {
      return errorResponse('employeeId query parameter is required', 400);
    }

    const file = await UploadedFile.findById(id);
    if (!file) {
      return errorResponse('File not found', 404);
    }

    // Trigger Trust Engine activity ingestion for "Download File"
    const userAgent = req.headers.get('user-agent') || 'Browser Client';
    
    const activityResult = await ingestEmployeeActivity({
      employeeId,
      action: 'Download File',
      device: userAgent,
      location,
      downloads: 1,
      loginHour: new Date().getHours(),
    });

    return successResponse({
      file,
      assessment: activityResult
    });
  } catch (error: any) {
    console.error('[GET /api/employee/files/[id]/download]', error.message);
    return errorResponse(error.message || 'Failed to download file');
  }
}
