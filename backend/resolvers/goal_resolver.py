from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from repositories.goal_repository import GoalRepository
from repositories.achievement_repository import AchievementRepository
from services.goal_service import GoalService
from services.achievement_service import AchievementService
from schemas.goal import GoalCreate, GoalUpdate, GoalResponse
from schemas.task import TaskResponse
from middleware.auth_middleware import get_current_user
from models.user import User

router = APIRouter(prefix="/api/goals", tags=["goals"])


def get_goal_service(db: AsyncSession = Depends(get_db)) -> GoalService:
    repository = GoalRepository(db)
    return GoalService(repository)


def get_achievement_service(db: AsyncSession = Depends(get_db)) -> AchievementService:
    repository = AchievementRepository(db)
    return AchievementService(repository)


@router.post("", response_model=GoalResponse)
async def create_goal(
    data: GoalCreate,
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
):
    goal = await service.create_goal(data, current_user.id)
    return GoalResponse.model_validate(goal, from_attributes=True)


@router.get("", response_model=list[GoalResponse])
async def get_goals(
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
):
    goals = await service.get_all_goals(current_user.id)
    result = []
    for goal in goals:
        tasks = await service.get_tasks_for_goal(goal.id)
        resp = GoalResponse.model_validate(goal, from_attributes=True)
        resp.tasks = [TaskResponse.model_validate(t, from_attributes=True) for t in tasks]
        result.append(resp)
    return result


@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
):
    goal = await service.get_goal(goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    tasks = await service.get_tasks_for_goal(goal_id)
    resp = GoalResponse.model_validate(goal, from_attributes=True)
    resp.tasks = [TaskResponse.model_validate(t, from_attributes=True) for t in tasks]
    return resp


@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: int,
    data: GoalUpdate,
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
):
    goal = await service.get_goal(goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    updated = await service.update_goal(goal_id, data)
    tasks = await service.get_tasks_for_goal(goal_id)
    resp = GoalResponse.model_validate(updated, from_attributes=True)
    resp.tasks = [TaskResponse.model_validate(t, from_attributes=True) for t in tasks]
    return resp


@router.delete("/{goal_id}")
async def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
):
    goal = await service.get_goal(goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    await service.delete_goal(goal_id)
    return {"message": "Goal deleted"}


@router.post("/{goal_id}/toggle")
async def toggle_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    goal_repository = GoalRepository(db, auto_commit=False)
    achievement_repository = AchievementRepository(db, auto_commit=False)
    service = GoalService(goal_repository)
    achievement_service = AchievementService(achievement_repository)

    goal = await goal_repository.get_by_id_for_update(goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    was_done = goal.is_done

    try:
        updated = await service.toggle_done(goal_id)
        if updated is None:
            raise HTTPException(status_code=404, detail="Goal not found")
        new_badges: list[str] = []
        if not was_done and updated.is_done:
            new_badges = await achievement_service.on_goal_completed(current_user.id)
        elif was_done and not updated.is_done:
            await achievement_service.on_goal_uncompleted(current_user.id)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    tasks = await service.get_tasks_for_goal(goal_id)
    resp = GoalResponse.model_validate(updated, from_attributes=True)
    resp.tasks = [TaskResponse.model_validate(t, from_attributes=True) for t in tasks]
    resp_data = resp.model_dump()
    resp_data["new_badges"] = new_badges
    return resp_data
