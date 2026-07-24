from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, delete, or_, select, update
from sqlalchemy.sql import func
from models.task import Task
from datetime import datetime, timezone


class TaskRepository:
    def __init__(self, db: AsyncSession, auto_commit: bool = True):
        self.db = db
        self.auto_commit = auto_commit

    async def _finish_write(self):
        if self.auto_commit:
            await self.db.commit()
        else:
            await self.db.flush()

    async def create(self, task: Task) -> Task:
        self.db.add(task)
        await self._finish_write()
        await self.db.refresh(task)
        return task

    async def get_by_id(self, task_id: int) -> Task | None:
        result = await self.db.execute(select(Task).where(Task.id == task_id))
        return result.scalar_one_or_none()

    async def get_by_id_for_update(self, task_id: int) -> Task | None:
        result = await self.db.execute(
            select(Task).where(Task.id == task_id).with_for_update()
        )
        return result.scalar_one_or_none()

    async def get_all(self, user_id: int | None = None, limit: int | None = None) -> list[Task]:
        query = select(Task)
        if user_id is not None:
            query = query.where(Task.user_id == user_id)
        query = query.order_by(Task.created_at.desc())
        if limit is not None:
            query = query.limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_page(
        self,
        user_id: int,
        limit: int,
        cursor: tuple[datetime, int] | None = None,
    ) -> list[Task]:
        query = select(Task).where(Task.user_id == user_id)
        if cursor is not None:
            created_at, task_id = cursor
            query = query.where(
                or_(
                    Task.created_at < created_at,
                    and_(Task.created_at == created_at, Task.id < task_id),
                )
            )
        result = await self.db.execute(
            query.order_by(Task.created_at.desc(), Task.id.desc()).limit(limit + 1)
        )
        return list(result.scalars().all())

    async def get_by_date_range(
        self,
        user_id: int,
        start_date: datetime,
        end_date: datetime,
        limit: int | None = None,
        cursor: tuple[datetime, int] | None = None,
    ) -> list[Task]:
        if start_date.tzinfo is not None:
            start_date = start_date.astimezone(timezone.utc).replace(tzinfo=None)
        if end_date.tzinfo is not None:
            end_date = end_date.astimezone(timezone.utc).replace(tzinfo=None)

        query = (
            select(Task)
            .where(Task.user_id == user_id)
            .where(Task.due_date >= start_date)
            .where(Task.due_date <= end_date)
        )
        if cursor is not None:
            due_date, task_id = cursor
            query = query.where(
                or_(
                    Task.due_date > due_date,
                    and_(Task.due_date == due_date, Task.id > task_id),
                )
            )
        query = query.order_by(Task.due_date.asc(), Task.id.asc())
        if limit is not None:
            query = query.limit(limit + 1)
        result = await self.db.execute(
            query
        )
        return list(result.scalars().all())

    async def update(self, task_id: int, data: dict) -> Task | None:
        data["updated_at"] = func.now()
        await self.db.execute(update(Task).where(Task.id == task_id).values(**data))
        await self._finish_write()
        return await self.get_by_id(task_id)

    async def delete(self, task_id: int) -> bool:
        result = await self.db.execute(
            delete(Task).where(Task.id == task_id).returning(Task.id)
        )
        await self._finish_write()
        return result.scalar_one_or_none() is not None
