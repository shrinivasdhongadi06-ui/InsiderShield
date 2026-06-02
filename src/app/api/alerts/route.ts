import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Alert } from '@/models/Alert';
import { successResponse, errorResponse } from '@/lib/apiHandler';
import {
  parsePagination,
  buildPaginationMeta,
  parseSort,
  buildEmployeeIdFilter,
} from '@/lib/queryUtils';

// ─── GET /api/alerts ──────────────────────────────────────────────────────────
// Supports: severity, status, employeeId, page, pageSize, sortBy, sortOrder

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');

    // Build query
    const query: Record<string, unknown> = {};
    if (severity) query.severity = severity;
    if (status) query.status = status;

    const empFilter = buildEmployeeIdFilter(employeeId);
    Object.assign(query, empFilter);

    // Pagination + Sort
    const pagination = parsePagination(searchParams);
    const sort = parseSort(searchParams, 'timestamp', 'desc');

    const [total, alerts] = await Promise.all([
      Alert.countDocuments(query),
      Alert.find(query)
        .sort(sort)
        .skip(pagination.skip)
        .limit(pagination.pageSize)
        .populate('employeeId', 'name email department currentTrustScore'),
    ]);

    const paginationMeta = buildPaginationMeta(total, pagination);

    return successResponse({ items: alerts, pagination: paginationMeta });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch alerts';
    console.error('[/api/alerts]', message);
    return errorResponse(message);
  }
}
