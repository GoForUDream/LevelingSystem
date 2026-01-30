from pydantic import BaseModel
from datetime import datetime
from models.goal import GoalRank
from schemas.task import TaskResponse


class GoalCreate(BaseModel):
    title: str
    description: str | None = None
    rank: GoalRank = GoalRank.C
    start_date: datetime
    end_date: datetime


class GoalUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    rank: GoalRank | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    is_done: bool | None = None


class GoalResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: str | None
    rank: GoalRank
    start_date: datetime
    end_date: datetime
    is_done: bool
    created_at: datetime
    updated_at: datetime
    tasks: list[TaskResponse] = []

    class Config:
        from_attributes = True
