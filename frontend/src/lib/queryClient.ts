import { QueryClient } from '@tanstack/react-query';
import { StatsRequestError } from '@/api/stats';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry(failureCount, error) {
        if (error instanceof StatsRequestError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

export function invalidateProgressQueries() {
  return queryClient.invalidateQueries({ queryKey: ['stats'] });
}
