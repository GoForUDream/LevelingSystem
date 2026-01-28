from repositories.task_repository import TaskRepository
from models.task import Task, TaskStatus, TaskImportance
from schemas.task import TaskCreate, TaskUpdate
from constants.levels import IMPORTANCE_EXP
from datetime import datetime, timezone


def utc_now() -> datetime:
    """Return current UTC time as naive datetime (no timezone info)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def to_naive_utc(dt: datetime | None) -> datetime | None:
    """Convert timezone-aware datetime to naive UTC datetime."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        # Convert to UTC and strip timezone
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


class TaskService:
    def __init__(self, repository: TaskRepository):
        self.repository = repository

    def _calculate_exp_value(self, importance: TaskImportance) -> int:
        return IMPORTANCE_EXP.get(importance.value, 50)

    async def create_task(self, data: TaskCreate, user_id: int) -> Task:
        due_date = to_naive_utc(data.due_date)
        task = Task(
            user_id=user_id,
            title=data.title,
            description=data.description,
            status=data.status,
            importance=data.importance,
            exp_value=self._calculate_exp_value(data.importance),
            due_date=due_date,
            original_due_date=due_date,
            category_id=data.category_id,
            project_id=data.project_id,
        )
        return await self.repository.create(task)

    async def get_task(self, task_id: int) -> Task | None:
        return await self.repository.get_by_id(task_id)

    async def get_all_tasks(self, user_id: int | None = None) -> list[Task]:
        return await self.repository.get_all(user_id)

    async def get_tasks_by_date_range(
        self, user_id: int, start_date: datetime, end_date: datetime
    ) -> list[Task]:
        return await self.repository.get_by_date_range(user_id, start_date, end_date)

    async def update_task(self, task_id: int, data: TaskUpdate) -> Task | None:
        update_data = data.model_dump(exclude_unset=True)

        # Recalculate exp_value if importance changes
        if "importance" in update_data:
            update_data["exp_value"] = self._calculate_exp_value(update_data["importance"])

        # Convert timezone-aware datetime to naive UTC
        if "due_date" in update_data:
            update_data["due_date"] = to_naive_utc(update_data["due_date"])

        return await self.repository.update(task_id, update_data)

    async def start_task(self, task_id: int) -> Task | None:
        return await self.repository.update(
            task_id,
            {"status": TaskStatus.IN_PROGRESS, "started_at": utc_now()},
        )

    async def complete_task(self, task_id: int) -> Task | None:
        task = await self.repository.get_by_id(task_id)
        if not task:
            return None

        exp_earned = task.exp_value
        return await self.repository.update(
            task_id,
            {
                "status": TaskStatus.COMPLETED,
                "completed_at": utc_now(),
                "exp_earned": exp_earned,
                "is_exp_processed": True,
            },
        )

    async def fail_task(self, task_id: int) -> Task | None:
        task = await self.repository.get_by_id(task_id)
        if not task:
            return None

        exp_penalty = task.exp_value // 2
        return await self.repository.update(
            task_id,
            {
                "status": TaskStatus.FAILED,
                "failed_at": utc_now(),
                "exp_penalty": exp_penalty,
                "is_exp_processed": True,
            },
        )

    async def reschedule_task(self, task_id: int, new_due_date: datetime) -> Task | None:
        task = await self.repository.get_by_id(task_id)
        if not task:
            return None

        if task.reschedule_count >= task.max_reschedules:
            return None

        return await self.repository.update(
            task_id,
            {
                "status": TaskStatus.RESCHEDULED,
                "due_date": to_naive_utc(new_due_date),
                "reschedule_count": task.reschedule_count + 1,
                "last_rescheduled_at": utc_now(),
            },
        )

    async def delete_task(self, task_id: int) -> bool:
        return await self.repository.delete(task_id)
