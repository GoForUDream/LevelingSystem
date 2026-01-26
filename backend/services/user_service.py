from repositories.user_repository import UserRepository
from models.user import User
from schemas.user import UserCreate, UserUpdate


class UserService:
    # EXP thresholds for leveling up
    def _exp_for_level(self, level: int) -> int:
        # Each level requires more EXP: level * 100
        return level * 100

    def __init__(self, repository: UserRepository):
        self.repository = repository

    async def create_user(self, data: UserCreate) -> User:
        user = User(
            email=data.email,
            name=data.name,
            avatar_url=data.avatar_url,
            google_id=data.google_id,
        )
        return await self.repository.create(user)

    async def get_user(self, user_id: int) -> User | None:
        return await self.repository.get_by_id(user_id)

    async def get_user_by_email(self, email: str) -> User | None:
        return await self.repository.get_by_email(email)

    async def get_user_by_google_id(self, google_id: str) -> User | None:
        return await self.repository.get_by_google_id(google_id)

    async def get_or_create_by_google(
        self, google_id: str, email: str, name: str, avatar_url: str | None = None
    ) -> User:
        user = await self.repository.get_by_google_id(google_id)
        if user:
            return user

        user = User(
            email=email,
            name=name,
            avatar_url=avatar_url,
            google_id=google_id,
        )
        return await self.repository.create(user)

    async def get_all_users(self) -> list[User]:
        return await self.repository.get_all()

    async def update_user(self, user_id: int, data: UserUpdate) -> User | None:
        update_data = data.model_dump(exclude_unset=True)
        return await self.repository.update(user_id, update_data)

    async def add_exp(self, user_id: int, exp: int) -> User | None:
        user = await self.repository.get_by_id(user_id)
        if not user:
            return None

        new_total_exp = user.total_exp + exp
        new_level = user.level

        # Check for level ups
        while new_total_exp >= self._exp_for_level(new_level):
            new_total_exp -= self._exp_for_level(new_level)
            new_level += 1

        return await self.repository.update(
            user_id,
            {"total_exp": user.total_exp + exp, "level": new_level},
        )

    async def delete_user(self, user_id: int) -> bool:
        return await self.repository.delete(user_id)
