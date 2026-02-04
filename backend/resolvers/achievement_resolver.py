from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from repositories.achievement_repository import AchievementRepository
from schemas.achievement import AchievementsResponse, AchievementStatsResponse, UnlockedBadgeResponse
from middleware.auth_middleware import get_current_user
from models.user import User

router = APIRouter(prefix="/api/achievements", tags=["achievements"])


@router.get("", response_model=AchievementsResponse)
async def get_achievements(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = AchievementRepository(db)
    stats = await repo.get_or_create_stats(current_user.id)
    unlocked = await repo.get_unlocked(current_user.id)

    return AchievementsResponse(
        stats=AchievementStatsResponse.model_validate(stats, from_attributes=True),
        unlocked=[
            UnlockedBadgeResponse.model_validate(a, from_attributes=True)
            for a in unlocked
        ],
    )
