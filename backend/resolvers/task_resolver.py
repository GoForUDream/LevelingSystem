from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from repositories.task_repository import TaskRepository
from repositories.user_repository import UserRepository
from repositories.achievement_repository import AchievementRepository
from repositories.goal_repository import GoalRepository
from services.task_service import TaskService
from services.user_service import UserService
from services.achievement_service import AchievementService
from schemas.task import TaskCreate, TaskPageResponse, TaskUpdate, TaskResponse
from pagination import decode_cursor, encode_cursor
from middleware.auth_middleware import get_current_user
from models.user import User
from models.task import TaskStatus
from datetime import date, datetime, timezone

router = APIRouter(prefix="/api/tasks", tags=["tasks"])
LEGACY_RESULT_LIMIT = 1000


def _parse_task_cursor(cursor: str | None, date_key: str) -> tuple[datetime, int] | None:
    if cursor is None:
        return None
    try:
        payload = decode_cursor(cursor, {date_key, "id"})
        parsed_date = datetime.fromisoformat(str(payload[date_key]))
        if parsed_date.tzinfo is not None:
            parsed_date = parsed_date.astimezone(timezone.utc).replace(tzinfo=None)
        return parsed_date, int(payload["id"])
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=400, detail="Invalid cursor") from exc


def _set_legacy_headers(response: Response, replacement: str) -> None:
    response.headers["Deprecation"] = "true"
    response.headers["Link"] = f'<{replacement}>; rel="successor-version"'


async def ensure_goal_owned(db: AsyncSession, goal_id: int | None, user_id: int) -> None:
    if goal_id is None:
        return
    if await GoalRepository(db).get_by_id_for_user(goal_id, user_id) is None:
        raise HTTPException(status_code=400, detail="Invalid goal")


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
    db: AsyncSession = Depends(get_db),
    service: TaskService = Depends(get_task_service),
):
    await ensure_goal_owned(db, data.goal_id, current_user.id)
    task = await service.create_task(data, current_user.id)
    return task


@router.get("", response_model=list[TaskResponse], deprecated=True)
async def get_tasks(
    response: Response,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    _set_legacy_headers(response, "/api/tasks/page")
    tasks = await service.get_all_tasks(current_user.id, LEGACY_RESULT_LIMIT + 1)
    if len(tasks) > LEGACY_RESULT_LIMIT:
        raise HTTPException(
            status_code=413,
            detail="Task collection is too large; use /api/tasks/page",
            headers={"Link": '</api/tasks/page>; rel="successor-version"'},
        )
    return tasks


@router.get("/page", response_model=TaskPageResponse)
async def get_task_page(
    limit: int = Query(default=100, ge=1, le=200),
    cursor: str | None = None,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    parsed_cursor = _parse_task_cursor(cursor, "created_at")
    tasks = await service.get_task_page(current_user.id, limit, parsed_cursor)
    has_more = len(tasks) > limit
    items = tasks[:limit]
    next_cursor = None
    if has_more and items:
        last = items[-1]
        next_cursor = encode_cursor(
            {"created_at": last.created_at.isoformat(), "id": last.id}
        )
    serialized_items = [
        TaskResponse.model_validate(item, from_attributes=True) for item in items
    ]
    return TaskPageResponse(
        items=serialized_items, next_cursor=next_cursor, has_more=has_more
    )


@router.get("/range/page", response_model=TaskPageResponse)
async def get_tasks_by_range_page(
    start_date: datetime,
    end_date: datetime,
    limit: int = Query(default=100, ge=1, le=200),
    cursor: str | None = None,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    if end_date < start_date:
        raise HTTPException(status_code=400, detail="end_date cannot be before start_date")
    if (end_date - start_date).total_seconds() > 32 * 24 * 60 * 60:
        raise HTTPException(status_code=400, detail="Date range cannot exceed 32 days")
    parsed_cursor = _parse_task_cursor(cursor, "due_date")
    tasks = await service.get_tasks_by_date_range(
        current_user.id, start_date, end_date, limit, parsed_cursor
    )
    has_more = len(tasks) > limit
    items = tasks[:limit]
    next_cursor = None
    if has_more and items:
        last = items[-1]
        if last.due_date is None:
            raise HTTPException(
                status_code=500, detail="Task range returned an invalid cursor row"
            )
        next_cursor = encode_cursor(
            {"due_date": last.due_date.isoformat(), "id": last.id}
        )
    serialized_items = [
        TaskResponse.model_validate(item, from_attributes=True) for item in items
    ]
    return TaskPageResponse(
        items=serialized_items, next_cursor=next_cursor, has_more=has_more
    )


@router.get("/range", response_model=list[TaskResponse], deprecated=True)
async def get_tasks_by_range(
    response: Response,
    start_date: datetime,
    end_date: datetime,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
):
    _set_legacy_headers(response, "/api/tasks/range/page")
    if end_date < start_date:
        raise HTTPException(status_code=400, detail="end_date cannot be before start_date")
    if (end_date - start_date).days > 400:
        raise HTTPException(status_code=400, detail="Date range cannot exceed 400 days")
    tasks = await service.get_tasks_by_date_range(
        current_user.id, start_date, end_date, LEGACY_RESULT_LIMIT
    )
    if len(tasks) > LEGACY_RESULT_LIMIT:
        raise HTTPException(
            status_code=413,
            detail="Task range is too large; use /api/tasks/range/page",
            headers={"Link": '</api/tasks/range/page>; rel="successor-version"'},
        )
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
    db: AsyncSession = Depends(get_db),
    service: TaskService = Depends(get_task_service),
):
    task = await service.get_task(task_id)
    if not task or task.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status in {
        TaskStatus.COMPLETED,
        TaskStatus.CANCELLED,
        TaskStatus.FAILED,
        TaskStatus.OVERDUE,
    }:
        raise HTTPException(status_code=400, detail="Terminal tasks cannot be edited")
    if "goal_id" in data.model_fields_set:
        await ensure_goal_owned(db, data.goal_id, current_user.id)
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
    if task.status not in {
        TaskStatus.TODO,
        TaskStatus.ON_HOLD,
        TaskStatus.RESCHEDULED,
    }:
        raise HTTPException(status_code=400, detail="Task cannot be started from its current status")
    updated = await service.start_task(task_id)
    return updated


@router.post("/{task_id}/complete")
async def complete_task(
    task_id: int,
    local_hour: int | None = Query(default=None, ge=0, le=23),
    local_date: date | None = None,
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
            current_user.id,
            task.created_at,
            updated.completed_at,
            local_hour,
            local_date.isoformat() if local_date else None,
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
    if task.status in {
        TaskStatus.COMPLETED,
        TaskStatus.CANCELLED,
        TaskStatus.FAILED,
        TaskStatus.OVERDUE,
    }:
        raise HTTPException(status_code=400, detail="Terminal tasks cannot be rescheduled")
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
