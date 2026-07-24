from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.sql import func
from models.achievement import UserAchievementStats, UserAchievement


class AchievementRepository:
    def __init__(self, db: AsyncSession, auto_commit: bool = True):
        self.db = db
        self.auto_commit = auto_commit

    async def _finish_write(self):
        if self.auto_commit:
            await self.db.commit()
        else:
            await self.db.flush()

    async def get_or_create_stats(
        self,
        user_id: int,
        *,
        for_update: bool = False,
    ) -> UserAchievementStats:
        await self.db.execute(
            insert(UserAchievementStats)
            .values(user_id=user_id)
            .on_conflict_do_nothing(index_elements=["user_id"])
        )
        await self._finish_write()
        query = select(UserAchievementStats).where(
            UserAchievementStats.user_id == user_id
        )
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query)
        return result.scalar_one()

    async def update_stats(self, user_id: int, data: dict) -> UserAchievementStats:
        data["updated_at"] = func.now()
        await self.db.execute(
            update(UserAchievementStats)
            .where(UserAchievementStats.user_id == user_id)
            .values(**data)
        )
        await self._finish_write()
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

    async def unlock_badge(self, user_id: int, badge_id: str) -> bool:
        stmt = (
            insert(UserAchievement)
            .values(user_id=user_id, badge_id=badge_id)
            .on_conflict_do_nothing(index_elements=["user_id", "badge_id"])
            .returning(UserAchievement.id)
        )
        result = await self.db.execute(stmt)
        await self._finish_write()
        return result.scalar_one_or_none() is not None
