from pydantic import BaseModel, ConfigDict
from datetime import datetime, date


class AchievementStatsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    total_tasks_completed: int
    total_goals_completed: int
    early_bird_count: int
    night_owl_count: int
    instant_completions: int
    perfect_days: int
    current_streak: int
    longest_streak: int
    last_active_date: date | None
    longest_inactive_days: int



class UnlockedBadgeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    badge_id: str
    unlocked_at: datetime



class AchievementsResponse(BaseModel):
    stats: AchievementStatsResponse
    unlocked: list[UnlockedBadgeResponse]
