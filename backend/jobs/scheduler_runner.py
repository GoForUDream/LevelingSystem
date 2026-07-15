import asyncio
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from config import validate_config
from db.database import check_database
from jobs.overdue_checker import mark_overdue_tasks


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    validate_config()
    await check_database()
    await mark_overdue_tasks()

    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.add_job(
        mark_overdue_tasks,
        trigger=CronTrigger(hour=0, minute=0, timezone="UTC"),
        id="overdue_checker",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )
    scheduler.start()

    try:
        await asyncio.Event().wait()
    finally:
        scheduler.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
