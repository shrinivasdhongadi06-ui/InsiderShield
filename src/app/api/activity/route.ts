import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ActivityLog } from '@/models/ActivityLog';
import { successResponse, errorResponse } from '@/lib/apiHandler';
import {
  parsePagination,
  buildPaginationMeta,
  parseSort,
  parseDateRange,
  buildSearchRegex,
  buildEmployeeIdFilter,
} from '@/lib/queryUtils';

// ─── GET /api/activity ────────────────────────────────────────────────────────
// Supports: filter, search, employeeId, startDate, endDate, page, pageSize, sortBy, sortOrder

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter');     // normal | suspicious | critical
    const search = searchParams.get('search');
    const employeeId = searchParams.get('employeeId');

    // Build query
    const query: Record<string, unknown> = {};

    // Risk level filter
    if (filter === 'suspicious') {
      query.anomalyScore = { $gte: 30, $lt: 70 };
    } else if (filter === 'critical') {
      query.anomalyScore = { $gte: 70 };
    } else if (filter === 'normal') {
      query.anomalyScore = { $lt: 30 };
    }

    // Employee filter
    const empFilter = buildEmployeeIdFilter(employeeId);
    Object.assign(query, empFilter);

    // Date range filter
    const dateFilter = parseDateRange(searchParams);
    Object.assign(query, dateFilter);

    // Pagination + Sort
    const pagination = parsePagination(searchParams);
    const sort = parseSort(searchParams, 'timestamp', 'desc');

    // Count total (before populate, for accuracy)
    const total = await ActivityLog.countDocuments(query);

    // Fetch paginated results
    let logs = await ActivityLog.find(query)
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.pageSize)
      .populate('employeeId', 'name department email');

    // Post-populate search filter (applied after join so we can match employee name/device/location)
    if (search) {
      const s = search.toLowerCase();
      logs = logs.filter((l: any) => {
        const empName = l.employeeId?.name?.toLowerCase() ?? '';
        const device = (l.device ?? '').toLowerCase();
        const location = (l.location ?? '').toLowerCase();
        const action = (l.action ?? '').toLowerCase();
        return (
          empName.includes(s) ||
          device.includes(s) ||
          location.includes(s) ||
          action.includes(s)
        );
      });
    }

    const paginationMeta = buildPaginationMeta(total, pagination);

    return successResponse({ items: logs, pagination: paginationMeta });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch activity logs';
    console.error('[/api/activity]', message);
    return errorResponse(message);
  }
}
