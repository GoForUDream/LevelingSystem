from sqlalchemy import select, update
from sqlalchemy.sql import func
from models.task import Task, TaskStatus
from models.user import User
from constants.levels import get_level_from_exp
from repositories.task_repository import TaskRepository
from services.task_service import TaskService
from db.database import async_session
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


async def mark_overdue_tasks():
    """
    Midnight job: find all tasks with due_date before today that are still
    TODO or IN_PROGRESS, mark them OVERDUE, deduct 100% EXP from users,
    and spawn next occurrences for recurring tasks.
    """
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    async with async_session() as db:
        # Find incomplete tasks whose due date has passed
        result = await db.execute(
            select(Task).where(
                Task.due_date < today_start,
                Task.status.in_([TaskStatus.TODO, TaskStatus.IN_PROGRESS]),
                Task.is_exp_processed == False,
            )
        )
        overdue_tasks = list(result.scalars().all())

        if not overdue_tasks:
            logger.info("Overdue check: no overdue tasks found.")
            return

        logger.info(f"Overdue check: found {len(overdue_tasks)} overdue task(s).")

        # Group penalties by user
        user_penalties: dict[int, int] = {}
        task_ids: list[int] = []

        for task in overdue_tasks:
            task_ids.append(task.id)
            penalty = task.exp_value  # 100% penalty
            user_penalties[task.user_id] = user_penalties.get(task.user_id, 0) + penalty

        # Bulk-update all overdue tasks
        await db.execute(
            update(Task)
            .where(Task.id.in_(task_ids))
            .values(
                status=TaskStatus.OVERDUE,
                exp_penalty=Task.exp_value,  # 100% of task EXP
                is_exp_processed=True,
                failed_at=func.now(),
                updated_at=func.now(),
            )
        )

        # Spawn next occurrences for recurring tasks
        task_service = TaskService(TaskRepository(db))
        recurring_count = 0
        for task in overdue_tasks:
            if task.is_recurring:
                next_task = await task_service._create_next_recurring_task(task)
                if next_task:
                    recurring_count += 1
                    logger.info(
                        f"Recurring task '{task.title}' (id={task.id}): "
                        f"next occurrence created for {next_task.due_date}"
                    )

        if recurring_count:
            logger.info(f"Overdue check: spawned {recurring_count} next recurring occurrence(s).")

        # Deduct EXP from each affected user
        for user_id, total_penalty in user_penalties.items():
            user = await db.execute(select(User).where(User.id == user_id))
            user = user.scalar_one_or_none()
            if not user:
                continue

            new_total_exp = max(0, user.total_exp - total_penalty)
            new_level = get_level_from_exp(new_total_exp)

            await db.execute(
                update(User)
                .where(User.id == user_id)
                .values(
                    total_exp=new_total_exp,
                    level=new_level,
                    updated_at=func.now(),
                )
            )
            logger.info(
                f"User {user_id}: -{total_penalty} EXP (overdue penalty), "
                f"new total: {new_total_exp}, level: {new_level}"
            )

        await db.commit()
        logger.info("Overdue check: complete.")
