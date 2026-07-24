import asyncio
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from config import validate_config
from db.database import check_database
from jobs.overdue_checker import check_perfect_days, mark_overdue_tasks


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    validate_config()
    await check_database()
    for job in (mark_overdue_tasks, check_perfect_days):
        try:
            await job()
        except Exception:
            logging.exception(
                "Scheduler startup catch-up failed for %s; scheduled retry remains active.",
                job.__name__,
            )

    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.add_job(
        mark_overdue_tasks,
        trigger=CronTrigger(minute="*", timezone="UTC"),
        id="overdue_checker",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=50,
    )
    scheduler.add_job(
        check_perfect_days,
        trigger=CronTrigger(minute=5, timezone="UTC"),
        id="perfect_day_checker",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=300,
    )
    scheduler.start()

    try:
        await asyncio.Event().wait()
    finally:
        scheduler.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
