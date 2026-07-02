from sqlalchemy import select, update
from sqlalchemy.sql import func
from models.task import Task, TaskStatus
from models.user import User
from constants.levels import get_level_from_exp
from repositories.task_repository import TaskRepository
from repositories.achievement_repository import AchievementRepository
from services.task_service import TaskService
from services.achievement_service import AchievementService
from db.database import async_session
from datetime import datetime, timezone, timedelta
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
            await check_perfect_days(db, today_start)
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
        task_service = TaskService(TaskRepository(db, auto_commit=False))
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

        # Check perfect days: for each user, if ALL tasks due yesterday are COMPLETED
        await check_perfect_days(db, today_start)


async def check_perfect_days(db, today_start):
    """
    Check if any user completed ALL their tasks due on their local yesterday.
    If so, increment their perfect_days counter.
    Uses each user's timezone_offset for accurate local date calculation.
    """
    # Get all users with their timezone offsets
    users_result = await db.execute(select(User))
    users = list(users_result.scalars().all())

    if not users:
        return

    achievement_service = AchievementService(AchievementRepository(db, auto_commit=False))
    utc_now = datetime.now(timezone.utc).replace(tzinfo=None)

    for user in users:
        # Calculate user's local "yesterday" based on their timezone
        # timezone_offset is in minutes (positive = ahead of UTC)
        user_offset = timedelta(minutes=user.timezone_offset)
        user_local_now = utc_now + user_offset
        user_local_today = user_local_now.replace(hour=0, minute=0, second=0, microsecond=0)
        user_local_yesterday_start = user_local_today - timedelta(days=1)
        user_local_yesterday_end = user_local_today

        # Convert back to UTC for querying (tasks are stored in UTC)
        utc_yesterday_start = user_local_yesterday_start - user_offset
        utc_yesterday_end = user_local_yesterday_end - user_offset

        # Find all tasks due on user's local yesterday
        result = await db.execute(
            select(Task).where(
                Task.user_id == user.id,
                Task.due_date >= utc_yesterday_start,
                Task.due_date < utc_yesterday_end,
            )
        )
        yesterday_tasks = list(result.scalars().all())

        if not yesterday_tasks:
            continue

        all_completed = all(t.status == TaskStatus.COMPLETED for t in yesterday_tasks)
        if all_completed:
            # Pass the local yesterday date to prevent double-counting
            yesterday_date = user_local_yesterday_start.date()
            new_badges = await achievement_service.on_perfect_day(user.id, yesterday_date)
            logger.info(
                f"User {user.id}: perfect day on {yesterday_date}! ({len(yesterday_tasks)} tasks all completed). "
                f"New badges: {new_badges}"
            )

    await db.commit()
