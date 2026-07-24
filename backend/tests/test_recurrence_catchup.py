from datetime import datetime
from typing import Any, cast

from models.task import RecurrenceType, Task, TaskImportance
from repositories.task_repository import TaskRepository
from services.task_service import TaskService


def recurring_task(
    kind: RecurrenceType,
    due: datetime,
    **overrides: Any,
) -> Task:
    values: dict[str, Any] = {
        "user_id": 1,
        "title": "Recurring",
        "importance": TaskImportance.MEDIUM,
        "exp_value": 50,
        "due_date": due,
        "is_recurring": True,
        "recurrence_type": kind,
    }
    values.update(overrides)
    return Task(**values)


def test_daily_recurrence_skips_historical_occurrences():
    service = TaskService(repository=cast(TaskRepository, None))
    task = recurring_task(RecurrenceType.DAILY, datetime(2026, 1, 1, 9))

    next_task = service.build_next_recurring_task(
        task,
        after=datetime(2026, 7, 24, 12),
    )

    assert next_task is not None
    assert next_task.due_date == datetime(2026, 7, 25, 9)


def test_weekly_recurrence_returns_first_allowed_future_day():
    service = TaskService(repository=cast(TaskRepository, None))
    task = recurring_task(
        RecurrenceType.WEEKLY,
        datetime(2026, 1, 5, 9),
        recurrence_days="[0, 4]",
    )

    next_task = service.build_next_recurring_task(
        task,
        after=datetime(2026, 7, 24, 12),
    )

    assert next_task is not None
    assert next_task.due_date == datetime(2026, 7, 27, 9)


def test_custom_recurrence_keeps_interval_alignment():
    service = TaskService(repository=cast(TaskRepository, None))
    task = recurring_task(
        RecurrenceType.CUSTOM,
        datetime(2026, 1, 1, 9),
        recurrence_interval=3,
    )

    next_task = service.build_next_recurring_task(
        task,
        after=datetime(2026, 1, 10, 9),
    )

    assert next_task is not None
    assert next_task.due_date == datetime(2026, 1, 13, 9)
