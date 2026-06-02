import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Employee } from '@/models/Employee';
import { createEmployee } from '@/services/employeeService';
import { successResponse, errorResponse } from '@/lib/apiHandler';
import {
  parsePagination,
  buildPaginationMeta,
  parseSort,
  buildSearchRegex,
} from '@/lib/queryUtils';

// ─── GET /api/employees ───────────────────────────────────────────────────────
// Supports: search, department, status, page, pageSize, sortBy, sortOrder

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const department = searchParams.get('department');
    const status = searchParams.get('status');

    // Build query
    const query: Record<string, unknown> = {};

    if (search) {
      const regex = buildSearchRegex(search);
      query.$or = [
        { name: regex },
        { role: regex },
        { email: regex },
        { department: regex },
      ];
    }

    if (department) query.department = department;
    if (status) query.status = status;

    // Pagination + Sort
    const pagination = parsePagination(searchParams);
    const sort = parseSort(searchParams, 'currentTrustScore', 'asc');

    const [total, employees] = await Promise.all([
      Employee.countDocuments(query),
      Employee.find(query)
        .sort(sort)
        .skip(pagination.skip)
        .limit(pagination.pageSize),
    ]);

    const paginationMeta = buildPaginationMeta(total, pagination);

    return successResponse({ items: employees, pagination: paginationMeta });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch employees';
    console.error('[/api/employees GET]', message);
    return errorResponse(message);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.name || !body.department || !body.role) {
      return errorResponse('Name, department and role are required.', 400);
    }

    const newEmployee = await createEmployee(body);
    return successResponse(newEmployee, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create employee';
    console.error('[/api/employees POST]', message);
    return errorResponse(message);
  }
}
