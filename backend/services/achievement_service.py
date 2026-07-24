from datetime import datetime, date, timedelta
from repositories.achievement_repository import AchievementRepository
from constants.achievements import ACHIEVEMENT_THRESHOLDS, CATEGORY_TO_STAT_FIELD
import logging

logger = logging.getLogger(__name__)


class AchievementService:
    def __init__(self, repository: AchievementRepository):
        self.repository = repository

    async def on_task_completed(
        self, user_id: int, created_at: datetime, completed_at: datetime,
        timezone_offset: int = 0,
    ) -> list[str]:
        stats = await self.repository.get_or_create_stats(user_id, for_update=True)

        updates: dict = {
            "total_tasks_completed": stats.total_tasks_completed + 1,
        }

        local_completed = completed_at + timedelta(minutes=timezone_offset)
        hour = local_completed.hour

        # Early bird: completed before 7 AM local time
        if hour < 7:
            updates["early_bird_count"] = stats.early_bird_count + 1

        # Night owl: completed at or after 10 PM local time
        if hour >= 22:
            updates["night_owl_count"] = stats.night_owl_count + 1

        # Speed: completed within 30 minutes of creation
        if created_at and completed_at:
            # Ensure both are naive UTC for comparison
            c = created_at.replace(tzinfo=None) if created_at.tzinfo else created_at
            f = completed_at.replace(tzinfo=None) if completed_at.tzinfo else completed_at
            delta = (f - c).total_seconds()
            if 0 <= delta <= 1800:  # 30 minutes
                updates["instant_completions"] = stats.instant_completions + 1

        today = local_completed.date()

        current_streak = stats.current_streak
        longest_streak = stats.longest_streak
        longest_inactive = stats.longest_inactive_days

        if stats.last_active_date is None:
            # First ever task
            current_streak = 1
        elif stats.last_active_date == today:
            # Same day, no streak change
            pass
        elif stats.last_active_date == today - timedelta(days=1):
            # Yesterday — extend streak
            current_streak += 1
        else:
            # Gap — record inactive days for comeback, reset streak
            gap_days = (today - stats.last_active_date).days
            if gap_days > longest_inactive:
                longest_inactive = gap_days
            current_streak = 1

        if current_streak > longest_streak:
            longest_streak = current_streak

        updates["current_streak"] = current_streak
        updates["longest_streak"] = longest_streak
        updates["longest_inactive_days"] = longest_inactive
        updates["last_active_date"] = today

        updated_stats = await self.repository.update_stats(user_id, updates)
        categories = {"Tasks", "Streak", "Comeback"}
        if "early_bird_count" in updates:
            categories.add("Early Bird")
        if "night_owl_count" in updates:
            categories.add("Night Owl")
        if "instant_completions" in updates:
            categories.add("Speed")
        return await self._check_and_unlock(user_id, updated_stats, categories)

    async def on_goal_completed(self, user_id: int) -> list[str]:
        stats = await self.repository.get_or_create_stats(user_id, for_update=True)
        updates = {
            "total_goals_completed": stats.total_goals_completed + 1,
        }
        updated_stats = await self.repository.update_stats(user_id, updates)
        return await self._check_and_unlock(user_id, updated_stats, {"Goals"})

    async def on_goal_uncompleted(self, user_id: int) -> None:
        stats = await self.repository.get_or_create_stats(user_id, for_update=True)
        new_count = max(0, stats.total_goals_completed - 1)
        await self.repository.update_stats(
            user_id, {"total_goals_completed": new_count}
        )

    async def on_perfect_day(self, user_id: int, perfect_date: date) -> list[str]:
        """
        Record a perfect day for the user.
        Only increments if this date hasn't already been counted.
        """
        stats = await self.repository.get_or_create_stats(user_id, for_update=True)

        # Check if we already counted this date
        if stats.last_perfect_day_date == perfect_date:
            logger.info(f"User {user_id}: perfect day for {perfect_date} already counted, skipping")
            return []

        updates = {
            "perfect_days": stats.perfect_days + 1,
            "last_perfect_day_date": perfect_date,
        }
        updated_stats = await self.repository.update_stats(user_id, updates)
        return await self._check_and_unlock(
            user_id,
            updated_stats,
            {"Perfect Day"},
        )

    async def _check_and_unlock(
        self,
        user_id: int,
        stats,
        categories: set[str] | None = None,
    ) -> list[str]:
        already_unlocked = await self.repository.get_unlocked_badge_ids(user_id)
        newly_unlocked: list[str] = []

        stat_values = {
            "longest_streak": stats.longest_streak,
            "total_tasks_completed": stats.total_tasks_completed,
            "total_goals_completed": stats.total_goals_completed,
            "early_bird_count": stats.early_bird_count,
            "night_owl_count": stats.night_owl_count,
            "longest_inactive_days": stats.longest_inactive_days,
            "perfect_days": stats.perfect_days,
            "instant_completions": stats.instant_completions,
        }

        for category, badges in ACHIEVEMENT_THRESHOLDS.items():
            if categories is not None and category not in categories:
                continue
            stat_field = CATEGORY_TO_STAT_FIELD[category]
            current_value = stat_values[stat_field]

            for badge in badges:
                badge_id = badge["badge_id"]
                if badge_id in already_unlocked:
                    continue
                if current_value >= badge["threshold"]:
                    unlocked = await self.repository.unlock_badge(user_id, badge_id)
                    if not unlocked:
                        continue
                    already_unlocked.add(badge_id)
                    newly_unlocked.append(badge_id)
                    logger.info(
                        f"User {user_id} unlocked badge '{badge_id}' "
                        f"({stat_field}={current_value} >= {badge['threshold']})"
                    )

        return newly_unlocked
