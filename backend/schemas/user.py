from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class UserCreate(BaseModel):
    email: str | None = None
    name: str = Field(min_length=1, max_length=255)
    avatar_url: str | None = Field(default=None, max_length=2048)
    google_id: str | None = None


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    avatar_url: str | None = Field(default=None, max_length=2048)
    is_active: bool | None = None
    language: str | None = None


class LevelProgress(BaseModel):
    level: int
    total_exp: int
    current_level_exp: int
    exp_to_next_level: int
    progress_percent: float
    rank_title: str
    rank_theme: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str | None
    name: str
    avatar_url: str | None
    google_id: str | None
    is_guest: bool
    language: str
    total_exp: int
    level: int
    is_active: bool
    created_at: datetime
    updated_at: datetime



class UserWithProgress(UserResponse):
    level_progress: LevelProgress
