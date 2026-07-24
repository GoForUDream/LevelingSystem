from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from repositories.goal_repository import GoalRepository
from repositories.achievement_repository import AchievementRepository
from services.goal_service import GoalService
from services.achievement_service import AchievementService
from schemas.goal import (
    GoalCreate,
    GoalMilestonePageResponse,
    GoalMilestoneResponse,
    GoalPageResponse,
    GoalResponse,
    GoalSummaryResponse,
    GoalUpdate,
)
from schemas.task import TaskResponse
from pagination import decode_cursor, encode_cursor
from middleware.auth_middleware import get_current_user
from models.user import User

router = APIRouter(prefix="/api/goals", tags=["goals"])
LEGACY_RESULT_LIMIT = 1000


def _parse_goal_cursor(
    cursor: str | None, date_key: str, tie_key: str
) -> tuple[datetime, int | str] | None:
    if cursor is None:
        return None
    try:
        payload = decode_cursor(cursor, {date_key, tie_key})
        tie_value: int | str = (
            int(payload[tie_key]) if tie_key == "id" else str(payload[tie_key])
        )
        parsed_date = datetime.fromisoformat(str(payload[date_key]))
        if parsed_date.tzinfo is not None:
            parsed_date = parsed_date.astimezone(timezone.utc).replace(tzinfo=None)
        return parsed_date, tie_value
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=400, detail="Invalid cursor") from exc


def _set_legacy_headers(response: Response, replacement: str) -> None:
    response.headers["Deprecation"] = "true"
    response.headers["Link"] = f'<{replacement}>; rel="successor-version"'


async def _get_legacy_goal_tasks(
    service: GoalService, goal_id: int, user_id: int
):
    tasks = await service.get_tasks_for_goal(
        goal_id, user_id, LEGACY_RESULT_LIMIT + 1
    )
    if len(tasks) > LEGACY_RESULT_LIMIT:
        raise HTTPException(
            status_code=413,
            detail="Goal task collection is too large; use the milestone endpoint",
            headers={
                "Link": (
                    f'</api/goals/{goal_id}/milestones/page>; '
                    'rel="successor-version"'
                )
            },
        )
    return tasks


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


@router.get("", response_model=list[GoalResponse], deprecated=True)
async def get_goals(
    response: Response,
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
):
    _set_legacy_headers(response, "/api/goals/page")
    goals = await service.get_all_goals(current_user.id, LEGACY_RESULT_LIMIT + 1)
    if len(goals) > LEGACY_RESULT_LIMIT:
        raise HTTPException(
            status_code=413,
            detail="Goal collection is too large; use /api/goals/page",
            headers={"Link": '</api/goals/page>; rel="successor-version"'},
        )
    tasks = await service.get_tasks_for_goals(
        [goal.id for goal in goals], current_user.id, LEGACY_RESULT_LIMIT + 1
    )
    if len(tasks) > LEGACY_RESULT_LIMIT:
        raise HTTPException(
            status_code=413,
            detail="Goal task collection is too large; use paginated goal endpoints",
            headers={"Link": '</api/goals/page>; rel="successor-version"'},
        )
    tasks_by_goal: dict[int, list] = {}
    for task in tasks:
        if task.goal_id is not None:
            tasks_by_goal.setdefault(task.goal_id, []).append(task)
    result = []
    for goal in goals:
        resp = GoalResponse.model_validate(goal, from_attributes=True)
        resp.tasks = [
            TaskResponse.model_validate(t, from_attributes=True)
            for t in tasks_by_goal.get(goal.id, [])
        ]
        result.append(resp)
    return result


@router.get("/page", response_model=GoalPageResponse)
async def get_goal_page(
    limit: int = Query(default=25, ge=1, le=100),
    cursor: str | None = None,
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
):
    parsed = _parse_goal_cursor(cursor, "created_at", "id")
    typed_cursor = None if parsed is None else (parsed[0], int(parsed[1]))
    rows = await service.get_goal_summary_page(
        current_user.id, limit, typed_cursor
    )
    has_more = len(rows) > limit
    page_rows = rows[:limit]
    items = []
    for goal, total_count, completed_count in page_rows:
        total = int(total_count or 0)
        completed = int(completed_count or 0)
        items.append(
            GoalSummaryResponse(
                **GoalResponse.model_validate(goal, from_attributes=True).model_dump(
                    exclude={"tasks"}
                ),
                total_task_count=total,
                completed_task_count=completed,
                incomplete_task_count=max(total - completed, 0),
            )
        )
    next_cursor = None
    if has_more and page_rows:
        last_goal = page_rows[-1][0]
        next_cursor = encode_cursor(
            {"created_at": last_goal.created_at.isoformat(), "id": last_goal.id}
        )
    return GoalPageResponse(items=items, next_cursor=next_cursor, has_more=has_more)


@router.get("/{goal_id}/milestones/page", response_model=GoalMilestonePageResponse)
async def get_goal_milestone_page(
    goal_id: int,
    limit: int = Query(default=50, ge=1, le=100),
    cursor: str | None = None,
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
):
    goal = await service.get_goal_for_user(goal_id, current_user.id)
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    parsed = _parse_goal_cursor(cursor, "created_at", "title")
    typed_cursor = None if parsed is None else (parsed[0], str(parsed[1]))
    rows = await service.get_milestone_page(
        goal_id, current_user.id, limit, typed_cursor
    )
    has_more = len(rows) > limit
    page_rows = rows[:limit]
    items = [
        GoalMilestoneResponse(
            title=row.title,
            total_count=int(row.total_count),
            completed_count=int(row.completed_count or 0),
        )
        for row in page_rows
    ]
    next_cursor = None
    if has_more and page_rows:
        last = page_rows[-1]
        next_cursor = encode_cursor(
            {"created_at": last.first_created_at.isoformat(), "title": last.title}
        )
    return GoalMilestonePageResponse(
        items=items, next_cursor=next_cursor, has_more=has_more
    )


@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service),
):
    goal = await service.get_goal(goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    tasks = await _get_legacy_goal_tasks(service, goal_id, current_user.id)
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
    tasks = await _get_legacy_goal_tasks(service, goal_id, current_user.id)
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
        if not was_done:
            if await service.has_incomplete_tasks(goal_id, current_user.id):
                raise HTTPException(
                    status_code=400, detail="Complete all goal tasks first"
                )
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

    tasks = await _get_legacy_goal_tasks(service, goal_id, current_user.id)
    resp = GoalResponse.model_validate(updated, from_attributes=True)
    resp.tasks = [TaskResponse.model_validate(t, from_attributes=True) for t in tasks]
    resp_data = resp.model_dump()
    resp_data["new_badges"] = new_badges
    return resp_data
