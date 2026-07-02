from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.sql import func
from models.goal import Goal
from models.task import Task, TaskStatus


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

    async def get_by_id_for_update(self, goal_id: int) -> Goal | None:
        result = await self.db.execute(
            select(Goal).where(Goal.id == goal_id).with_for_update()
        )
        return result.scalar_one_or_none()

    async def get_all(self, user_id: int) -> list[Goal]:
        result = await self.db.execute(
            select(Goal)
            .where(Goal.user_id == user_id)
            .order_by(Goal.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_tasks_for_goal(self, goal_id: int) -> list[Task]:
        """Get tasks for a goal, excluding overdue and cancelled tasks."""
        result = await self.db.execute(
            select(Task)
            .where(
                Task.goal_id == goal_id,
                Task.status.notin_([TaskStatus.OVERDUE, TaskStatus.CANCELLED]),
            )
            .order_by(Task.created_at.asc())
        )
        return list(result.scalars().all())

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
