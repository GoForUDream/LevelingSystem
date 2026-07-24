from datetime import datetime
from typing import NamedTuple

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Integer, and_, case, cast, delete, exists, or_, select, update
from sqlalchemy.sql import func
from models.goal import Goal
from models.task import Task, TaskStatus


class GoalMilestoneRecord(NamedTuple):
    title: str
    total_count: int
    completed_count: int
    first_created_at: datetime


class GoalRepository:
    def __init__(self, db: AsyncSession, auto_commit: bool = True):
        self.db = db
        self.auto_commit = auto_commit

    async def _finish_write(self):
        if self.auto_commit:
            await self.db.commit()
        else:
            await self.db.flush()

    async def create(self, goal: Goal) -> Goal:
        self.db.add(goal)
        await self._finish_write()
        await self.db.refresh(goal)
        return goal

    async def get_by_id(self, goal_id: int) -> Goal | None:
        result = await self.db.execute(select(Goal).where(Goal.id == goal_id))
        return result.scalar_one_or_none()

    async def get_by_id_for_user(self, goal_id: int, user_id: int) -> Goal | None:
        result = await self.db.execute(
            select(Goal).where(Goal.id == goal_id, Goal.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id_for_update(self, goal_id: int) -> Goal | None:
        result = await self.db.execute(
            select(Goal).where(Goal.id == goal_id).with_for_update()
        )
        return result.scalar_one_or_none()

    async def get_all(self, user_id: int, limit: int | None = None) -> list[Goal]:
        query = (
            select(Goal)
            .where(Goal.user_id == user_id)
            .order_by(Goal.created_at.desc(), Goal.id.desc())
        )
        if limit is not None:
            query = query.limit(limit)
        result = await self.db.execute(
            query
        )
        return list(result.scalars().all())

    async def get_summary_page(
        self,
        user_id: int,
        limit: int,
        cursor: tuple[datetime, int] | None = None,
    ) -> list[tuple[Goal, int, int]]:
        active_filter = and_(
            Task.goal_id == Goal.id,
            Task.user_id == user_id,
            Task.status.notin_([TaskStatus.OVERDUE, TaskStatus.CANCELLED]),
        )
        total_count = (
            select(func.count(Task.id)).where(active_filter).correlate(Goal).scalar_subquery()
        )
        completed_count = (
            select(func.count(Task.id))
            .where(active_filter, Task.status == TaskStatus.COMPLETED)
            .correlate(Goal)
            .scalar_subquery()
        )
        query = select(
            Goal,
            total_count.label("total_task_count"),
            completed_count.label("completed_task_count"),
        ).where(Goal.user_id == user_id)
        if cursor is not None:
            created_at, goal_id = cursor
            query = query.where(
                or_(
                    Goal.created_at < created_at,
                    and_(Goal.created_at == created_at, Goal.id < goal_id),
                )
            )
        result = await self.db.execute(
            query.order_by(Goal.created_at.desc(), Goal.id.desc()).limit(limit + 1)
        )
        return [
            (row[0], int(row[1] or 0), int(row[2] or 0))
            for row in result.all()
        ]

    async def get_tasks_for_goal(
        self, goal_id: int, user_id: int, limit: int | None = None
    ) -> list[Task]:
        """Get tasks for a goal, excluding overdue and cancelled tasks."""
        query = (
            select(Task)
            .where(
                Task.goal_id == goal_id,
                Task.user_id == user_id,
                Task.status.notin_([TaskStatus.OVERDUE, TaskStatus.CANCELLED]),
            )
            .order_by(Task.created_at.asc())
        )
        if limit is not None:
            query = query.limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_tasks_for_goals(
        self, goal_ids: list[int], user_id: int, limit: int | None = None
    ) -> list[Task]:
        if not goal_ids:
            return []
        query = (
            select(Task)
            .where(
                Task.goal_id.in_(goal_ids),
                Task.user_id == user_id,
                Task.status.notin_([TaskStatus.OVERDUE, TaskStatus.CANCELLED]),
            )
            .order_by(Task.created_at.asc())
        )
        if limit is not None:
            query = query.limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_milestone_page(
        self,
        goal_id: int,
        user_id: int,
        limit: int,
        cursor: tuple[datetime, str] | None = None,
    ) -> list[GoalMilestoneRecord]:
        first_created_at = func.min(Task.created_at).label("first_created_at")
        completed_count = func.sum(
            cast(case((Task.status == TaskStatus.COMPLETED, 1), else_=0), Integer)
        ).label("completed_count")
        query = (
            select(
                Task.title,
                func.count(Task.id).label("total_count"),
                completed_count,
                first_created_at,
            )
            .where(
                Task.goal_id == goal_id,
                Task.user_id == user_id,
                Task.status.notin_([TaskStatus.OVERDUE, TaskStatus.CANCELLED]),
            )
            .group_by(Task.title)
        )
        if cursor is not None:
            created_at, title = cursor
            query = query.having(
                or_(
                    func.min(Task.created_at) > created_at,
                    and_(func.min(Task.created_at) == created_at, Task.title > title),
                )
            )
        result = await self.db.execute(
            query.order_by(first_created_at.asc(), Task.title.asc()).limit(limit + 1)
        )
        return [
            GoalMilestoneRecord(
                title=str(row.title),
                total_count=int(row.total_count),
                completed_count=int(row.completed_count or 0),
                first_created_at=row.first_created_at,
            )
            for row in result.all()
        ]

    async def has_incomplete_tasks(self, goal_id: int, user_id: int) -> bool:
        result = await self.db.execute(
            select(
                exists().where(
                    Task.goal_id == goal_id,
                    Task.user_id == user_id,
                    Task.status.notin_([TaskStatus.OVERDUE, TaskStatus.CANCELLED]),
                    Task.status != TaskStatus.COMPLETED,
                )
            )
        )
        return bool(result.scalar())

    async def update(self, goal_id: int, data: dict) -> Goal | None:
        data["updated_at"] = func.now()
        await self.db.execute(update(Goal).where(Goal.id == goal_id).values(**data))
        await self._finish_write()
        return await self.get_by_id(goal_id)

    async def delete(self, goal_id: int) -> bool:
        # Unlink tasks from this goal
        await self.db.execute(
            update(Task).where(Task.goal_id == goal_id).values(goal_id=None)
        )
        result = await self.db.execute(
            delete(Goal).where(Goal.id == goal_id).returning(Goal.id)
        )
        await self._finish_write()
        return result.scalar_one_or_none() is not None
