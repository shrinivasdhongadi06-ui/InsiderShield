import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { UploadedFile } from '@/models/UploadedFile';
import { ingestEmployeeActivity } from '@/services/activityIngestionService';
import { successResponse, errorResponse } from '@/lib/apiHandler';

// GET /api/employee/files?employeeId=...
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return errorResponse('employeeId query parameter is required', 400);
    }

    const files = await UploadedFile.find({ employeeId }).sort({ uploadedAt: -1 });
    return successResponse(files);
  } catch (error: any) {
    console.error('[GET /api/employee/files]', error.message);
    return errorResponse(error.message || 'Failed to retrieve files');
  }
}

// POST /api/employee/files
// Payload: { employeeId, name, size, mimeType, content, device?, location?, loginHour? }
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const { employeeId, name, size, mimeType, content, device, location, loginHour } = body;

    if (!employeeId || !name || size === undefined || !mimeType) {
      return errorResponse('Missing required fields (employeeId, name, size, mimeType)', 400);
    }

    // 1. Store the uploaded file in the database
    const newFile = await UploadedFile.create({
      employeeId,
      name,
      size,
      mimeType,
      content: content || '',
      uploadedAt: new Date(),
    });

    // 2. Trigger Trust Engine activity ingestion for "Upload File"
    // Capture user agent or fallback to payload device
    const userAgent = req.headers.get('user-agent') || 'Browser Client';
    const finalDevice = device || userAgent;

    const activityResult = await ingestEmployeeActivity({
      employeeId,
      action: 'Upload File',
      device: finalDevice,
      location: location || 'Office',
      filesAccessed: 1,
      loginHour: loginHour !== undefined ? Number(loginHour) : new Date().getHours(),
    });

    return successResponse({ file: newFile, assessment: activityResult }, 201);
  } catch (error: any) {
    console.error('[POST /api/employee/files]', error.message);
    return errorResponse(error.message || 'Failed to upload file');
  }
}
