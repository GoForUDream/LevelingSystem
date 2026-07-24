from datetime import date, datetime, timedelta
from typing import Literal, TypedDict

from sqlalchemy import DateTime, Integer, and_, cast, extract, func, literal, select, union_all
from sqlalchemy.ext.asyncio import AsyncSession

from models.achievement import UserAchievementStats
from models.task import Task, TaskStatus
from models.user import User


Granularity = Literal["day", "month"]


class TimelineAggregateRow(TypedDict):
    bucket: date
    outcome: str
    count: int
    net_exp: int


class HourlyAggregateRow(TypedDict):
    hour: int
    count: int


class SnapshotRow(TypedDict):
    todo: int
    in_progress: int
    on_hold: int
    rescheduled: int
    current_streak: int
    longest_streak: int


class HeatmapRow(TypedDict):
    date: date
    count: int


class ComparisonAggregateRow(TypedDict):
    completed: int
    finished: int
    net_exp: int


class StatsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _outcome_events(user_id: int, start: datetime, end: datetime):
        specs = (
            (
                "COMPLETED",
                TaskStatus.COMPLETED,
                Task.completed_at,
                func.coalesce(Task.exp_earned, 0),
            ),
            (
                "FAILED",
                TaskStatus.FAILED,
                Task.failed_at,
                -func.coalesce(Task.exp_penalty, 0),
            ),
            (
                "OVERDUE",
                TaskStatus.OVERDUE,
                Task.failed_at,
                -func.coalesce(Task.exp_penalty, 0),
            ),
            (
                "CANCELLED",
                TaskStatus.CANCELLED,
                Task.cancelled_at,
                -func.coalesce(Task.exp_penalty, 0),
            ),
        )
        return union_all(
            *[
                select(
                    timestamp.label("occurred_at"),
                    literal(outcome).label("outcome"),
                    exp_delta.label("exp_delta"),
                ).where(
                    Task.user_id == user_id,
                    Task.status == status,
                    timestamp >= start,
                    timestamp <= end,
                )
                for outcome, status, timestamp, exp_delta in specs
            ]
        ).subquery()

    async def get_period_aggregates(
        self,
        user_id: int,
        start: datetime,
        end: datetime,
        timezone_offset: int,
        granularity: Granularity,
    ) -> tuple[list[TimelineAggregateRow], list[HourlyAggregateRow]]:
        events = self._outcome_events(user_id, start, end)
        local_time = events.c.occurred_at + timedelta(minutes=timezone_offset)
        bucket = func.date_trunc(granularity, local_time)

        timeline_query = (
            select(
                literal("timeline").label("kind"),
                bucket.label("bucket"),
                cast(None, Integer).label("hour"),
                events.c.outcome,
                func.count().label("count"),
                func.coalesce(func.sum(events.c.exp_delta), 0).label("net_exp"),
            )
            .group_by(bucket, events.c.outcome)
        )
        hourly_query = (
            select(
                literal("hourly").label("kind"),
                cast(None, DateTime).label("bucket"),
                cast(extract("hour", local_time), Integer).label("hour"),
                literal("COMPLETED").label("outcome"),
                func.count().label("count"),
                literal(0).label("net_exp"),
            )
            .where(events.c.outcome == "COMPLETED")
            .group_by(extract("hour", local_time))
        )
        rows = (await self.db.execute(union_all(timeline_query, hourly_query))).all()
        timeline = [
            {
                "bucket": row.bucket.date(),
                "outcome": row.outcome,
                "count": row.count,
                "net_exp": row.net_exp,
            }
            for row in rows
            if row.kind == "timeline"
        ]
        hourly = [
            {"hour": row.hour, "count": row.count}
            for row in rows
            if row.kind == "hourly"
        ]
        return timeline, hourly

    async def get_snapshot(self, user_id: int) -> SnapshotRow:
        query = (
            select(
                func.count().filter(Task.status == TaskStatus.TODO).label("todo"),
                func.count()
                .filter(Task.status == TaskStatus.IN_PROGRESS)
                .label("in_progress"),
                func.count().filter(Task.status == TaskStatus.ON_HOLD).label("on_hold"),
                func.count()
                .filter(Task.status == TaskStatus.RESCHEDULED)
                .label("rescheduled"),
                UserAchievementStats.current_streak,
                UserAchievementStats.longest_streak,
            )
            .select_from(User)
            .outerjoin(Task, Task.user_id == User.id)
            .outerjoin(UserAchievementStats, UserAchievementStats.user_id == User.id)
            .where(User.id == user_id)
            .group_by(
                UserAchievementStats.current_streak,
                UserAchievementStats.longest_streak,
            )
        )
        row = (await self.db.execute(query)).one()
        return {
            "todo": row.todo,
            "in_progress": row.in_progress,
            "on_hold": row.on_hold,
            "rescheduled": row.rescheduled,
            "current_streak": row.current_streak or 0,
            "longest_streak": row.longest_streak or 0,
        }

    async def get_heatmap(
        self,
        user_id: int,
        start: datetime,
        end: datetime,
        timezone_offset: int,
    ) -> list[HeatmapRow]:
        local_completed = Task.completed_at + timedelta(minutes=timezone_offset)
        query = (
            select(
                func.date(local_completed).label("date"),
                func.count().label("count"),
            )
            .where(
                Task.user_id == user_id,
                Task.status == TaskStatus.COMPLETED,
                Task.completed_at >= start,
                Task.completed_at <= end,
            )
            .group_by(func.date(local_completed))
            .order_by(func.date(local_completed))
        )
        rows = (await self.db.execute(query)).all()
        return [{"date": row.date, "count": row.count} for row in rows]

    async def get_comparison_windows(
        self,
        user_id: int,
        windows: dict[str, tuple[datetime, datetime]],
    ) -> dict[str, ComparisonAggregateRow]:
        earliest = min(start for start, _ in windows.values())
        latest = max(end for _, end in windows.values())
        events = self._outcome_events(user_id, earliest, latest)

        columns = []
        for name, (start, end) in windows.items():
            inside = and_(events.c.occurred_at >= start, events.c.occurred_at <= end)
            columns.extend(
                (
                    func.count()
                    .filter(inside, events.c.outcome == "COMPLETED")
                    .label(f"{name}_completed"),
                    func.count().filter(inside).label(f"{name}_finished"),
                    func.coalesce(func.sum(events.c.exp_delta).filter(inside), 0).label(
                        f"{name}_net_exp"
                    ),
                )
            )
        row = (await self.db.execute(select(*columns))).one()
        return {
            name: {
                "completed": getattr(row, f"{name}_completed"),
                "finished": getattr(row, f"{name}_finished"),
                "net_exp": getattr(row, f"{name}_net_exp"),
            }
            for name in windows
        }
