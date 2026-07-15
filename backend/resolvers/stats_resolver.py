from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Literal
from db.database import get_db
from repositories.stats_repository import StatsRepository
from repositories.user_repository import UserRepository
from repositories.achievement_repository import AchievementRepository
from services.stats_service import StatsService
from schemas.stats import StatsResponse
from middleware.auth_middleware import get_current_user
from models.user import User

router = APIRouter(prefix="/api/stats", tags=["stats"])


def get_stats_service(db: AsyncSession = Depends(get_db)) -> StatsService:
    stats_repo = StatsRepository(db)
    user_repo = UserRepository(db)
    achievement_repo = AchievementRepository(db)
    return StatsService(stats_repo, user_repo, achievement_repo)


@router.get("", response_model=StatsResponse)
async def get_stats(
    period: Literal["7d", "30d", "90d", "all"] = "30d",
    timezone_offset: int = Query(default=0, ge=-840, le=840),
    current_user: User = Depends(get_current_user),
    service: StatsService = Depends(get_stats_service),
):
    return await service.get_stats(current_user.id, period, timezone_offset)
