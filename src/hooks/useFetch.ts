'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFetchOptions {
  /** Auto-polling interval in ms. Set to 0 to disable. */
  pollingInterval?: number;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Generic data fetching hook with optional polling.
 * Handles loading state, error state, and safe cleanup.
 */
export function useFetch<T>(
  url: string,
  options: UseFetchOptions = {}
): UseFetchResult<T> {
  const { pollingInterval = 0 } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // Abort any previous in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch(url, { signal: abortRef.current.signal });
      const json = await res.json();

      // Handle standardized { success, data } responses
      if (json && typeof json === 'object' && 'success' in json) {
        if (json.success) {
          setData(json.data);
          setError(null);
        } else {
          setError(json.error ?? 'An error occurred');
        }
      } else {
        // Legacy: direct data response
        setData(json);
        setError(null);
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      setError((err as Error)?.message ?? 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }, [url]);

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Polling
  useEffect(() => {
    if (!pollingInterval || pollingInterval <= 0) return;
    const interval = setInterval(fetchData, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchData, pollingInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return { data, loading, error, refresh: fetchData };
}
