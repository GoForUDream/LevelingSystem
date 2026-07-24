from datetime import datetime
from types import SimpleNamespace
from typing import Any, cast

import pytest

from repositories.achievement_repository import AchievementRepository
from services.achievement_service import AchievementService


class FakeAchievementRepository:
    def __init__(self):
        self.lock_requested = False
        self.updates: dict[str, Any] | None = None
        self.stats = SimpleNamespace(
            total_tasks_completed=0,
            total_goals_completed=0,
            early_bird_count=0,
            night_owl_count=0,
            instant_completions=0,
            perfect_days=0,
            current_streak=0,
            longest_streak=0,
            last_active_date=None,
            longest_inactive_days=0,
        )

    async def get_or_create_stats(
        self,
        user_id: int,
        *,
        for_update: bool = False,
    ) -> SimpleNamespace:
        self.lock_requested = for_update
        return self.stats

    async def update_stats(
        self,
        user_id: int,
        updates: dict[str, Any],
    ) -> SimpleNamespace:
        self.updates = updates
        for key, value in updates.items():
            setattr(self.stats, key, value)
        return self.stats

    async def get_unlocked_badge_ids(self, user_id: int) -> set[str]:
        return set()

    async def unlock_badge(self, user_id: int, badge_id: str) -> bool:
        return False


@pytest.mark.asyncio
async def test_completion_uses_server_timestamp_and_user_timezone():
    repository = FakeAchievementRepository()
    service = AchievementService(cast(AchievementRepository, repository))

    await service.on_task_completed(
        user_id=1,
        created_at=datetime(2026, 7, 23, 21, 45),
        completed_at=datetime(2026, 7, 23, 22, 0),
        timezone_offset=420,
    )

    assert repository.lock_requested
    assert repository.updates is not None
    assert repository.updates["early_bird_count"] == 1
    assert "night_owl_count" not in repository.updates
    assert repository.updates["instant_completions"] == 1
    assert repository.updates["last_active_date"].isoformat() == "2026-07-24"
