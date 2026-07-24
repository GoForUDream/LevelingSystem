from datetime import datetime, timedelta
from types import SimpleNamespace

import pytest
from fastapi import HTTPException, Response

from pagination import decode_cursor, encode_cursor
from resolvers import goal_resolver, task_resolver


def test_cursor_round_trip_and_validation():
    encoded = encode_cursor({"due_date": "2026-07-24T12:00:00", "id": 42})
    assert decode_cursor(encoded, {"due_date", "id"}) == {
        "due_date": "2026-07-24T12:00:00",
        "id": 42,
    }
    with pytest.raises(ValueError):
        decode_cursor("not-a-cursor", {"due_date", "id"})


def test_task_cursor_parses_tied_ordering_fields():
    encoded = encode_cursor({"due_date": "2026-07-24T12:00:00", "id": 42})
    assert task_resolver._parse_task_cursor(encoded, "due_date") == (
        datetime(2026, 7, 24, 12),
        42,
    )


@pytest.mark.asyncio
async def test_paginated_range_rejects_more_than_32_days():
    with pytest.raises(HTTPException) as exc:
        await task_resolver.get_tasks_by_range_page(
            start_date=datetime(2026, 1, 1),
            end_date=datetime(2026, 2, 3, 0, 0, 1),
            limit=100,
            cursor=None,
            current_user=SimpleNamespace(id=1),
            service=SimpleNamespace(),
        )
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_legacy_task_route_rejects_oversized_collection():
    class Service:
        async def get_all_tasks(self, user_id, limit):
            assert user_id == 7
            assert limit == 1001
            return [object()] * 1001

    with pytest.raises(HTTPException) as exc:
        await task_resolver.get_tasks(
            response=Response(),
            current_user=SimpleNamespace(id=7),
            service=Service(),
        )
    assert exc.value.status_code == 413


@pytest.mark.asyncio
async def test_goal_page_returns_counts_and_cursor():
    created = datetime(2026, 7, 24, 12)
    goals = [
        SimpleNamespace(
            id=index,
            user_id=7,
            title=f"Goal {index}",
            description=None,
            rank="C",
            start_date=created,
            end_date=created + timedelta(days=30),
            is_done=False,
            created_at=created,
            updated_at=created,
        )
        for index in (2, 1)
    ]

    class Service:
        async def get_goal_summary_page(self, user_id, limit, cursor):
            assert (user_id, limit, cursor) == (7, 1, None)
            return [(goals[0], 4, 3), (goals[1], 1, 0)]

    page = await goal_resolver.get_goal_page(
        limit=1,
        cursor=None,
        current_user=SimpleNamespace(id=7),
        service=Service(),
    )
    assert page.has_more is True
    assert page.items[0].incomplete_task_count == 1
    assert page.next_cursor is not None


@pytest.mark.asyncio
async def test_milestones_are_paginated_and_user_scoped():
    created = datetime(2026, 7, 24, 12)
    rows = [
        SimpleNamespace(
            title="Recurring",
            total_count=5,
            completed_count=3,
            first_created_at=created,
        ),
        SimpleNamespace(
            title="Later",
            total_count=1,
            completed_count=0,
            first_created_at=created + timedelta(seconds=1),
        ),
    ]

    class Service:
        async def get_goal_for_user(self, goal_id, user_id):
            assert (goal_id, user_id) == (9, 7)
            return object()

        async def get_milestone_page(self, goal_id, user_id, limit, cursor):
            assert (goal_id, user_id, limit, cursor) == (9, 7, 1, None)
            return rows

    page = await goal_resolver.get_goal_milestone_page(
        goal_id=9,
        limit=1,
        cursor=None,
        current_user=SimpleNamespace(id=7),
        service=Service(),
    )
    assert page.items[0].title == "Recurring"
    assert page.items[0].completed_count == 3
    assert page.has_more is True
