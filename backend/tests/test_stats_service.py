from datetime import date, datetime
from typing import cast

import pytest

from models.user import User
from repositories.stats_repository import (
    ComparisonAggregateRow,
    Granularity,
    HeatmapRow,
    HourlyAggregateRow,
    SnapshotRow,
    StatsRepository,
    TimelineAggregateRow,
)
from services import stats_service
from services.stats_service import StatsService


class FakeStatsRepository:
    def __init__(self) -> None:
        self.period_call: (
            tuple[int, datetime, datetime, int, Granularity] | None
        ) = None

    async def get_period_aggregates(
        self,
        user_id: int,
        start: datetime,
        end: datetime,
        timezone_offset: int,
        granularity: Granularity,
    ) -> tuple[list[TimelineAggregateRow], list[HourlyAggregateRow]]:
        self.period_call = (user_id, start, end, timezone_offset, granularity)
        return (
            [
                {
                    "bucket": date(2026, 7, 24),
                    "outcome": "COMPLETED",
                    "count": 2,
                    "net_exp": 200,
                },
                {
                    "bucket": date(2026, 7, 24),
                    "outcome": "FAILED",
                    "count": 1,
                    "net_exp": -50,
                },
                {
                    "bucket": date(2026, 7, 24),
                    "outcome": "OVERDUE",
                    "count": 1,
                    "net_exp": -100,
                },
                {
                    "bucket": date(2026, 7, 24),
                    "outcome": "CANCELLED",
                    "count": 1,
                    "net_exp": -20,
                },
            ],
            [{"hour": 6, "count": 2}],
        )

    async def get_snapshot(self, user_id: int) -> SnapshotRow:
        return {
            "todo": 3,
            "in_progress": 2,
            "on_hold": 1,
            "rescheduled": 4,
            "current_streak": 5,
            "longest_streak": 7,
        }

    async def get_heatmap(
        self,
        user_id: int,
        start: datetime,
        end: datetime,
        timezone_offset: int,
    ) -> list[HeatmapRow]:
        return [{"date": date(2026, 7, 24), "count": 2}]

    async def get_comparison_windows(
        self,
        user_id: int,
        windows: dict[str, tuple[datetime, datetime]],
    ) -> dict[str, ComparisonAggregateRow]:
        return {}


def make_user(timezone_offset: int = 420) -> User:
    return User(
        id=7,
        name="Stats User",
        timezone_offset=timezone_offset,
        created_at=datetime(2026, 1, 1),
    )


@pytest.mark.asyncio
async def test_stats_uses_exact_local_calendar_days_and_actual_penalties(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        stats_service,
        "utc_now",
        lambda: datetime(2026, 7, 24, 18, 30),
    )
    repository = FakeStatsRepository()
    result = await StatsService(cast(StatsRepository, repository)).get_stats(
        make_user(),
        "7d",
    )

    assert repository.period_call is not None
    _, start, end, offset, granularity = repository.period_call
    assert start == datetime(2026, 7, 18, 17, 0)
    assert end == datetime(2026, 7, 24, 18, 30)
    assert offset == 420
    assert granularity == "day"
    assert len(result.timeline) == 7
    assert result.outcome_breakdown.failed == 1
    assert result.outcome_breakdown.overdue == 1
    assert result.outcome_breakdown.cancelled == 1
    assert result.net_exp_change == 30
    assert result.pending_snapshot.todo == 3


@pytest.mark.asyncio
async def test_explicit_zero_timezone_is_not_replaced_by_user_offset(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        stats_service,
        "utc_now",
        lambda: datetime(2026, 7, 24, 18, 30),
    )
    repository = FakeStatsRepository()
    await StatsService(cast(StatsRepository, repository)).get_stats(
        make_user(timezone_offset=-300),
        "30d",
        timezone_offset=0,
    )

    assert repository.period_call is not None
    assert repository.period_call[1] == datetime(2026, 6, 25)
    assert repository.period_call[3] == 0


@pytest.mark.asyncio
async def test_all_time_timeline_is_monthly_and_heatmap_is_bounded(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        stats_service,
        "utc_now",
        lambda: datetime(2026, 7, 24, 12),
    )
    repository = FakeStatsRepository()
    user = make_user()
    user.created_at = datetime(2020, 1, 1)

    result = await StatsService(cast(StatsRepository, repository)).get_stats(
        user,
        "all",
    )

    assert result.timeline_granularity == "month"
    assert len(result.activity_heatmap) == 365
