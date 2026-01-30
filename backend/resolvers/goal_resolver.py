from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from repositories.goal_repository import GoalRepository
from services.goal_service import GoalService
from schemas.goal import GoalCreate, GoalUpdate, GoalResponse
from schemas.task import TaskResponse
from middleware.auth_middleware import get_current_user
from models.user import User

router = APIRouter(prefix="/api/goals", tags=["goals"])


def get_goal_service(db: AsyncSession = Depends(get_db)) -> GoalService:
    repository = GoalRepository(db)
    return GoalService(repository)


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


@router.post("/{goal_id}/toggle", response_model=GoalResponse)
async def toggle_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
):
    goal = await service.get_goal(goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    updated = await service.toggle_done(goal_id)
    tasks = await service.get_tasks_for_goal(goal_id)
    resp = GoalResponse.model_validate(updated, from_attributes=True)
    resp.tasks = [TaskResponse.model_validate(t, from_attributes=True) for t in tasks]
    return resp
