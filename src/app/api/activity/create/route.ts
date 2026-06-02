/**
 * POST /api/activity/create
 * ─────────────────────────
 * Real Activity Ingestion API — Module 3.5
 *
 * Accepts a manually submitted employee activity from the Employee Monitor page,
 * routes it through the Trust Intelligence Engine, and persists:
 *   - ActivityLog
 *   - TrustHistory
 *   - Alert (if anomaly threshold exceeded)
 *   - Employee trust score + status update
 *
 * This replaces random simulation as the primary source of activities for
 * normal platform operation. Simulation (/api/simulate) is preserved for Demo Mode.
 *
 * Payload:
 *   { employeeId, action, device?, location?, downloads?, filesAccessed?, sessionDuration?, loginHour? }
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ingestEmployeeActivity } from '@/services/activityIngestionService';
import { successResponse, errorResponse } from '@/lib/apiHandler';

// ─── POST /api/activity/create ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    // ── Validate required fields ──────────────────────────────────────────
    if (!body.employeeId) {
      return errorResponse('employeeId is required', 400);
    }
    if (!body.action || typeof body.action !== 'string' || !body.action.trim()) {
      return errorResponse('action is required and must be a non-empty string', 400);
    }

    // ── Sanitize numeric fields ───────────────────────────────────────────
    const payload = {
      employeeId:      String(body.employeeId),
      action:          String(body.action).trim(),
      device:          body.device     ? String(body.device).trim()     : undefined,
      location:        body.location   ? String(body.location).trim()   : undefined,
      downloads:       body.downloads     !== undefined ? Number(body.downloads)      : undefined,
      filesAccessed:   body.filesAccessed !== undefined ? Number(body.filesAccessed)  : undefined,
      sessionDuration: body.sessionDuration !== undefined ? Number(body.sessionDuration) : undefined,
      loginHour:       body.loginHour     !== undefined ? Number(body.loginHour)      : undefined,
    };

    // ── Validate numeric ranges ───────────────────────────────────────────
    if (payload.loginHour !== undefined && (payload.loginHour < 0 || payload.loginHour > 23)) {
      return errorResponse('loginHour must be between 0 and 23', 400);
    }
    if (payload.downloads !== undefined && payload.downloads < 0) {
      return errorResponse('downloads cannot be negative', 400);
    }
    if (payload.filesAccessed !== undefined && payload.filesAccessed < 0) {
      return errorResponse('filesAccessed cannot be negative', 400);
    }
    if (payload.sessionDuration !== undefined && payload.sessionDuration < 0) {
      return errorResponse('sessionDuration cannot be negative', 400);
    }

    // ── Delegate to ingestion service → Trust Engine → persistence ────────
    const result = await ingestEmployeeActivity(payload);

    return successResponse(result, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to ingest activity';
    console.error('[POST /api/activity/create]', message);

    if (message.includes('not found')) {
      return errorResponse(message, 404);
    }
    return errorResponse(message);
  }
}
