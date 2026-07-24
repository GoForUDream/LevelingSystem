from repositories.goal_repository import GoalMilestoneRecord, GoalRepository
from models.goal import Goal
from models.task import Task
from schemas.goal import GoalCreate, GoalUpdate
from datetime import datetime, timezone


def to_naive_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


class GoalService:
    def __init__(self, repository: GoalRepository):
        self.repository = repository

    async def create_goal(self, data: GoalCreate, user_id: int) -> Goal:
        goal = Goal(
            user_id=user_id,
            title=data.title,
            description=data.description,
            rank=data.rank,
            start_date=to_naive_utc(data.start_date),
            end_date=to_naive_utc(data.end_date),
        )
        return await self.repository.create(goal)

    async def get_goal(self, goal_id: int) -> Goal | None:
        return await self.repository.get_by_id(goal_id)

    async def get_all_goals(
        self, user_id: int, limit: int | None = None
    ) -> list[Goal]:
        return await self.repository.get_all(user_id, limit)

    async def get_goal_summary_page(
        self,
        user_id: int,
        limit: int,
        cursor: tuple[datetime, int] | None = None,
    ) -> list[tuple[Goal, int, int]]:
        return await self.repository.get_summary_page(user_id, limit, cursor)

    async def get_milestone_page(
        self,
        goal_id: int,
        user_id: int,
        limit: int,
        cursor: tuple[datetime, str] | None = None,
    ) -> list[GoalMilestoneRecord]:
        return await self.repository.get_milestone_page(
            goal_id, user_id, limit, cursor
        )

    async def get_goal_for_user(self, goal_id: int, user_id: int) -> Goal | None:
        return await self.repository.get_by_id_for_user(goal_id, user_id)

    async def has_incomplete_tasks(self, goal_id: int, user_id: int) -> bool:
        return await self.repository.has_incomplete_tasks(goal_id, user_id)

    async def get_tasks_for_goal(
        self, goal_id: int, user_id: int, limit: int | None = None
    ) -> list[Task]:
        return await self.repository.get_tasks_for_goal(goal_id, user_id, limit)

    async def get_tasks_for_goals(
        self, goal_ids: list[int], user_id: int, limit: int | None = None
    ) -> list[Task]:
        return await self.repository.get_tasks_for_goals(goal_ids, user_id, limit)

    async def update_goal(self, goal_id: int, data: GoalUpdate) -> Goal | None:
        update_data = data.model_dump(exclude_unset=True)
        if "start_date" in update_data:
            update_data["start_date"] = to_naive_utc(update_data["start_date"])
        if "end_date" in update_data:
            update_data["end_date"] = to_naive_utc(update_data["end_date"])
        return await self.repository.update(goal_id, update_data)

    async def toggle_done(self, goal_id: int) -> Goal | None:
        goal = await self.repository.get_by_id(goal_id)
        if not goal:
            return None
        return await self.repository.update(goal_id, {"is_done": not goal.is_done})

    async def delete_goal(self, goal_id: int) -> bool:
        return await self.repository.delete(goal_id)
