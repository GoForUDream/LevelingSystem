import asyncio
import sys
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete, select

sys.path.insert(0, "/app")

from db.database import async_session, engine
from main import app
from models.achievement import UserAchievementStats
from models.task import Task, TaskImportance
from models.user import User
from services.auth_service import AuthService


async def benchmark() -> None:
    marker = uuid4().hex
    async with async_session() as db:
        user = User(
            email=f"concurrency-{marker}@example.test",
            google_id=f"concurrency-{marker}",
            name="Concurrency Benchmark",
            timezone_offset=420,
        )
        db.add(user)
        await db.flush()
        tasks = [
            Task(
                user_id=user.id,
                title=f"Concurrent completion {index}",
                importance=TaskImportance.LOW,
                exp_value=25,
                due_date=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=1),
            )
            for index in range(20)
        ]
        db.add_all(tasks)
        await db.commit()
        user_id = user.id
        task_ids = [task.id for task in tasks]
        token = AuthService().create_access_token(user_id, user.email, 0)

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://localhost",
        timeout=30,
    ) as client:
        responses = await asyncio.gather(
            *[
                client.post(
                    f"/api/tasks/{task_id}/complete",
                    headers={"Authorization": f"Bearer {token}"},
                )
                for task_id in task_ids
            ]
        )
    failures = [response.status_code for response in responses if response.status_code != 200]
    if failures:
        raise RuntimeError(f"Concurrent completion failures: {failures}")

    async with async_session() as db:
        user = await db.get(User, user_id)
        stats = (
            await db.execute(
                select(UserAchievementStats).where(
                    UserAchievementStats.user_id == user_id
                )
            )
        ).scalar_one()
        print(
            f"total_exp={user.total_exp} "
            f"achievement_completions={stats.total_tasks_completed}"
        )
        if user.total_exp != 500 or stats.total_tasks_completed != 20:
            raise RuntimeError("Concurrent totals are not exact")
        await db.execute(delete(User).where(User.id == user_id))
        await db.commit()
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(benchmark())
