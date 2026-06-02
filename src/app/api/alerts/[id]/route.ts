import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Alert } from '@/models/Alert';
import { successResponse, errorResponse } from '@/lib/apiHandler';
import type { AlertStatus } from '@/types';

// ─── GET /api/alerts/[id] ─────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const alert = await Alert.findById(id).populate(
      'employeeId',
      'name email department currentTrustScore status'
    );
    if (!alert) return errorResponse('Alert not found', 404);

    return successResponse(alert);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch alert';
    console.error('[/api/alerts/[id] GET]', message);
    return errorResponse(message);
  }
}

// ─── PATCH /api/alerts/[id] ───────────────────────────────────────────────────
// Used for all lifecycle transitions: investigate, resolve, escalate, dismiss, false-positive

const VALID_STATUSES: AlertStatus[] = [
  'Open',
  'Investigating',
  'Resolved',
  'Isolated',
  'Escalated',
  'FalsePositive',
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const body = await req.json();
    const { status, note } = body as { status?: AlertStatus; note?: string };

    if (!status || !VALID_STATUSES.includes(status)) {
      return errorResponse(
        `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        400
      );
    }

    const updateFields: Record<string, unknown> = { status };

    // Record resolution timestamp and optional analyst note
    if (status === 'Resolved' || status === 'FalsePositive') {
      updateFields.resolvedAt = new Date();
    }
    if (note !== undefined) {
      updateFields.resolvedNote = String(note).trim();
    }

    const updated = await Alert.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('employeeId', 'name email department');

    if (!updated) return errorResponse('Alert not found', 404);

    return successResponse(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update alert';
    console.error('[/api/alerts/[id] PATCH]', message);
    return errorResponse(message);
  }
}
