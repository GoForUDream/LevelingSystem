import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { StatsData, Period } from '@/types/stats';
import { API_URL, apiFetch } from '@/lib/utils';

interface UseStatsResult {
  stats: StatsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useStats(period: Period): UseStatsResult {
  const { token } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchStats = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    const timezoneOffset = -new Date().getTimezoneOffset();

    try {
      const res = await apiFetch(
        `${API_URL}/api/stats?period=${period}&timezone_offset=${timezoneOffset}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }
      );

      if (!res.ok) throw new Error('Failed to fetch stats');

      const data: StatsData = await res.json();
      setStats(data);
      setLoading(false);
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [token, period]);

  useEffect(() => {
    fetchStats();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
