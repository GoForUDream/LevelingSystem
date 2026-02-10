from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case, extract
from models.task import Task, TaskStatus
from datetime import datetime


class StatsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_tasks_in_period(
        self, user_id: int, start: datetime, end: datetime
    ) -> list[Task]:
        result = await self.db.execute(
            select(Task)
            .where(Task.user_id == user_id)
            .where(Task.created_at >= start)
            .where(Task.created_at <= end)
        )
        return list(result.scalars().all())

    async def get_daily_stats(
        self, user_id: int, start: datetime, end: datetime
    ) -> list[dict]:
        """Get task counts grouped by completion date."""
        # Group completed tasks by completion date
        query = (
            select(
                func.date(Task.completed_at).label("date"),
                func.count().label("completed"),
                func.coalesce(func.sum(Task.exp_earned), 0).label("exp_earned"),
            )
            .where(Task.user_id == user_id)
            .where(Task.status == TaskStatus.COMPLETED)
            .where(Task.completed_at >= start)
            .where(Task.completed_at <= end)
            .group_by(func.date(Task.completed_at))
            .order_by(func.date(Task.completed_at))
        )
        result = await self.db.execute(query)
        rows = result.all()
        return [
            {"date": row.date, "completed": row.completed, "exp_earned": row.exp_earned}
            for row in rows
        ]

    async def get_overdue_by_date(
        self, user_id: int, start: datetime, end: datetime
    ) -> list[dict]:
        """Get overdue/failed task counts grouped by failed date."""
        query = (
            select(
                func.date(Task.failed_at).label("date"),
                func.count().label("overdue"),
            )
            .where(Task.user_id == user_id)
            .where(Task.status.in_([TaskStatus.OVERDUE, TaskStatus.FAILED]))
            .where(Task.failed_at >= start)
            .where(Task.failed_at <= end)
            .group_by(func.date(Task.failed_at))
        )
        result = await self.db.execute(query)
        rows = result.all()
        return [{"date": row.date, "overdue": row.overdue} for row in rows]

    async def get_cancelled_by_date(
        self, user_id: int, start: datetime, end: datetime
    ) -> list[dict]:
        """Get cancelled task counts grouped by updated date (when cancelled)."""
        query = (
            select(
                func.date(Task.updated_at).label("date"),
                func.count().label("cancelled"),
            )
            .where(Task.user_id == user_id)
            .where(Task.status == TaskStatus.CANCELLED)
            .where(Task.updated_at >= start)
            .where(Task.updated_at <= end)
            .group_by(func.date(Task.updated_at))
        )
        result = await self.db.execute(query)
        rows = result.all()
        return [{"date": row.date, "cancelled": row.cancelled} for row in rows]

    async def get_hourly_distribution(
        self, user_id: int, start: datetime, end: datetime
    ) -> list[dict]:
        """Get completed task counts grouped by hour of day."""
        query = (
            select(
                extract("hour", Task.completed_at).label("hour"),
                func.count().label("count"),
            )
            .where(Task.user_id == user_id)
            .where(Task.status == TaskStatus.COMPLETED)
            .where(Task.completed_at >= start)
            .where(Task.completed_at <= end)
            .group_by(extract("hour", Task.completed_at))
            .order_by(extract("hour", Task.completed_at))
        )
        result = await self.db.execute(query)
        rows = result.all()
        return [{"hour": int(row.hour), "count": row.count} for row in rows]

    async def get_status_counts(
        self, user_id: int, start: datetime, end: datetime
    ) -> dict:
        """Get task counts by status for tasks created in period."""
        query = (
            select(
                func.count()
                .filter(Task.status == TaskStatus.COMPLETED)
                .label("completed"),
                func.count()
                .filter(Task.status.in_([TaskStatus.OVERDUE, TaskStatus.FAILED]))
                .label("overdue"),
                func.count()
                .filter(Task.status == TaskStatus.CANCELLED)
                .label("cancelled"),
                func.count()
                .filter(Task.status == TaskStatus.IN_PROGRESS)
                .label("in_progress"),
                func.count()
                .filter(Task.status == TaskStatus.TODO)
                .label("todo"),
            )
            .where(Task.user_id == user_id)
            .where(Task.created_at >= start)
            .where(Task.created_at <= end)
        )
        result = await self.db.execute(query)
        row = result.one()
        return {
            "completed": row.completed,
            "overdue": row.overdue,
            "cancelled": row.cancelled,
            "in_progress": row.in_progress,
            "todo": row.todo,
        }

    async def get_total_completed_and_exp(
        self, user_id: int, start: datetime, end: datetime
    ) -> dict:
        """Get total completed tasks and EXP earned in period."""
        query = (
            select(
                func.count().label("total_completed"),
                func.coalesce(func.sum(Task.exp_earned), 0).label("total_exp"),
            )
            .where(Task.user_id == user_id)
            .where(Task.status == TaskStatus.COMPLETED)
            .where(Task.completed_at >= start)
            .where(Task.completed_at <= end)
        )
        result = await self.db.execute(query)
        row = result.one()
        return {"total_completed": row.total_completed, "total_exp": row.total_exp}

    async def get_total_tasks_created(
        self, user_id: int, start: datetime, end: datetime
    ) -> int:
        """Get total tasks created in period."""
        query = (
            select(func.count())
            .where(Task.user_id == user_id)
            .where(Task.created_at >= start)
            .where(Task.created_at <= end)
        )
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def get_net_exp_in_period(
        self, user_id: int, start: datetime, end: datetime
    ) -> int:
        """
        Get net EXP in period (completed exp minus overdue penalties).
        Completed tasks: +exp_earned (based on completed_at)
        Overdue tasks: -exp_value penalty (based on failed_at)
        Note: Cancelled tasks store exp_penalty but don't deduct from user.total_exp
        """
        # Sum of exp_earned from completed tasks
        completed_query = (
            select(func.coalesce(func.sum(Task.exp_earned), 0))
            .where(Task.user_id == user_id)
            .where(Task.status == TaskStatus.COMPLETED)
            .where(Task.completed_at >= start)
            .where(Task.completed_at <= end)
        )
        completed_result = await self.db.execute(completed_query)
        completed_exp = completed_result.scalar() or 0

        # Sum of penalties from overdue tasks (exp_value is the penalty)
        overdue_query = (
            select(func.coalesce(func.sum(Task.exp_value), 0))
            .where(Task.user_id == user_id)
            .where(Task.status.in_([TaskStatus.OVERDUE, TaskStatus.FAILED]))
            .where(Task.failed_at >= start)
            .where(Task.failed_at <= end)
        )
        overdue_result = await self.db.execute(overdue_query)
        overdue_penalty = overdue_result.scalar() or 0

        return completed_exp - overdue_penalty
