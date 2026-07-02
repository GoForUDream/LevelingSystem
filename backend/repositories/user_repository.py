from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.sql import func
from models.user import User


class UserRepository:
    def __init__(self, db: AsyncSession, auto_commit: bool = True):
        self.db = db
        self.auto_commit = auto_commit

    async def _finish_write(self):
        if self.auto_commit:
            await self.db.commit()
        else:
            await self.db.flush()

    async def create(self, user: User) -> User:
        self.db.add(user)
        await self._finish_write()
        await self.db.refresh(user)
        return user

    async def get_by_id(self, user_id: int) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_id_for_update(self, user_id: int) -> User | None:
        result = await self.db.execute(
            select(User).where(User.id == user_id).with_for_update()
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_google_id(self, google_id: str) -> User | None:
        result = await self.db.execute(select(User).where(User.google_id == google_id))
        return result.scalar_one_or_none()

    async def get_all(self) -> list[User]:
        result = await self.db.execute(select(User).order_by(User.created_at.desc()))
        return list(result.scalars().all())

    async def update(self, user_id: int, data: dict) -> User | None:
        data["updated_at"] = func.now()
        await self.db.execute(update(User).where(User.id == user_id).values(**data))
        await self._finish_write()
        return await self.get_by_id(user_id)

    async def delete(self, user_id: int) -> bool:
        result = await self.db.execute(
            delete(User).where(User.id == user_id).returning(User.id)
        )
        await self._finish_write()
        return result.scalar_one_or_none() is not None
