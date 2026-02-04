from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from repositories.task_repository import TaskRepository
from repositories.user_repository import UserRepository
from repositories.achievement_repository import AchievementRepository
from services.task_service import TaskService
from services.user_service import UserService
from services.achievement_service import AchievementService
from schemas.task import TaskCreate, TaskUpdate, TaskResponse
from middleware.auth_middleware import get_current_user
from models.user import User
from datetime import datetime

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def get_task_service(db: AsyncSession = Depends(get_db)) -> TaskService:
    repository = TaskRepository(db)
    return TaskService(repository)


def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    repository = UserRepository(db)
    return UserService(repository)


def get_achievement_service(db: AsyncSession = Depends(get_db)) -> AchievementService:
    repository = AchievementRepository(db)
    return AchievementService(repository)


@router.post("", response_model=TaskResponse)
async def create_task(
    data: TaskCreate,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    task = await service.create_task(data, current_user.id)
    return task


@router.get("", response_model=list[TaskResponse])
async def get_tasks(
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    tasks = await service.get_all_tasks(current_user.id)
    return tasks


@router.get("/range", response_model=list[TaskResponse])
async def get_tasks_by_range(
    start_date: datetime,
    end_date: datetime,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    tasks = await service.get_tasks_by_date_range(current_user.id, start_date, end_date)
    return tasks


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    task = await service.get_task(task_id)
    if not task or task.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    task = await service.get_task(task_id)
    if not task or task.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    updated = await service.update_task(task_id, data)
    return updated


@router.post("/{task_id}/start", response_model=TaskResponse)
async def start_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    task = await service.get_task(task_id)
    if not task or task.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    updated = await service.start_task(task_id)
    return updated


@router.post("/{task_id}/complete")
async def complete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
    user_service: UserService = Depends(get_user_service),
    achievement_service: AchievementService = Depends(get_achievement_service),
):
    task = await service.get_task(task_id)
    if not task or task.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Task already completed")
    updated = await service.complete_task(task_id)
    # Add EXP to user
    await user_service.add_exp(current_user.id, updated.exp_earned)
    # Track achievement
    new_badges = await achievement_service.on_task_completed(
        current_user.id, task.created_at, updated.completed_at
    )
    task_data = TaskResponse.model_validate(updated, from_attributes=True).model_dump()
    task_data["new_badges"] = new_badges
    return task_data


@router.post("/{task_id}/cancel", response_model=TaskResponse)
async def cancel_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
    user_service: UserService = Depends(get_user_service),
):
    task = await service.get_task(task_id)
    if not task or task.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Cannot cancel a completed task")
    if task.status == "CANCELLED":
        raise HTTPException(status_code=400, detail="Task already cancelled")
    updated = await service.cancel_task(task_id)
    # Deduct 20% EXP penalty from user
    if updated.exp_penalty:
        await user_service.add_exp(current_user.id, -updated.exp_penalty)
    return updated


@router.post("/{task_id}/fail", response_model=TaskResponse)
async def fail_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    task = await service.get_task(task_id)
    if not task or task.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    updated = await service.fail_task(task_id)
    return updated


@router.post("/{task_id}/reschedule", response_model=TaskResponse)
async def reschedule_task(
    task_id: int,
    new_due_date: datetime,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    task = await service.get_task(task_id)
    if not task or task.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    updated = await service.reschedule_task(task_id, new_due_date)
    if not updated:
        raise HTTPException(status_code=400, detail="Max reschedules reached")
    return updated


@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    task = await service.get_task(task_id)
    if not task or task.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    await service.delete_task(task_id)
    return {"message": "Task deleted"}
