import logging
from collections import defaultdict
from datetime import datetime, timezone
from time import perf_counter
from typing import Any

from sqlalchemy import case, func, select, text, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from constants.levels import get_level_from_exp
from db.database import async_session
from models.scheduler import SchedulerState
from models.task import Task, TaskStatus
from models.user import User
from repositories.achievement_repository import AchievementRepository
from repositories.task_repository import TaskRepository
from services.achievement_service import AchievementService
from services.task_service import TaskService

logger = logging.getLogger(__name__)

OVERDUE_JOB = "overdue_checker"
PERFECT_DAY_JOB = "perfect_day_checker"
OVERDUE_LOCK_ID = 73194201
DEFAULT_BATCH_SIZE = 500


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


async def _record_state(
    db: AsyncSession,
    job_name: str,
    *,
    started_at: datetime | None = None,
    succeeded_at: datetime | None = None,
    duration_ms: int | None = None,
    processed_count: int | None = None,
    error: str | None = None,
) -> None:
    values: dict[str, Any] = {"job_name": job_name}
    updates: dict[str, Any] = {}
    if started_at is not None:
        values["last_started_at"] = started_at
        updates["last_started_at"] = started_at
        updates["last_error"] = None
    if succeeded_at is not None:
        values["last_succeeded_at"] = succeeded_at
        updates["last_succeeded_at"] = succeeded_at
    if duration_ms is not None:
        values["last_duration_ms"] = duration_ms
        updates["last_duration_ms"] = duration_ms
    if processed_count is not None:
        values["last_processed_count"] = processed_count
        updates["last_processed_count"] = processed_count
    if error is not None:
        values["last_error"] = error[:2000]
        updates["last_error"] = error[:2000]
    await db.execute(
        insert(SchedulerState)
        .values(**values)
        .on_conflict_do_update(
            index_elements=["job_name"],
            set_=updates,
        )
    )


async def mark_overdue_tasks(batch_size: int = DEFAULT_BATCH_SIZE) -> int:
    started_at = utc_now()
    started_clock = perf_counter()
    processed_count = 0

    async with async_session() as db:
        await _record_state(db, OVERDUE_JOB, started_at=started_at)
        await db.commit()
        lock_result = await db.execute(
            select(func.pg_try_advisory_lock(OVERDUE_LOCK_ID))
        )
        if not lock_result.scalar():
            await db.rollback()
            logger.info("Overdue check skipped because another scheduler owns the lock.")
            return 0

        try:
            while True:
                now = utc_now()
                result = await db.execute(
                    select(Task)
                    .where(
                        Task.due_date < now,
                        Task.status.in_([TaskStatus.TODO, TaskStatus.IN_PROGRESS]),
                        Task.is_exp_processed.is_(False),
                    )
                    .order_by(Task.due_date, Task.id)
                    .limit(batch_size)
                    .with_for_update(skip_locked=True)
                )
                tasks = list(result.scalars().all())
                if not tasks:
                    await db.rollback()
                    break

                task_ids = [task.id for task in tasks]
                penalties: dict[int, int] = defaultdict(int)
                next_tasks: list[Task] = []
                task_service = TaskService(TaskRepository(db, auto_commit=False))
                for task in tasks:
                    penalties[task.user_id] += task.exp_value
                    if task.is_recurring:
                        next_task = task_service.build_next_recurring_task(
                            task,
                            after=now,
                        )
                        if next_task is not None:
                            next_tasks.append(next_task)

                await db.execute(
                    update(Task)
                    .where(Task.id.in_(task_ids))
                    .values(
                        status=TaskStatus.OVERDUE,
                        exp_penalty=Task.exp_value,
                        is_exp_processed=True,
                        failed_at=now,
                        updated_at=now,
                    )
                )
                if next_tasks:
                    db.add_all(next_tasks)

                if penalties:
                    user_ids = list(penalties)
                    penalty_case = case(
                        *[
                            (User.id == user_id, penalty)
                            for user_id, penalty in penalties.items()
                        ],
                        else_=0,
                    )
                    new_exp = func.greatest(0, User.total_exp - penalty_case)
                    updated_users = (
                        await db.execute(
                            update(User)
                            .where(User.id.in_(user_ids))
                            .values(total_exp=new_exp, updated_at=now)
                            .returning(User.id, User.total_exp)
                        )
                    ).all()
                    levels = {
                        user_id: get_level_from_exp(total_exp)
                        for user_id, total_exp in updated_users
                    }
                    if levels:
                        await db.execute(
                            update(User)
                            .where(User.id.in_(list(levels)))
                            .values(
                                level=case(
                                    *[
                                        (User.id == user_id, level)
                                        for user_id, level in levels.items()
                                    ],
                                    else_=User.level,
                                )
                            )
                        )

                await db.commit()
                processed_count += len(tasks)
                logger.info(
                    "Overdue batch complete: tasks=%s recurring=%s total=%s",
                    len(tasks),
                    len(next_tasks),
                    processed_count,
                )

            duration_ms = int((perf_counter() - started_clock) * 1000)
            await _record_state(
                db,
                OVERDUE_JOB,
                succeeded_at=utc_now(),
                duration_ms=duration_ms,
                processed_count=processed_count,
                error="",
            )
            await db.commit()
            logger.info(
                "Overdue check complete: processed=%s duration_ms=%s",
                processed_count,
                duration_ms,
            )
            return processed_count
        except Exception as exc:
            await db.rollback()
            await _record_state(
                db,
                OVERDUE_JOB,
                duration_ms=int((perf_counter() - started_clock) * 1000),
                processed_count=processed_count,
                error=str(exc),
            )
            await db.commit()
            logger.exception("Overdue check failed after %s tasks", processed_count)
            raise
        finally:
            await db.execute(select(func.pg_advisory_unlock(OVERDUE_LOCK_ID)))
            await db.commit()


async def check_perfect_days() -> int:
    started_at = utc_now()
    started_clock = perf_counter()
    processed_count = 0
    query = text(
        """
        WITH candidate_days AS (
            SELECT
                users.id AS user_id,
                (tasks.due_date + users.timezone_offset * INTERVAL '1 minute')::date
                    AS local_due_date,
                (CAST(:now AS timestamp) + users.timezone_offset * INTERVAL '1 minute')::date
                    AS local_today,
                bool_and(tasks.status = 'COMPLETED') AS all_completed
            FROM users
            JOIN tasks ON tasks.user_id = users.id
            WHERE tasks.due_date >= CAST(:now AS timestamp) - INTERVAL '3 days'
              AND tasks.due_date < CAST(:now AS timestamp) + INTERVAL '1 day'
            GROUP BY users.id, local_due_date, local_today
        )
        SELECT user_id, local_due_date
        FROM candidate_days
        WHERE local_due_date = local_today - 1
          AND all_completed
        ORDER BY user_id
        """
    )

    async with async_session() as db:
        await _record_state(db, PERFECT_DAY_JOB, started_at=started_at)
        await db.commit()
        try:
            rows = (await db.execute(query, {"now": started_at})).all()
            service = AchievementService(
                AchievementRepository(db, auto_commit=False)
            )
            for row in rows:
                await service.on_perfect_day(row.user_id, row.local_due_date)
                processed_count += 1
                if processed_count % 100 == 0:
                    await db.commit()
            await db.commit()
            duration_ms = int((perf_counter() - started_clock) * 1000)
            await _record_state(
                db,
                PERFECT_DAY_JOB,
                succeeded_at=utc_now(),
                duration_ms=duration_ms,
                processed_count=processed_count,
                error="",
            )
            await db.commit()
            logger.info(
                "Perfect-day check complete: users=%s duration_ms=%s",
                processed_count,
                duration_ms,
            )
            return processed_count
        except Exception as exc:
            await db.rollback()
            await _record_state(
                db,
                PERFECT_DAY_JOB,
                duration_ms=int((perf_counter() - started_clock) * 1000),
                processed_count=processed_count,
                error=str(exc),
            )
            await db.commit()
            logger.exception("Perfect-day check failed")
            raise
