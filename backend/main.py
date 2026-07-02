from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from db.database import init_db
from resolvers.task_resolver import router as task_router
from resolvers.user_resolver import router as user_router
from resolvers.auth_resolver import router as auth_router
from resolvers.goal_resolver import router as goal_router
from resolvers.achievement_resolver import router as achievement_router
from resolvers.stats_resolver import router as stats_router
from jobs.overdue_checker import mark_overdue_tasks
from config import FRONTEND_URL
import logging

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()

    # Run overdue checker once on startup to catch any missed runs
    await mark_overdue_tasks()
    logger.info("Startup overdue check complete.")

    # Run overdue checker every day at midnight UTC
    scheduler.add_job(
        mark_overdue_tasks,
        trigger=CronTrigger(hour=0, minute=0),
        id="overdue_checker",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started — overdue checker registered for midnight UTC.")

    yield

    scheduler.shutdown()
    logger.info("Scheduler shut down.")


app = FastAPI(title="Leveling System API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(task_router)
app.include_router(user_router)
app.include_router(goal_router)
app.include_router(achievement_router)
app.include_router(stats_router)


@app.get("/api/info")
def get_info():
    return {"name": "Leveling System", "version": "1.0.0"}
