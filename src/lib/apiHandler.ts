import { NextResponse } from 'next/server';
import type { APIResponse } from '@/types';

// ─── Centralized API Handler ──────────────────────────────────────────────────

/**
 * Wraps an async API handler with standardized try/catch.
 * All routes return { success: true, data } or { success: false, error }.
 *
 * Usage:
 *   export const GET = apiHandler(async (req) => {
 *     const data = await ...;
 *     return data;
 *   });
 */
export function apiHandler<T>(
  fn: (...args: any[]) => Promise<T>
): (...args: any[]) => Promise<NextResponse<APIResponse<T>>> {
  return async (...args: any[]) => {
    try {
      const result = await fn(...args);
      return NextResponse.json({ success: true, data: result } as APIResponse<T>);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred';

      // Production-safe: only log the error server-side, never expose stack traces
      console.error('[API Error]', message);

      return NextResponse.json(
        { success: false, error: message } satisfies APIResponse<T>,
        { status: 500 }
      );
    }
  };
}

/**
 * Creates a standardized success response.
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data } as APIResponse<T>, { status });
}

/**
 * Creates a standardized error response.
 */
export function errorResponse(message: string, status = 500) {
  return NextResponse.json({ success: false, error: message } as APIResponse, { status });
}
