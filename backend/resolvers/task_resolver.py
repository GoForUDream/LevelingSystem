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
from models.task import TaskStatus
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
    local_hour: int | None = None,
    local_date: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task_repository = TaskRepository(db, auto_commit=False)
    user_repository = UserRepository(db, auto_commit=False)
    achievement_repository = AchievementRepository(db, auto_commit=False)
    service = TaskService(task_repository)
    user_service = UserService(user_repository)
    achievement_service = AchievementService(achievement_repository)

    task = await task_repository.get_by_id_for_update(task_id)
    if not task or task.user_id != current_user.id:
        await db.rollback()
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status == TaskStatus.COMPLETED:
        task_data = TaskResponse.model_validate(task, from_attributes=True).model_dump()
        task_data["new_badges"] = []
        await db.rollback()
        return task_data
    if task.status in {TaskStatus.CANCELLED, TaskStatus.FAILED, TaskStatus.OVERDUE}:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Cannot complete a {task.status.value.lower()} task")

    try:
        updated = await service.complete_task(task_id)
        if updated is None or updated.completed_at is None:
            raise HTTPException(status_code=400, detail="Task could not be completed")
        await user_service.add_exp(current_user.id, updated.exp_earned or 0)
        new_badges = await achievement_service.on_task_completed(
            current_user.id, task.created_at, updated.completed_at, local_hour, local_date
        )
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    task_data = TaskResponse.model_validate(updated, from_attributes=True).model_dump()
    task_data["new_badges"] = new_badges
    return task_data


@router.post("/{task_id}/cancel", response_model=TaskResponse)
async def cancel_task(
    task_id: int,
    skip_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task_repository = TaskRepository(db, auto_commit=False)
    user_repository = UserRepository(db, auto_commit=False)
    service = TaskService(task_repository)
    user_service = UserService(user_repository)

    task = await task_repository.get_by_id_for_update(task_id)
    if not task or task.user_id != current_user.id:
        await db.rollback()
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status == TaskStatus.CANCELLED:
        task_data = TaskResponse.model_validate(task, from_attributes=True).model_dump()
        await db.rollback()
        return task_data
    if task.status == TaskStatus.COMPLETED:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Cannot cancel a completed task")
    if task.status in {TaskStatus.FAILED, TaskStatus.OVERDUE}:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Cannot cancel a {task.status.value.lower()} task")

    try:
        updated = await service.cancel_task(task_id, skip_only=skip_only)
        if updated is None:
            raise HTTPException(status_code=400, detail="Task could not be cancelled")
        if updated.exp_penalty:
            await user_service.add_exp(current_user.id, -updated.exp_penalty)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    return updated


@router.post("/{task_id}/fail", response_model=TaskResponse)
async def fail_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task_repository = TaskRepository(db, auto_commit=False)
    user_repository = UserRepository(db, auto_commit=False)
    service = TaskService(task_repository)
    user_service = UserService(user_repository)

    task = await task_repository.get_by_id_for_update(task_id)
    if not task or task.user_id != current_user.id:
        await db.rollback()
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status == TaskStatus.FAILED:
        task_data = TaskResponse.model_validate(task, from_attributes=True).model_dump()
        await db.rollback()
        return task_data
    if task.status in {TaskStatus.COMPLETED, TaskStatus.CANCELLED, TaskStatus.OVERDUE}:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Cannot fail a {task.status.value.lower()} task")

    try:
        updated = await service.fail_task(task_id)
        if updated is None:
            raise HTTPException(status_code=400, detail="Task could not be failed")
        if updated.exp_penalty:
            await user_service.add_exp(current_user.id, -updated.exp_penalty)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

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
