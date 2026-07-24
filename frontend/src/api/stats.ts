import { API_URL, apiFetch } from '@/lib/utils';
import type { Period, StatsData } from '@/types/stats';

export class StatsRequestError extends Error {
  readonly status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);
    this.name = 'StatsRequestError';
    this.status = status;
  }
}

export async function fetchStats(
  token: string,
  period: Period,
  timezoneOffset: number,
  signal?: AbortSignal,
): Promise<StatsData> {
  const params = new URLSearchParams({
    period,
    timezone_offset: String(timezoneOffset),
  });
  const response = await apiFetch(`${API_URL}/api/stats?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (!response.ok) {
    throw new StatsRequestError('Failed to fetch stats', response.status);
  }

  return response.json() as Promise<StatsData>;
}
