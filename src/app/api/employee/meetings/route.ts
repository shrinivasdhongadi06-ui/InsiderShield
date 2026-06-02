import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Meeting } from '@/models/Meeting';
import { MeetingParticipation } from '@/models/MeetingParticipation';
import { ingestEmployeeActivity } from '@/services/activityIngestionService';
import { successResponse, errorResponse } from '@/lib/apiHandler';

// GET /api/employee/meetings
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    let meetings = await Meeting.find({});
    
    // Seed default meetings if none exist
    if (meetings.length === 0) {
      const defaultMeetings = [
        { name: 'Engineering Daily Standup', department: 'Engineering', time: '10:00 AM', date: 'Daily' },
        { name: 'Marketing & Sales Sync', department: 'Marketing', time: '01:30 PM', date: 'Every Tuesday' },
        { name: 'Q2 Strategy & Budget Review', department: 'Finance', time: '03:00 PM', date: 'June 15, 2026' },
        { name: 'Security awareness briefing', department: 'Security', time: '11:00 AM', date: 'Monthly' },
        { name: 'Product Roadmap Planning', department: 'Product', time: '02:00 PM', date: 'Every Thursday' },
      ];
      meetings = await Meeting.insertMany(defaultMeetings);
    }

    return successResponse(meetings);
  } catch (error: any) {
    console.error('[GET /api/employee/meetings]', error.message);
    return errorResponse(error.message || 'Failed to retrieve meetings');
  }
}

// POST /api/employee/meetings
// Payload: { employeeId, meetingId, device?, location?, loginHour? }
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const { employeeId, meetingId, device, location, loginHour } = body;

    if (!employeeId || !meetingId) {
      return errorResponse('Missing required fields (employeeId, meetingId)', 400);
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return errorResponse('Meeting not found', 404);
    }

    // 1. Record meeting participation
    const participation = await MeetingParticipation.create({
      employeeId,
      meetingId,
      joinedAt: new Date(),
    });

    // 2. Trigger Trust Engine activity ingestion for "Join Meeting"
    const userAgent = req.headers.get('user-agent') || 'Browser Client';
    const finalDevice = device || userAgent;

    const activityResult = await ingestEmployeeActivity({
      employeeId,
      action: 'Join Meeting',
      device: finalDevice,
      location: location || 'Office',
      loginHour: loginHour !== undefined ? Number(loginHour) : new Date().getHours(),
    });

    return successResponse({ participation, meeting, assessment: activityResult }, 201);
  } catch (error: any) {
    console.error('[POST /api/employee/meetings]', error.message);
    return errorResponse(error.message || 'Failed to join meeting');
  }
}
