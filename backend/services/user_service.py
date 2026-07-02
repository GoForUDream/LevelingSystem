import random
from repositories.user_repository import UserRepository
from models.user import User
from schemas.user import UserCreate, UserUpdate
from constants.levels import get_level_from_exp, get_level_progress


class UserService:
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
            # Update avatar and name on each login
            if avatar_url or name:
                update_data = {}
                if avatar_url:
                    update_data["avatar_url"] = avatar_url
                if name:
                    update_data["name"] = name
                updated_user = await self.repository.update(user.id, update_data)
                if updated_user is not None:
                    user = updated_user
            return user

        user = User(
            email=email,
            name=name,
            avatar_url=avatar_url,
            google_id=google_id,
        )
        return await self.repository.create(user)

    async def create_guest_user(self) -> User:
        guest_number = random.randint(1000, 9999)
        user = User(
            name=f"Guest #{guest_number}",
            is_guest=True,
        )
        return await self.repository.create(user)

    async def link_google_account(
        self,
        guest_user_id: int,
        google_id: str,
        email: str,
        name: str,
        avatar_url: str | None,
    ) -> User | None:
        """Link a Google account to an existing guest user. Returns None if google_id already taken or guest not found."""
        existing = await self.repository.get_by_google_id(google_id)
        if existing:
            return None
        guest = await self.repository.get_by_id(guest_user_id)
        if not guest:
            return None
        return await self.repository.update(
            guest_user_id,
            {
                "google_id": google_id,
                "email": email,
                "name": name,
                "avatar_url": avatar_url,
                "is_guest": False,
            },
        )

    async def get_all_users(self) -> list[User]:
        return await self.repository.get_all()

    async def update_user(self, user_id: int, data: UserUpdate | dict) -> User | None:
        if isinstance(data, dict):
            update_data = data
        else:
            update_data = data.model_dump(exclude_unset=True)
        return await self.repository.update(user_id, update_data)

    async def add_exp(self, user_id: int, exp: int) -> User | None:
        user = await self.repository.get_by_id_for_update(user_id)
        if not user:
            return None

        new_total_exp = max(0, user.total_exp + exp)
        new_level = get_level_from_exp(new_total_exp)

        return await self.repository.update(
            user_id,
            {"total_exp": new_total_exp, "level": new_level},
        )

    def get_user_progress(self, user: User) -> dict:
        """Get detailed level progress for a user."""
        return get_level_progress(user.total_exp)

    async def delete_user(self, user_id: int) -> bool:
        return await self.repository.delete(user_id)
