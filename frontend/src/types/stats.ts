// Shared stats types - single source of truth

export interface DailyTaskStats {
  date: string;
  completed: number;
  overdue: number;
  cancelled: number;
  exp_earned: number;
}

export interface CompletionBreakdown {
  completed: number;
  overdue: number;
  cancelled: number;
  in_progress: number;
  todo: number;
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
  exp_earned: ComparisonMetric;
  completion_rate: ComparisonMetric;
  average_daily_tasks: ComparisonMetric;
}

export interface StatsData {
  account_created_at: string;
  account_age_days: number;
  daily_tasks: DailyTaskStats[];
  completion_breakdown: CompletionBreakdown;
  activity_heatmap: HeatmapDay[];
  time_of_day: TimeOfDayDistribution[];
  total_tasks_completed: number;
  total_exp_earned: number;
  completion_rate: number;
  average_tasks_per_day: number;
  most_productive_hour: number | null;
  current_streak: number;
  longest_streak: number;
  monthly_comparison: PeriodComparison | null;
  yearly_comparison: PeriodComparison | null;
}

export type Period = '7d' | '30d' | '90d' | 'all';
