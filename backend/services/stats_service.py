import calendar
from datetime import date, datetime, time, timedelta, timezone
from typing import Literal

from models.user import User
from repositories.stats_repository import (
    ComparisonAggregateRow,
    HeatmapRow,
    StatsRepository,
    TimelineAggregateRow,
)
from schemas.stats import (
    ComparisonMetric,
    HeatmapDay,
    OutcomeBreakdown,
    PendingSnapshot,
    PeriodComparison,
    StatsResponse,
    TimelinePoint,
    TimeOfDayDistribution,
)


Period = Literal["7d", "30d", "90d", "all"]
Granularity = Literal["day", "month"]


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def add_months(value: date, months: int) -> date:
    month_index = value.year * 12 + value.month - 1 + months
    year, month_zero = divmod(month_index, 12)
    month = month_zero + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


class StatsService:
    def __init__(self, stats_repo: StatsRepository):
        self.stats_repo = stats_repo

    async def get_stats(
        self,
        user: User,
        period: Period,
        timezone_offset: int | None = None,
    ) -> StatsResponse:
        offset_minutes = (
            user.timezone_offset if timezone_offset is None else timezone_offset
        )
        offset = timedelta(minutes=offset_minutes)
        now_utc = utc_now()
        local_now = now_utc + offset
        local_today = local_now.date()
        account_local_date = (user.created_at + offset).date()
        account_age_days = max(0, (local_today - account_local_date).days)

        granularity: Granularity = "month" if period == "all" else "day"
        if period == "all":
            local_start = datetime.combine(account_local_date, time.min)
            period_days = account_age_days + 1
        else:
            day_count = int(period[:-1])
            local_start = datetime.combine(
                local_today - timedelta(days=day_count - 1),
                time.min,
            )
            period_days = day_count
        start_utc = local_start - offset

        timeline_rows, hourly_rows = await self.stats_repo.get_period_aggregates(
            user.id,
            start_utc,
            now_utc,
            offset_minutes,
            granularity,
        )
        snapshot = await self.stats_repo.get_snapshot(user.id)

        heatmap_local_start = datetime.combine(
            local_today - timedelta(days=min(364, account_age_days)),
            time.min,
        )
        heatmap_start_utc = heatmap_local_start - offset
        heatmap_rows = await self.stats_repo.get_heatmap(
            user.id,
            heatmap_start_utc,
            now_utc,
            offset_minutes,
        )

        windows = self._comparison_windows(
            local_now,
            offset,
            include_monthly=account_age_days >= 60,
            include_yearly=account_age_days >= 365,
        )
        comparison_data = (
            await self.stats_repo.get_comparison_windows(user.id, windows)
            if windows
            else {}
        )

        timeline = self._build_timeline(
            timeline_rows,
            local_start.date(),
            local_today,
            granularity,
        )
        breakdown = self._build_breakdown(timeline)
        total_finished = sum(
            (
                breakdown.completed,
                breakdown.failed,
                breakdown.overdue,
                breakdown.cancelled,
            )
        )
        completion_rate = (
            breakdown.completed / total_finished * 100 if total_finished else 0.0
        )
        net_exp_change = sum(point.net_exp for point in timeline)

        hourly_map = {hour: 0 for hour in range(24)}
        for row in hourly_rows:
            hourly_map[row["hour"]] = row["count"]
        time_of_day = [
            TimeOfDayDistribution(hour=hour, count=count)
            for hour, count in hourly_map.items()
        ]
        most_productive_hour = (
            max(hourly_map, key=lambda hour: hourly_map[hour])
            if any(hourly_map.values())
            else None
        )

        return StatsResponse(
            account_created_at=account_local_date,
            account_age_days=account_age_days,
            timeline_granularity=granularity,
            timeline=timeline,
            outcome_breakdown=breakdown,
            pending_snapshot=PendingSnapshot(
                todo=snapshot["todo"],
                in_progress=snapshot["in_progress"],
                on_hold=snapshot["on_hold"],
                rescheduled=snapshot["rescheduled"],
            ),
            activity_heatmap=self._build_heatmap(
                heatmap_rows,
                heatmap_local_start.date(),
                local_today,
            ),
            time_of_day=time_of_day,
            total_tasks_completed=breakdown.completed,
            net_exp_change=net_exp_change,
            completion_rate=round(completion_rate, 1),
            average_tasks_per_day=round(
                breakdown.completed / period_days if period_days else 0.0,
                2,
            ),
            most_productive_hour=most_productive_hour,
            current_streak=snapshot["current_streak"],
            longest_streak=snapshot["longest_streak"],
            monthly_comparison=self._build_comparison(
                "Monthly",
                comparison_data,
                "current_month",
                "previous_month",
                windows,
            ),
            yearly_comparison=self._build_comparison(
                "Yearly",
                comparison_data,
                "current_year",
                "previous_year",
                windows,
            ),
        )

    @staticmethod
    def _build_timeline(
        rows: list[TimelineAggregateRow],
        start: date,
        end: date,
        granularity: Granularity,
    ) -> list[TimelinePoint]:
        buckets: dict[date, dict[str, int]] = {}
        current = start.replace(day=1) if granularity == "month" else start
        while current <= end:
            buckets[current] = {
                "completed": 0,
                "failed": 0,
                "overdue": 0,
                "cancelled": 0,
                "net_exp": 0,
            }
            current = (
                add_months(current, 1)
                if granularity == "month"
                else current + timedelta(days=1)
            )

        for row in rows:
            key = row["bucket"]
            if key not in buckets:
                continue
            buckets[key][row["outcome"].lower()] = row["count"]
            buckets[key]["net_exp"] += row["net_exp"]

        return [
            TimelinePoint(
                date=bucket,
                completed=values["completed"],
                failed=values["failed"],
                overdue=values["overdue"],
                cancelled=values["cancelled"],
                net_exp=values["net_exp"],
            )
            for bucket, values in sorted(buckets.items())
        ]

    @staticmethod
    def _build_breakdown(timeline: list[TimelinePoint]) -> OutcomeBreakdown:
        return OutcomeBreakdown(
            completed=sum(point.completed for point in timeline),
            failed=sum(point.failed for point in timeline),
            overdue=sum(point.overdue for point in timeline),
            cancelled=sum(point.cancelled for point in timeline),
        )

    @staticmethod
    def _build_heatmap(
        rows: list[HeatmapRow],
        start: date,
        end: date,
    ) -> list[HeatmapDay]:
        counts = {row["date"]: row["count"] for row in rows}
        maximum = max(counts.values(), default=0)
        result: list[HeatmapDay] = []
        current = start
        while current <= end:
            count = counts.get(current, 0)
            intensity = 0 if count == 0 or maximum == 0 else min(
                4,
                max(1, (count * 4 + maximum - 1) // maximum),
            )
            result.append(HeatmapDay(date=current, count=count, intensity=intensity))
            current += timedelta(days=1)
        return result

    @staticmethod
    def _comparison_windows(
        local_now: datetime,
        offset: timedelta,
        include_monthly: bool,
        include_yearly: bool,
    ) -> dict[str, tuple[datetime, datetime]]:
        windows: dict[str, tuple[datetime, datetime]] = {}
        if include_monthly:
            current_start = local_now.replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
            previous_date = add_months(current_start.date(), -1)
            previous_start = datetime.combine(previous_date, time.min)
            elapsed = local_now - current_start
            previous_month_end = datetime.combine(
                add_months(previous_date, 1),
                time.min,
            ) - timedelta(microseconds=1)
            previous_end = min(previous_start + elapsed, previous_month_end)
            windows["current_month"] = (current_start - offset, local_now - offset)
            windows["previous_month"] = (
                previous_start - offset,
                previous_end - offset,
            )

        if include_yearly:
            current_start = local_now.replace(
                month=1, day=1, hour=0, minute=0, second=0, microsecond=0
            )
            previous_start = current_start.replace(year=current_start.year - 1)
            elapsed = local_now - current_start
            previous_year_end = current_start - timedelta(microseconds=1)
            previous_end = min(previous_start + elapsed, previous_year_end)
            windows["current_year"] = (current_start - offset, local_now - offset)
            windows["previous_year"] = (
                previous_start - offset,
                previous_end - offset,
            )
        return windows

    def _build_comparison(
        self,
        label: str,
        data: dict[str, ComparisonAggregateRow],
        current_key: str,
        previous_key: str,
        windows: dict[str, tuple[datetime, datetime]],
    ) -> PeriodComparison | None:
        if current_key not in data or previous_key not in data:
            return None
        current = data[current_key]
        previous = data[previous_key]
        current_days = (windows[current_key][1].date() - windows[current_key][0].date()).days + 1
        previous_days = (
            windows[previous_key][1].date() - windows[previous_key][0].date()
        ).days + 1
        current_rate = (
            current["completed"] / current["finished"] * 100
            if current["finished"]
            else 0
        )
        previous_rate = (
            previous["completed"] / previous["finished"] * 100
            if previous["finished"]
            else 0
        )
        return PeriodComparison(
            period_label=label,
            tasks_completed=self._metric(
                current["completed"], previous["completed"]
            ),
            net_exp=self._metric(current["net_exp"], previous["net_exp"]),
            completion_rate=self._metric(current_rate, previous_rate),
            average_daily_tasks=self._metric(
                current["completed"] / current_days,
                previous["completed"] / previous_days,
            ),
        )

    @staticmethod
    def _metric(current: float, previous: float) -> ComparisonMetric:
        change = (
            ((current - previous) / abs(previous)) * 100
            if previous
            else (100.0 if current else 0.0)
        )
        trend: Literal["up", "down", "neutral"] = (
            "up" if change > 0 else "down" if change < 0 else "neutral"
        )
        return ComparisonMetric(
            current=round(current, 2),
            previous=round(previous, 2),
            change_percent=round(change, 1),
            trend=trend,
        )
