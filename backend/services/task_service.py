from repositories.task_repository import TaskRepository
from models.task import Task, TaskStatus, TaskImportance, RecurrenceType
from schemas.task import TaskCreate, TaskUpdate
from constants.levels import IMPORTANCE_EXP
from datetime import datetime, timezone, timedelta
import json
import calendar


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
        recurrence_days_str = None
        if data.recurrence_days is not None:
            recurrence_days_str = json.dumps(data.recurrence_days)
        task = Task(
            user_id=user_id,
            title=data.title,
            description=data.description,
            status=TaskStatus.TODO,
            importance=data.importance,
            exp_value=self._calculate_exp_value(data.importance),
            due_date=due_date,
            original_due_date=due_date,
            category_id=data.category_id,
            project_id=data.project_id,
            goal_id=data.goal_id,
            is_recurring=data.is_recurring,
            recurrence_type=data.recurrence_type,
            recurrence_days=recurrence_days_str,
            recurrence_interval=data.recurrence_interval,
            recurrence_end_date=to_naive_utc(data.recurrence_end_date),
        )
        return await self.repository.create(task)

    async def get_task(self, task_id: int) -> Task | None:
        return await self.repository.get_by_id(task_id)

    async def get_all_tasks(
        self, user_id: int | None = None, limit: int | None = None
    ) -> list[Task]:
        return await self.repository.get_all(user_id, limit)

    async def get_task_page(
        self,
        user_id: int,
        limit: int,
        cursor: tuple[datetime, int] | None = None,
    ) -> list[Task]:
        return await self.repository.get_page(user_id, limit, cursor)

    async def get_tasks_by_date_range(
        self,
        user_id: int,
        start_date: datetime,
        end_date: datetime,
        limit: int | None = None,
        cursor: tuple[datetime, int] | None = None,
    ) -> list[Task]:
        return await self.repository.get_by_date_range(
            user_id, start_date, end_date, limit, cursor
        )

    async def update_task(self, task_id: int, data: TaskUpdate) -> Task | None:
        update_data = data.model_dump(exclude_unset=True)

        # Recalculate exp_value if importance changes
        if "importance" in update_data:
            update_data["exp_value"] = self._calculate_exp_value(update_data["importance"])

        # Convert timezone-aware datetime to naive UTC
        if "due_date" in update_data:
            update_data["due_date"] = to_naive_utc(update_data["due_date"])

        # Convert recurrence_days list to JSON string
        if "recurrence_days" in update_data:
            days = update_data["recurrence_days"]
            update_data["recurrence_days"] = json.dumps(days) if days is not None else None

        return await self.repository.update(task_id, update_data)

    async def start_task(self, task_id: int) -> Task | None:
        return await self.repository.update(
            task_id,
            {"status": TaskStatus.IN_PROGRESS, "started_at": utc_now()},
        )

    def _get_next_occurrence(self, task: Task) -> datetime | None:
        """Calculate the next occurrence date based on recurrence settings."""
        current_due = task.due_date or utc_now()

        if task.recurrence_type == RecurrenceType.DAILY:
            next_date = current_due + timedelta(days=1)

        elif task.recurrence_type == RecurrenceType.WEEKLY:
            days = json.loads(task.recurrence_days) if task.recurrence_days else []
            if not days:
                return None
            current_weekday = current_due.weekday()
            # Find next matching weekday after current
            sorted_days = sorted(days)
            next_day = None
            for d in sorted_days:
                if d > current_weekday:
                    next_day = d
                    break
            if next_day is not None:
                delta = next_day - current_weekday
            else:
                # Wrap to next week
                delta = 7 - current_weekday + sorted_days[0]
            next_date = current_due + timedelta(days=delta)

        elif task.recurrence_type == RecurrenceType.MONTHLY:
            parsed = json.loads(task.recurrence_days) if task.recurrence_days else []
            if not isinstance(parsed, list):
                parsed = [int(parsed)]
            if not parsed:
                return None

            current_day = current_due.day
            current_max = calendar.monthrange(current_due.year, current_due.month)[1]

            # Resolve -1 (last day) to actual day for the current month
            def resolve_day(d: int, max_day: int) -> int:
                return max_day if d == -1 else min(d, max_day)

            # Find next matching day in the current month
            resolved_current = sorted(set(resolve_day(d, current_max) for d in parsed))
            next_target = None
            for d in resolved_current:
                if d > current_day:
                    next_target = d
                    break

            if next_target is not None:
                next_date = current_due.replace(day=next_target)
            else:
                # Wrap to next month
                year = current_due.year
                month = current_due.month + 1
                if month > 12:
                    month = 1
                    year += 1
                next_max = calendar.monthrange(year, month)[1]
                resolved_next = sorted(set(resolve_day(d, next_max) for d in parsed))
                next_date = current_due.replace(year=year, month=month, day=resolved_next[0])

        elif task.recurrence_type == RecurrenceType.CUSTOM:
            interval = task.recurrence_interval or 1
            next_date = current_due + timedelta(days=interval)

        else:
            return None

        # Check end date
        if task.recurrence_end_date and next_date > task.recurrence_end_date:
            return None

        return next_date

    async def _create_next_recurring_task(self, task: Task) -> Task | None:
        """Create the next occurrence of a recurring task."""
        next_date = self._get_next_occurrence(task)
        if next_date is None:
            return None

        new_task = Task(
            user_id=task.user_id,
            title=task.title,
            description=task.description,
            status=TaskStatus.TODO,
            importance=task.importance,
            exp_value=task.exp_value,
            due_date=next_date,
            original_due_date=next_date,
            category_id=task.category_id,
            project_id=task.project_id,
            goal_id=task.goal_id,
            is_recurring=True,
            recurrence_type=task.recurrence_type,
            recurrence_days=task.recurrence_days,
            recurrence_interval=task.recurrence_interval,
            recurrence_end_date=task.recurrence_end_date,
        )
        return await self.repository.create(new_task)

    async def complete_task(self, task_id: int) -> Task | None:
        task = await self.repository.get_by_id(task_id)
        if not task:
            return None

        exp_earned = task.exp_value
        completed_task = await self.repository.update(
            task_id,
            {
                "status": TaskStatus.COMPLETED,
                "completed_at": utc_now(),
                "exp_earned": exp_earned,
                "is_exp_processed": True,
            },
        )

        # If recurring, create next occurrence
        if task.is_recurring:
            await self._create_next_recurring_task(task)

        return completed_task

    async def cancel_task(self, task_id: int, skip_only: bool = False) -> Task | None:
        task = await self.repository.get_by_id(task_id)
        if not task:
            return None

        exp_penalty = task.exp_value // 5  # 20% penalty
        cancelled_task = await self.repository.update(
            task_id,
            {
                "status": TaskStatus.CANCELLED,
                "exp_penalty": exp_penalty,
                "is_exp_processed": True,
            },
        )

        # For recurring tasks with skip_only, spawn the next occurrence
        if skip_only and task.is_recurring:
            await self._create_next_recurring_task(task)

        return cancelled_task

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
