import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fetchStats } from '@/api/stats';
import { useAuth } from '@/contexts/AuthContext';
import type { StatsData, Period } from '@/types/stats';

interface UseStatsResult {
  stats: StatsData | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => Promise<unknown>;
}

export function useStats(period: Period): UseStatsResult {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const timezoneOffset = -new Date().getTimezoneOffset();
  const query = useQuery({
    queryKey: ['stats', period, timezoneOffset],
    queryFn: ({ signal }) => fetchStats(token!, period, timezoneOffset, signal),
    enabled: Boolean(token),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!token || !query.data) return;
    const periods: Period[] = period === '30d' ? ['7d', '90d'] : ['30d'];
    periods.forEach((nextPeriod) => {
      void queryClient.prefetchQuery({
        queryKey: ['stats', nextPeriod, timezoneOffset],
        queryFn: ({ signal }) => fetchStats(token, nextPeriod, timezoneOffset, signal),
      });
    });
  }, [period, query.data, queryClient, timezoneOffset, token]);

  return {
    stats: query.data ?? null,
    loading: query.isPending,
    refreshing: query.isFetching && !query.isPending,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
