from pydantic import BaseModel, ConfigDict, Field, model_validator
from datetime import datetime
from models.goal import GoalRank
from schemas.task import TaskResponse


class GoalCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=4000)
    rank: GoalRank = GoalRank.C
    start_date: datetime
    end_date: datetime

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")
        return self


class GoalUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=4000)
    rank: GoalRank | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None


class GoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
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
    tasks: list[TaskResponse] = Field(default_factory=list)
