import type { SortOrder, IPaginationMeta } from '@/types';

// ─── Pagination ───────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface ParsedPagination {
  page: number;
  pageSize: number;
  skip: number;
}

/**
 * Parses and validates pagination query params.
 */
export function parsePagination(params: URLSearchParams): ParsedPagination {
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(params.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

/**
 * Builds IPaginationMeta from total count and pagination params.
 */
export function buildPaginationMeta(
  total: number,
  { page, pageSize }: ParsedPagination
): IPaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// ─── Sorting ──────────────────────────────────────────────────────────────────

export interface ParsedSort {
  field: string;
  order: 1 | -1;
}

const SORT_ORDER_MAP: Record<string, 1 | -1> = { asc: 1, desc: -1 };

/**
 * Parses sortBy/sortOrder from URL params, with fallback defaults.
 */
export function parseSort(
  params: URLSearchParams,
  defaultField = 'timestamp',
  defaultOrder: SortOrder = 'desc'
): Record<string, 1 | -1> {
  const field = params.get('sortBy') ?? defaultField;
  const rawOrder = (params.get('sortOrder') ?? defaultOrder) as SortOrder;
  const order = SORT_ORDER_MAP[rawOrder] ?? -1;
  return { [field]: order };
}

// ─── Date Range Filtering ─────────────────────────────────────────────────────

/**
 * Builds a MongoDB $gte/$lte date filter from startDate/endDate query params.
 * Returns empty object if no dates provided.
 */
export function parseDateRange(params: URLSearchParams): Record<string, unknown> {
  const startDate = params.get('startDate');
  const endDate = params.get('endDate');

  if (!startDate && !endDate) return {};

  const range: Record<string, Date> = {};
  if (startDate) {
    const d = new Date(startDate);
    if (!isNaN(d.getTime())) range.$gte = d;
  }
  if (endDate) {
    const d = new Date(endDate);
    if (!isNaN(d.getTime())) range.$lte = d;
  }
  return Object.keys(range).length ? { timestamp: range } : {};
}

// ─── String Search (regex safe) ───────────────────────────────────────────────

/**
 * Builds a case-insensitive MongoDB regex for a search term.
 * Escapes special characters to prevent regex injection.
 */
export function buildSearchRegex(term: string): RegExp {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped, 'i');
}

// ─── Safe ObjectId Filtering ──────────────────────────────────────────────────

import mongoose from 'mongoose';

/**
 * Returns a valid mongoose ObjectId or null — prevents 500 errors on bad IDs.
 */
export function safeObjectId(id: string | null): mongoose.Types.ObjectId | null {
  if (!id) return null;
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
}

/**
 * Builds query fragment for filtering by employeeId.
 */
export function buildEmployeeIdFilter(employeeId: string | null): Record<string, unknown> {
  const oid = safeObjectId(employeeId);
  return oid ? { employeeId: oid } : {};
}
