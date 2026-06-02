import type { IAlert, AlertStatus } from '@/types';
import { ALERT_STATUSES } from '@/constants/alertStatus';

// ─── Alert Lifecycle Update Helper ────────────────────────────────────────────

export interface AlertUpdateOptions {
  /** Optional analyst note to attach (for Resolved / FalsePositive) */
  note?: string;
}

export interface AlertUpdateResult {
  success: boolean;
  updated: IAlert | null;
  error?: string;
}

/**
 * updateAlertStatus — Centralized PATCH wrapper for alert lifecycle transitions.
 *
 * Sends the correct backend-compatible status string to /api/alerts/[id].
 * Returns the updated alert on success, or an error message on failure.
 * Never throws — all errors are captured and returned in the result object.
 *
 * Status values sent to backend:
 *   Open | Investigating | Resolved | Escalated | FalsePositive | Isolated
 *
 * @example
 *   const result = await updateAlertStatus(alert._id, 'Resolved', { note: 'Analyst confirmed' });
 *   if (result.success) { ... }
 */
export async function updateAlertStatus(
  alertId: string,
  status: AlertStatus,
  options: AlertUpdateOptions = {}
): Promise<AlertUpdateResult> {
  try {
    const payload: { status: AlertStatus; note?: string } = { status };
    if (options.note !== undefined) {
      payload.note = options.note;
    }

    console.log('Updating alert:', alertId, status);

    const response = await fetch(`/api/alerts/${alertId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.error || 'Failed to update alert');
    }

    return { success: true, updated: json.data as IAlert };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to update alert status';
    console.error(`[alertLifecycle] updateAlertStatus(${alertId}, ${status})`, message);
    return { success: false, updated: null, error: message };
  }
}

/**
 * isTerminalStatus — Returns true if the given status represents a closed/resolved alert.
 * Used to decide whether to auto-close the investigation panel.
 */
export function isTerminalStatus(status: AlertStatus): boolean {
  return (
    status === ALERT_STATUSES.RESOLVED ||
    status === ALERT_STATUSES.FALSE_POSITIVE
  );
}

/**
 * requiresNote — Returns true if the action should prompt for an analyst note.
 */
export function requiresNote(status: AlertStatus): boolean {
  return (
    status === ALERT_STATUSES.RESOLVED ||
    status === ALERT_STATUSES.FALSE_POSITIVE
  );
}
