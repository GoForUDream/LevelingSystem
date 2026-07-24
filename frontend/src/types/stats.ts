export interface TimelinePoint {
  date: string;
  completed: number;
  failed: number;
  overdue: number;
  cancelled: number;
  net_exp: number;
}

export interface OutcomeBreakdown {
  completed: number;
  failed: number;
  overdue: number;
  cancelled: number;
}

export interface PendingSnapshot {
  todo: number;
  in_progress: number;
  on_hold: number;
  rescheduled: number;
}

export interface TimeOfDayDistribution {
  hour: number;
  count: number;
}

export interface HeatmapDay {
  date: string;
  count: number;
  intensity: number;
}

export interface ComparisonMetric {
  current: number;
  previous: number;
  change_percent: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface PeriodComparison {
  period_label: string;
  tasks_completed: ComparisonMetric;
  net_exp: ComparisonMetric;
  completion_rate: ComparisonMetric;
  average_daily_tasks: ComparisonMetric;
}

export interface StatsData {
  account_created_at: string;
  account_age_days: number;
  timeline_granularity: 'day' | 'month';
  timeline: TimelinePoint[];
  outcome_breakdown: OutcomeBreakdown;
  pending_snapshot: PendingSnapshot;
  activity_heatmap: HeatmapDay[];
  time_of_day: TimeOfDayDistribution[];
  total_tasks_completed: number;
  net_exp_change: number;
  completion_rate: number;
  average_tasks_per_day: number;
  most_productive_hour: number | null;
  current_streak: number;
  longest_streak: number;
  monthly_comparison: PeriodComparison | null;
  yearly_comparison: PeriodComparison | null;
}

export type Period = '7d' | '30d' | '90d' | 'all';
