import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getDashboardStats } from '@/services/dashboardService';
import { successResponse, errorResponse } from '@/lib/apiHandler';

export async function GET() {
  try {
    await connectDB();
    const data = await getDashboardStats();
    return successResponse(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch dashboard stats';
    console.error('[/api/dashboard/stats]', message);
    return errorResponse(message);
  }
}
