from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from db.database import async_session, check_database
from models.scheduler import SchedulerState
from sqlalchemy import select
from resolvers.task_resolver import router as task_router
from resolvers.auth_resolver import router as auth_router
from resolvers.goal_resolver import router as goal_router
from resolvers.achievement_resolver import router as achievement_router
from resolvers.stats_resolver import router as stats_router
from middleware.rate_limit import AuthRateLimitMiddleware
from config import ALLOWED_HOSTS, CORS_ORIGINS, IS_PRODUCTION, validate_config
import logging

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_config()
    await check_database()
    yield


app = FastAPI(
    title="Leveling System API",
    lifespan=lifespan,
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)
app.add_middleware(AuthRateLimitMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(task_router)
app.include_router(goal_router)
app.include_router(achievement_router)
app.include_router(stats_router)


@app.get("/api/info")
def get_info():
    return {"name": "Leveling System", "version": "1.0.0"}


@app.get("/api/health/live", include_in_schema=False)
def health_live():
    return {"status": "ok"}


@app.get("/api/health/ready", include_in_schema=False)
async def health_ready():
    try:
        await check_database()
        return {"status": "ready"}
    except Exception:
        return JSONResponse(status_code=503, content={"status": "unavailable"})


@app.get("/api/health/scheduler", include_in_schema=False)
async def health_scheduler():
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    limits = {
        "overdue_checker": timedelta(minutes=3),
        "perfect_day_checker": timedelta(minutes=70),
    }
    async with async_session() as db:
        result = await db.execute(
            select(SchedulerState).where(SchedulerState.job_name.in_(limits))
        )
        states = {state.job_name: state for state in result.scalars()}

    jobs = {}
    healthy = True
    for job_name, freshness in limits.items():
        state = states.get(job_name)
        is_fresh = bool(
            state
            and state.last_succeeded_at
            and now - state.last_succeeded_at <= freshness
        )
        has_error = bool(state and state.last_error)
        status = (
            "healthy"
            if is_fresh and not has_error
            else "failed"
            if has_error
            else "stale"
        )
        healthy = healthy and status == "healthy"
        jobs[job_name] = {
            "status": status,
            "last_succeeded_at": (
                state.last_succeeded_at.isoformat()
                if state and state.last_succeeded_at
                else None
            ),
            "last_duration_ms": state.last_duration_ms if state else None,
            "last_processed_count": state.last_processed_count if state else 0,
        }

    return JSONResponse(
        status_code=200 if healthy else 503,
        content={
            "status": "healthy" if healthy else "unhealthy",
            "jobs": jobs,
        },
    )
