from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.sql import func
from models.task import Task
from datetime import datetime


class TaskRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, task: Task) -> Task:
        self.db.add(task)
        await self.db.commit()
        await self.db.refresh(task)
        return task

    async def get_by_id(self, task_id: int) -> Task | None:
        result = await self.db.execute(select(Task).where(Task.id == task_id))
        return result.scalar_one_or_none()

    async def get_all(self, user_id: int | None = None) -> list[Task]:
        query = select(Task)
        if user_id:
            query = query.where(Task.user_id == user_id)
        query = query.order_by(Task.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_date_range(
        self, user_id: int, start_date: datetime, end_date: datetime
    ) -> list[Task]:
        # Convert to naive UTC if timezone-aware (DB stores naive datetimes)
        if start_date.tzinfo is not None:
            start_date = start_date.replace(tzinfo=None)
        if end_date.tzinfo is not None:
            end_date = end_date.replace(tzinfo=None)

        result = await self.db.execute(
            select(Task)
            .where(Task.user_id == user_id)
            .where(Task.due_date >= start_date)
            .where(Task.due_date <= end_date)
            .order_by(Task.due_date)
        )
        return list(result.scalars().all())

    async def update(self, task_id: int, data: dict) -> Task | None:
        data["updated_at"] = func.now()
        await self.db.execute(update(Task).where(Task.id == task_id).values(**data))
        await self.db.commit()
        return await self.get_by_id(task_id)

    async def delete(self, task_id: int) -> bool:
        result = await self.db.execute(delete(Task).where(Task.id == task_id))
        await self.db.commit()
        return result.rowcount > 0
