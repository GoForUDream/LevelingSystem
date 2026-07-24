from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict


class TimelinePoint(BaseModel):
    date: date
    completed: int
    failed: int
    overdue: int
    cancelled: int
    net_exp: int


class OutcomeBreakdown(BaseModel):
    completed: int
    failed: int
    overdue: int
    cancelled: int


class PendingSnapshot(BaseModel):
    todo: int
    in_progress: int
    on_hold: int
    rescheduled: int


class TimeOfDayDistribution(BaseModel):
    hour: int
    count: int


class HeatmapDay(BaseModel):
    date: date
    count: int
    intensity: int


class ComparisonMetric(BaseModel):
    current: float
    previous: float
    change_percent: float
    trend: Literal["up", "down", "neutral"]


class PeriodComparison(BaseModel):
    period_label: str
    tasks_completed: ComparisonMetric
    net_exp: ComparisonMetric
    completion_rate: ComparisonMetric
    average_daily_tasks: ComparisonMetric


class StatsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    account_created_at: date
    account_age_days: int
    timeline_granularity: Literal["day", "month"]
    timeline: list[TimelinePoint]
    outcome_breakdown: OutcomeBreakdown
    pending_snapshot: PendingSnapshot
    activity_heatmap: list[HeatmapDay]
    time_of_day: list[TimeOfDayDistribution]
    total_tasks_completed: int
    net_exp_change: int
    completion_rate: float
    average_tasks_per_day: float
    most_productive_hour: int | None
    current_streak: int
    longest_streak: int
    monthly_comparison: PeriodComparison | None
    yearly_comparison: PeriodComparison | None
