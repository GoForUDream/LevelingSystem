import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

describe('stats query caching', () => {
  it('deduplicates concurrent requests and serves fresh cached data', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { staleTime: 30_000, retry: false } },
    });
    const queryFn = vi.fn(async () => ({ total_tasks_completed: 4 }));
    const options = { queryKey: ['stats', '30d', 420], queryFn };

    const [first, second] = await Promise.all([
      client.fetchQuery(options),
      client.fetchQuery(options),
    ]);
    const cached = await client.fetchQuery(options);

    expect(first).toEqual(second);
    expect(cached.total_tasks_completed).toBe(4);
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('keeps period and timezone cache entries isolated', async () => {
    const client = new QueryClient();
    client.setQueryData(['stats', '7d', 0], { value: 'utc' });
    client.setQueryData(['stats', '7d', 420], { value: 'utc+7' });

    expect(client.getQueryData(['stats', '7d', 0])).toEqual({ value: 'utc' });
    expect(client.getQueryData(['stats', '7d', 420])).toEqual({ value: 'utc+7' });
  });
});
