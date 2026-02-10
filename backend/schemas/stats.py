from pydantic import BaseModel
from datetime import date
from typing import Literal


class DailyTaskStats(BaseModel):
    date: date
    completed: int
    overdue: int
    cancelled: int
    exp_earned: int


class CompletionBreakdown(BaseModel):
    completed: int
    overdue: int
    cancelled: int
    in_progress: int
    todo: int


class TimeOfDayDistribution(BaseModel):
    hour: int  # 0-23
    count: int


class HeatmapDay(BaseModel):
    date: date
    count: int
    intensity: int  # 0-4


class ComparisonMetric(BaseModel):
    current: float
    previous: float
    change_percent: float
    trend: Literal["up", "down", "neutral"]


class PeriodComparison(BaseModel):
    period_label: str
    tasks_completed: ComparisonMetric
    exp_earned: ComparisonMetric
    completion_rate: ComparisonMetric
    average_daily_tasks: ComparisonMetric


class StatsResponse(BaseModel):
    # Account info
    account_created_at: date
    account_age_days: int

    # Chart data
    daily_tasks: list[DailyTaskStats]
    completion_breakdown: CompletionBreakdown
    activity_heatmap: list[HeatmapDay]
    time_of_day: list[TimeOfDayDistribution]

    # Summary metrics
    total_tasks_completed: int
    total_exp_earned: int  # EXP earned within the selected period
    completion_rate: float
    average_tasks_per_day: float
    most_productive_hour: int | None
    current_streak: int
    longest_streak: int

    # Comparisons (null if insufficient data)
    monthly_comparison: PeriodComparison | None
    yearly_comparison: PeriodComparison | None

    class Config:
        from_attributes = True
