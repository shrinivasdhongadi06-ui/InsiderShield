import type { APIResponse } from '@/types';

// ─── Base Config ──────────────────────────────────────────────────────────────

const DEFAULT_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
};

// ─── Core Request Helper ──────────────────────────────────────────────────────

/**
 * Internal fetch wrapper — parses standardized { success, data, error } response.
 * Returns data directly on success, throws typed error on failure.
 * Never crashes the frontend — all network errors return null-safe defaults.
 */
async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...(options.headers ?? {}),
    },
  });

  let json: APIResponse<T>;

  try {
    json = await res.json();
  } catch {
    throw new Error(`[API] Invalid JSON from ${url} (status ${res.status})`);
  }

  if (json.success === false) {
    throw new Error(json.error ?? `Request failed: ${res.status}`);
  }

  if (json.success === true) {
    return json.data as T;
  }

  // Fallback for legacy non-wrapped responses (backward compat)
  return json as unknown as T;
}

// ─── Public API Client Methods ────────────────────────────────────────────────

/**
 * GET request — auto-builds query string from params object.
 *
 * @example
 *   apiClient.get<IAlert[]>('/api/alerts', { severity: 'Critical', page: '1' })
 */
async function get<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  let url = path;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    const str = qs.toString();
    if (str) url = `${path}?${str}`;
  }
  return request<T>(url, { method: 'GET' });
}

/**
 * POST request — sends JSON body.
 */
async function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/**
 * PATCH request — sends partial JSON update.
 */
async function patch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request.
 */
async function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}

// ─── Safe Variants (never throw, return null on failure) ──────────────────────

/**
 * Safe GET — returns null instead of throwing. Ideal for non-critical fetches.
 */
async function safeGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T | null> {
  try {
    return await get<T>(path, params);
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[apiClient.safeGet] ${path}`, e);
    }
    return null;
  }
}

/**
 * Safe POST — returns null instead of throwing.
 */
async function safePost<T>(path: string, body?: unknown): Promise<T | null> {
  try {
    return await post<T>(path, body);
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[apiClient.safePost] ${path}`, e);
    }
    return null;
  }
}

/**
 * Safe PATCH — returns null instead of throwing.
 */
async function safePatch<T>(path: string, body?: unknown): Promise<T | null> {
  try {
    return await patch<T>(path, body);
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[apiClient.safePatch] ${path}`, e);
    }
    return null;
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const apiClient = {
  get,
  post,
  patch,
  delete: del,
  safeGet,
  safePost,
  safePatch,
} as const;
