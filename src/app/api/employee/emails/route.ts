import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Email } from '@/models/Email';
import { Employee } from '@/models/Employee';
import { ingestEmployeeActivity } from '@/services/activityIngestionService';
import { successResponse, errorResponse } from '@/lib/apiHandler';

// GET /api/employee/emails?employeeId=...
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return errorResponse('employeeId query parameter is required', 400);
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return errorResponse('Employee not found', 404);
    }

    // Inbox: emails received by this employee's email
    // Sent: emails sent by this employee
    const [inbox, sent] = await Promise.all([
      Email.find({ recipientEmail: employee.email.toLowerCase() }).sort({ timestamp: -1 }),
      Email.find({ senderId: employeeId }).sort({ timestamp: -1 }),
    ]);

    return successResponse({ inbox, sent });
  } catch (error: any) {
    console.error('[GET /api/employee/emails]', error.message);
    return errorResponse(error.message || 'Failed to retrieve emails');
  }
}

// POST /api/employee/emails
// Payload: { employeeId, recipientEmail, subject, message, device?, location?, loginHour? }
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const { employeeId, recipientEmail, subject, message, device, location, loginHour } = body;

    if (!employeeId || !recipientEmail || !subject || !message) {
      return errorResponse('Missing required fields (employeeId, recipientEmail, subject, message)', 400);
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return errorResponse('Sender employee not found', 404);
    }

    // 1. Create the email record
    const newEmail = await Email.create({
      senderId: employeeId,
      senderEmail: employee.email,
      recipientEmail: recipientEmail.toLowerCase().trim(),
      subject,
      message,
      timestamp: new Date(),
    });

    // 2. Trigger Trust Engine activity ingestion for "Email Sent"
    const userAgent = req.headers.get('user-agent') || 'Browser Client';
    const finalDevice = device || userAgent;

    const activityResult = await ingestEmployeeActivity({
      employeeId,
      action: 'Email Sent',
      device: finalDevice,
      location: location || 'Office',
      loginHour: loginHour !== undefined ? Number(loginHour) : new Date().getHours(),
    });

    return successResponse({ email: newEmail, assessment: activityResult }, 201);
  } catch (error: any) {
    console.error('[POST /api/employee/emails]', error.message);
    return errorResponse(error.message || 'Failed to send email');
  }
}
