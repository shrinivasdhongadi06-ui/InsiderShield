import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Alert } from '@/models/Alert';
import { successResponse, errorResponse } from '@/lib/apiHandler';
import type { AlertStatus } from '@/types';

// ─── POST /api/alerts/[id]/action ─────────────────────────────────────────────
// Unified lifecycle action endpoint.
// Body: { action: 'investigate' | 'resolve' | 'escalate' | 'dismiss' | 'falsepositive', note?: string }

const ACTION_TO_STATUS: Record<string, AlertStatus> = {
  investigate: 'Investigating',
  resolve: 'Resolved',
  escalate: 'Escalated',
  dismiss: 'Resolved',       // dismissing = marking resolved without note
  falsepositive: 'FalsePositive',
  isolate: 'Isolated',
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const action = String(body.action ?? '').toLowerCase().trim();
    const note = body.note ? String(body.note).trim() : undefined;

    const newStatus = ACTION_TO_STATUS[action];
    if (!newStatus) {
      return errorResponse(
        `Unknown action "${action}". Valid: ${Object.keys(ACTION_TO_STATUS).join(', ')}`,
        400
      );
    }

    const updateFields: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'Resolved' || newStatus === 'FalsePositive') {
      updateFields.resolvedAt = new Date();
    }
    if (note !== undefined) {
      updateFields.resolvedNote = note;
    }

    const updated = await Alert.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('employeeId', 'name email department');

    if (!updated) return errorResponse('Alert not found', 404);

    return successResponse({
      alert: updated,
      action,
      previousStatus: updated.status,
      newStatus,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Alert action failed';
    console.error('[/api/alerts/[id]/action]', message);
    return errorResponse(message);
  }
}
