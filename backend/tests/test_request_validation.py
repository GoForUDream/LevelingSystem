from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from models.task import RecurrenceType
from resolvers import task_resolver
from schemas.goal import GoalCreate
from schemas.task import TaskCreate


def test_task_cannot_set_status_directly():
    with pytest.raises(ValidationError):
        TaskCreate(title="Injected completion", status="COMPLETED")


def test_goal_end_date_must_follow_start_date():
    start = datetime(2026, 7, 15, 10, 0)
    with pytest.raises(ValidationError):
        GoalCreate(title="Invalid goal", start_date=start, end_date=start - timedelta(days=1))


def test_weekly_recurrence_days_are_bounded():
    with pytest.raises(ValidationError):
        TaskCreate(
            title="Invalid recurrence",
            is_recurring=True,
            recurrence_type=RecurrenceType.WEEKLY,
            recurrence_days=[7],
        )


@pytest.mark.asyncio
async def test_task_rejects_goal_owned_by_another_user(monkeypatch):
    class FakeGoalRepository:
        def __init__(self, db):
            self.db = db

        async def get_by_id_for_user(self, goal_id, user_id):
            return None

    monkeypatch.setattr(task_resolver, "GoalRepository", FakeGoalRepository)

    with pytest.raises(HTTPException) as exc:
        await task_resolver.ensure_goal_owned(object(), goal_id=99, user_id=1)

    assert exc.value.status_code == 400
