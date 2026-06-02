import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Notification } from '@/models/Notification';
import { successResponse, errorResponse } from '@/lib/apiHandler';

// GET /api/employee/notifications?employeeId=...
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');

    // Retrieve notifications (broadcast + user-specific)
    const query = employeeId
      ? { $or: [{ employeeId }, { employeeId: null }] }
      : { employeeId: null };

    let notifications = await Notification.find(query).sort({ timestamp: -1 });

    // Seed default notifications if none exist
    if (notifications.length === 0) {
      const defaultNotifications = [
        {
          title: 'Required Security Compliance Briefing',
          message: 'All employees must complete the quarterly security training by the end of this month.',
          type: 'security',
          timestamp: new Date(Date.now() - 3600000 * 2), // 2 hours ago
        },
        {
          title: 'Active Directory Password Expiry Notice',
          message: 'Your system access password is scheduled to expire in 8 days. Please update it using the self-service reset portal.',
          type: 'reminder',
          timestamp: new Date(Date.now() - 3600000 * 24), // 1 day ago
          employeeId: employeeId || undefined,
        },
        {
          title: 'Scheduled Workstation Maintenance Window',
          message: 'Enterprise desktop updates will be pushed tonight between 02:00 AM and 04:00 AM. Leave laptops plugged in and connected to VPN.',
          type: 'maintenance',
          timestamp: new Date(Date.now() - 3600000 * 5), // 5 hours ago
        },
        {
          title: 'Annual Company Announcement',
          message: 'Welcome to the new fiscal year! Review the shared CEO memo in the general company drive for our updated growth strategy and OKRs.',
          type: 'announcement',
          timestamp: new Date(Date.now() - 3600000 * 48), // 2 days ago
        },
      ];
      notifications = await Notification.insertMany(defaultNotifications);
      
      // Sort again by timestamp descending
      notifications.sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    return successResponse(notifications);
  } catch (error: any) {
    console.error('[GET /api/employee/notifications]', error.message);
    return errorResponse(error.message || 'Failed to retrieve notifications');
  }
}
