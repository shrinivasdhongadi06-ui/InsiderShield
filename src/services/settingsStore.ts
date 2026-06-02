/**
 * Trust Engine Settings Store
 * ────────────────────────────
 * Lightweight client-side settings persistence using localStorage.
 * Provides read/write access to the thresholds that the Trust Engine uses.
 *
 * This intentionally has NO external dependencies — no Redux, no Zustand.
 * Works with the existing Next.js + TypeScript stack only.
 *
 * Server-side calls can use getServerSettings() which returns the defaults
 * (server runtime reads from a shared in-memory cache set via POST /api/settings).
 */

import type { TrustEngineSettings } from '@/services/trustEngine';
import { DEFAULT_THRESHOLDS } from '@/constants/trustRules';

export interface PlatformSettings extends TrustEngineSettings {
  sensitivity:         'Conservative' | 'Balanced' | 'Aggressive';
  autoIsolate:         boolean;
  isolationThreshold:  number;
  criticalThreshold:   number;
  highThreshold:       number;
  // Monitoring toggles
  monitorLogin:        boolean;
  monitorDevice:       boolean;
  monitorDownloads:    boolean;
  monitorSession:      boolean;
  monitorLocation:     boolean;
  monitorFiles:        boolean;
  // Notification
  dashboardAlerts:     boolean;
  socEscalation:       boolean;
  autoEscalation:      boolean;
  // Trust decay sensitivity (0–100 raw slider, maps to multipliers)
  trustDecaySensitivity: number;
}

const STORAGE_KEY = 'insidershield_settings';

export const DEFAULT_SETTINGS: PlatformSettings = {
  sensitivity:          'Balanced',
  autoIsolate:          true,
  isolationThreshold:   DEFAULT_THRESHOLDS.ISOLATION,
  criticalThreshold:    DEFAULT_THRESHOLDS.CRITICAL_ANOMALY,
  highThreshold:        DEFAULT_THRESHOLDS.HIGH_ANOMALY,
  monitorLogin:         true,
  monitorDevice:        true,
  monitorDownloads:     true,
  monitorSession:       true,
  monitorLocation:      true,
  monitorFiles:         true,
  dashboardAlerts:      true,
  socEscalation:        true,
  autoEscalation:       false,
  trustDecaySensitivity: 50,
};

/** Read settings from localStorage (client-only). Falls back to defaults. */
export function loadSettings(): PlatformSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as PlatformSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Persist settings to localStorage (client-only). */
export function saveSettings(settings: Partial<PlatformSettings>): PlatformSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const merged = { ...loadSettings(), ...settings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    // Propagate to server cache via POST (fire-and-forget)
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged),
    }).catch(() => {/* silently ignore */});
  } catch {/* ignore write failures */}
  return merged;
}

/**
 * Extract the TrustEngineSettings subset from full PlatformSettings.
 * Pass the result directly to evaluateTrust().
 */
export function toEngineSettings(settings: PlatformSettings): TrustEngineSettings {
  return {
    sensitivity:        settings.sensitivity,
    autoIsolate:        settings.autoIsolate,
    isolationThreshold: settings.isolationThreshold,
    criticalThreshold:  settings.criticalThreshold,
    highThreshold:      settings.highThreshold,
  };
}
