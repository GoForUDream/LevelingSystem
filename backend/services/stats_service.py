from datetime import datetime, date, timedelta, timezone
from typing import Literal
from repositories.stats_repository import StatsRepository
from repositories.user_repository import UserRepository
from repositories.achievement_repository import AchievementRepository
from schemas.stats import (
    StatsResponse,
    DailyTaskStats,
    CompletionBreakdown,
    TimeOfDayDistribution,
    HeatmapDay,
    ComparisonMetric,
    PeriodComparison,
)


class StatsService:
    def __init__(
        self,
        stats_repo: StatsRepository,
        user_repo: UserRepository,
        achievement_repo: AchievementRepository,
    ):
        self.stats_repo = stats_repo
        self.user_repo = user_repo
        self.achievement_repo = achievement_repo

    async def get_stats(
        self, user_id: int, period: Literal["7d", "30d", "90d", "all"],
        timezone_offset: int = 0
    ) -> StatsResponse:
        # Get user for account age and timezone
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        # Use user's stored timezone if no offset provided
        tz_offset = timezone_offset if timezone_offset != 0 else user.timezone_offset

        account_created = user.created_at.date()
        utc_now = datetime.now(timezone.utc).replace(tzinfo=None)
        today = utc_now.date()
        account_age_days = (today - account_created).days

        # Calculate date range from period
        now = utc_now
        if period == "7d":
            start = now - timedelta(days=7)
        elif period == "30d":
            start = now - timedelta(days=30)
        elif period == "90d":
            start = now - timedelta(days=90)
        else:  # all
            start = datetime.combine(account_created, datetime.min.time())

        end = now

        # Fetch aggregated data from repository
        daily_completed = await self.stats_repo.get_daily_stats(user_id, start, end)
        daily_overdue = await self.stats_repo.get_overdue_by_date(user_id, start, end)
        daily_cancelled = await self.stats_repo.get_cancelled_by_date(user_id, start, end)
        hourly_dist = await self.stats_repo.get_hourly_distribution(user_id, start, end)
        status_counts = await self.stats_repo.get_status_counts(user_id, start, end)
        totals = await self.stats_repo.get_total_completed_and_exp(user_id, start, end)

        # Build daily_tasks list - merge completed, overdue, cancelled by date
        date_map: dict[date, dict] = {}

        # Initialize all dates in the period
        current = start.date() if isinstance(start, datetime) else start
        end_date = end.date() if isinstance(end, datetime) else end
        while current <= end_date:
            date_map[current] = {"completed": 0, "overdue": 0, "cancelled": 0, "exp_earned": 0}
            current += timedelta(days=1)

        # Fill in completed data
        for row in daily_completed:
            d = row["date"]
            if d in date_map:
                date_map[d]["completed"] = row["completed"]
                date_map[d]["exp_earned"] = row["exp_earned"]

        # Fill in overdue data
        for row in daily_overdue:
            d = row["date"]
            if d in date_map:
                date_map[d]["overdue"] = row["overdue"]

        # Fill in cancelled data
        for row in daily_cancelled:
            d = row["date"]
            if d in date_map:
                date_map[d]["cancelled"] = row["cancelled"]

        daily_tasks = [
            DailyTaskStats(
                date=d,
                completed=data["completed"],
                overdue=data["overdue"],
                cancelled=data["cancelled"],
                exp_earned=data["exp_earned"],
            )
            for d, data in sorted(date_map.items())
        ]

        # Completion breakdown
        completion_breakdown = CompletionBreakdown(
            completed=status_counts["completed"],
            overdue=status_counts["overdue"],
            cancelled=status_counts["cancelled"],
            in_progress=status_counts["in_progress"],
            todo=status_counts["todo"],
        )

        # Time of day distribution - fill in all 24 hours
        hourly_map = {h: 0 for h in range(24)}
        for row in hourly_dist:
            hourly_map[row["hour"]] = row["count"]

        time_of_day = [
            TimeOfDayDistribution(hour=h, count=hourly_map[h])
            for h in range(24)
        ]

        # Build heatmap - last 365 days or account age, whichever is less
        heatmap_days = min(365, account_age_days + 1)
        heatmap_start = now - timedelta(days=heatmap_days)
        heatmap_data = await self.stats_repo.get_daily_stats(user_id, heatmap_start, end)

        # Find max count for intensity calculation
        heatmap_counts = {row["date"]: row["completed"] for row in heatmap_data}
        max_count = max(heatmap_counts.values()) if heatmap_counts else 1

        activity_heatmap = []
        current = heatmap_start.date() if isinstance(heatmap_start, datetime) else heatmap_start
        while current <= end_date:
            count = heatmap_counts.get(current, 0)
            if count == 0:
                intensity = 0
            elif max_count > 0:
                # Scale 1-4 based on relative activity
                ratio = count / max_count
                if ratio <= 0.25:
                    intensity = 1
                elif ratio <= 0.5:
                    intensity = 2
                elif ratio <= 0.75:
                    intensity = 3
                else:
                    intensity = 4
            else:
                intensity = 0

            activity_heatmap.append(
                HeatmapDay(date=current, count=count, intensity=intensity)
            )
            current += timedelta(days=1)

        # Calculate summary metrics
        total_tasks_completed = totals["total_completed"]
        total_exp_earned = totals["total_exp"]

        # Completion rate: completed / (completed + overdue + cancelled)
        total_finished = (
            status_counts["completed"]
            + status_counts["overdue"]
            + status_counts["cancelled"]
        )
        completion_rate = (
            (status_counts["completed"] / total_finished * 100)
            if total_finished > 0
            else 0.0
        )

        # Average tasks per day
        period_days = (end.date() - start.date()).days + 1 if isinstance(start, datetime) and isinstance(end, datetime) else 1
        average_tasks_per_day = total_tasks_completed / period_days if period_days > 0 else 0.0

        # Most productive hour
        most_productive_hour = None
        if hourly_dist:
            max_hour_row = max(hourly_dist, key=lambda x: x["count"])
            if max_hour_row["count"] > 0:
                most_productive_hour = max_hour_row["hour"]

        # Get streak data from achievement stats
        achievement_stats = await self.achievement_repo.get_or_create_stats(user_id)
        current_streak = achievement_stats.current_streak
        longest_streak = achievement_stats.longest_streak

        # Calculate comparisons
        monthly_comparison = None
        yearly_comparison = None

        if account_age_days >= 60:
            monthly_comparison = await self._calculate_monthly_comparison(user_id)

        if account_age_days >= 365:
            yearly_comparison = await self._calculate_yearly_comparison(user_id)

        return StatsResponse(
            account_created_at=account_created,
            account_age_days=account_age_days,
            daily_tasks=daily_tasks,
            completion_breakdown=completion_breakdown,
            activity_heatmap=activity_heatmap,
            time_of_day=time_of_day,
            total_tasks_completed=total_tasks_completed,
            total_exp_earned=total_exp_earned,
            completion_rate=round(completion_rate, 1),
            average_tasks_per_day=round(average_tasks_per_day, 2),
            most_productive_hour=most_productive_hour,
            current_streak=current_streak,
            longest_streak=longest_streak,
            monthly_comparison=monthly_comparison,
            yearly_comparison=yearly_comparison,
        )

    async def _calculate_monthly_comparison(self, user_id: int) -> PeriodComparison:
        """Compare this month (so far) vs last month (same period)."""
        now = datetime.utcnow()

        # Current month: 1st of this month to today
        current_start = datetime(now.year, now.month, 1)
        current_end = now
        current_days = (current_end.date() - current_start.date()).days + 1

        # Previous month: 1st of last month to same day number (or end of month)
        if now.month == 1:
            prev_year = now.year - 1
            prev_month = 12
        else:
            prev_year = now.year
            prev_month = now.month - 1

        prev_start = datetime(prev_year, prev_month, 1)
        # Use same number of days into the month
        prev_end = prev_start + timedelta(days=current_days - 1)

        return await self._compare_periods(
            user_id, current_start, current_end, prev_start, prev_end, "Monthly"
        )

    async def _calculate_yearly_comparison(self, user_id: int) -> PeriodComparison:
        """Compare this year (so far) vs same period last year."""
        now = datetime.utcnow()

        # Current year: Jan 1 to today
        current_start = datetime(now.year, 1, 1)
        current_end = now

        # Previous year: Jan 1 to same day last year
        prev_start = datetime(now.year - 1, 1, 1)
        prev_end = datetime(now.year - 1, now.month, now.day, now.hour, now.minute, now.second)

        return await self._compare_periods(
            user_id, current_start, current_end, prev_start, prev_end, "Yearly"
        )

    async def _compare_periods(
        self,
        user_id: int,
        current_start: datetime,
        current_end: datetime,
        prev_start: datetime,
        prev_end: datetime,
        label: str,
    ) -> PeriodComparison:
        # Get data for both periods
        current_totals = await self.stats_repo.get_total_completed_and_exp(
            user_id, current_start, current_end
        )
        prev_totals = await self.stats_repo.get_total_completed_and_exp(
            user_id, prev_start, prev_end
        )

        current_status = await self.stats_repo.get_status_counts(
            user_id, current_start, current_end
        )
        prev_status = await self.stats_repo.get_status_counts(
            user_id, prev_start, prev_end
        )

        # Calculate days in each period
        current_days = (current_end.date() - current_start.date()).days + 1
        prev_days = (prev_end.date() - prev_start.date()).days + 1

        # Tasks completed
        tasks_completed = self._make_comparison_metric(
            current_totals["total_completed"], prev_totals["total_completed"]
        )

        # EXP earned
        exp_earned = self._make_comparison_metric(
            current_totals["total_exp"], prev_totals["total_exp"]
        )

        # Completion rate
        current_finished = (
            current_status["completed"]
            + current_status["overdue"]
            + current_status["cancelled"]
        )
        prev_finished = (
            prev_status["completed"]
            + prev_status["overdue"]
            + prev_status["cancelled"]
        )
        current_rate = (
            current_status["completed"] / current_finished * 100
            if current_finished > 0
            else 0
        )
        prev_rate = (
            prev_status["completed"] / prev_finished * 100 if prev_finished > 0 else 0
        )
        completion_rate = self._make_comparison_metric(current_rate, prev_rate)

        # Average daily tasks
        current_avg = current_totals["total_completed"] / current_days if current_days > 0 else 0
        prev_avg = prev_totals["total_completed"] / prev_days if prev_days > 0 else 0
        average_daily_tasks = self._make_comparison_metric(current_avg, prev_avg)

        return PeriodComparison(
            period_label=label,
            tasks_completed=tasks_completed,
            exp_earned=exp_earned,
            completion_rate=completion_rate,
            average_daily_tasks=average_daily_tasks,
        )

    def _make_comparison_metric(self, current: float, previous: float) -> ComparisonMetric:
        if previous > 0:
            change_percent = ((current - previous) / previous) * 100
        else:
            change_percent = 0.0 if current == 0 else 100.0

        if change_percent > 0:
            trend = "up"
        elif change_percent < 0:
            trend = "down"
        else:
            trend = "neutral"

        return ComparisonMetric(
            current=round(current, 2),
            previous=round(previous, 2),
            change_percent=round(change_percent, 1),
            trend=trend,
        )
