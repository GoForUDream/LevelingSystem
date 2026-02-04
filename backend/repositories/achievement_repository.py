from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.sql import func
from models.achievement import UserAchievementStats, UserAchievement


class AchievementRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_stats(self, user_id: int) -> UserAchievementStats:
        result = await self.db.execute(
            select(UserAchievementStats).where(UserAchievementStats.user_id == user_id)
        )
        stats = result.scalar_one_or_none()
        if stats is None:
            stats = UserAchievementStats(user_id=user_id)
            self.db.add(stats)
            await self.db.commit()
            await self.db.refresh(stats)
        return stats

    async def update_stats(self, user_id: int, data: dict) -> UserAchievementStats:
        data["updated_at"] = func.now()
        await self.db.execute(
            update(UserAchievementStats)
            .where(UserAchievementStats.user_id == user_id)
            .values(**data)
        )
        await self.db.commit()
        result = await self.db.execute(
            select(UserAchievementStats).where(UserAchievementStats.user_id == user_id)
        )
        return result.scalar_one()

    async def get_unlocked_badge_ids(self, user_id: int) -> set[str]:
        result = await self.db.execute(
            select(UserAchievement.badge_id).where(UserAchievement.user_id == user_id)
        )
        return set(result.scalars().all())

    async def get_unlocked(self, user_id: int) -> list[UserAchievement]:
        result = await self.db.execute(
            select(UserAchievement)
            .where(UserAchievement.user_id == user_id)
            .order_by(UserAchievement.unlocked_at)
        )
        return list(result.scalars().all())

    async def unlock_badge(self, user_id: int, badge_id: str) -> UserAchievement:
        achievement = UserAchievement(user_id=user_id, badge_id=badge_id)
        self.db.add(achievement)
        await self.db.commit()
        await self.db.refresh(achievement)
        return achievement
