from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from repositories.task_repository import TaskRepository
from services.task_service import TaskService
from schemas.task import TaskCreate, TaskUpdate, TaskResponse
from datetime import datetime

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def get_task_service(db: AsyncSession = Depends(get_db)) -> TaskService:
    repository = TaskRepository(db)
    return TaskService(repository)


@router.post("", response_model=TaskResponse)
async def create_task(
    data: TaskCreate, service: TaskService = Depends(get_task_service)
):
    task = await service.create_task(data)
    return task


@router.get("", response_model=list[TaskResponse])
async def get_tasks(
    user_id: int | None = None, service: TaskService = Depends(get_task_service)
):
    tasks = await service.get_all_tasks(user_id)
    return tasks


@router.get("/range", response_model=list[TaskResponse])
async def get_tasks_by_range(
    user_id: int,
    start_date: datetime,
    end_date: datetime,
    service: TaskService = Depends(get_task_service),
):
    tasks = await service.get_tasks_by_date_range(user_id, start_date, end_date)
    return tasks


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, service: TaskService = Depends(get_task_service)):
    task = await service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int, data: TaskUpdate, service: TaskService = Depends(get_task_service)
):
    task = await service.update_task(task_id, data)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/{task_id}/start", response_model=TaskResponse)
async def start_task(task_id: int, service: TaskService = Depends(get_task_service)):
    task = await service.start_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(task_id: int, service: TaskService = Depends(get_task_service)):
    task = await service.complete_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/{task_id}/fail", response_model=TaskResponse)
async def fail_task(task_id: int, service: TaskService = Depends(get_task_service)):
    task = await service.fail_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/{task_id}/reschedule", response_model=TaskResponse)
async def reschedule_task(
    task_id: int, new_due_date: datetime, service: TaskService = Depends(get_task_service)
):
    task = await service.reschedule_task(task_id, new_due_date)
    if not task:
        raise HTTPException(
            status_code=400, detail="Task not found or max reschedules reached"
        )
    return task


@router.delete("/{task_id}")
async def delete_task(task_id: int, service: TaskService = Depends(get_task_service)):
    deleted = await service.delete_task(task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}
