/**
 * /api/settings
 *
 * GET  — returns the current server-side settings (default or last saved via POST).
 * POST — updates the server-side in-memory settings cache so that the simulate
 *        endpoint can pick them up on the next simulation run.
 *
 * This is intentionally lightweight — no DB writes needed. Settings only need
 * to survive the process lifecycle for the Trust Engine to consume them.
 */

import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_SETTINGS } from '@/services/settingsStore';
import type { PlatformSettings } from '@/services/settingsStore';

// ─── In-Memory Settings Cache ─────────────────────────────────────────────────
// Server-side singleton. Resets on Next.js server restart.
// This is sufficient for the current architecture (no DB writes needed).

declare global {
  // eslint-disable-next-line no-var
  var __trustEngineSettings: PlatformSettings | undefined;
}

function getServerCache(): PlatformSettings {
  if (!global.__trustEngineSettings) {
    global.__trustEngineSettings = { ...DEFAULT_SETTINGS };
  }
  return global.__trustEngineSettings;
}

// ─── GET /api/settings ────────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({ success: true, data: getServerCache() });
}

// ─── POST /api/settings ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    global.__trustEngineSettings = { ...DEFAULT_SETTINGS, ...body } as PlatformSettings;
    return NextResponse.json({ success: true, data: global.__trustEngineSettings });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid settings payload' }, { status: 400 });
  }
}
