import asyncio
import sys
from time import perf_counter

from sqlalchemy import text

sys.path.insert(0, "/app")

from db.database import async_session
from jobs.overdue_checker import mark_overdue_tasks


async def benchmark() -> None:
    async with async_session() as db:
        user_count = (
            await db.execute(text("SELECT count(*) FROM users"))
        ).scalar_one()
        if user_count < 10_000:
            raise RuntimeError(
                "Scheduler benchmark requires the capacity seed (10,000 users)."
            )
        await db.execute(
            text(
                """
                DELETE FROM tasks WHERE title LIKE 'Scheduler benchmark %'
                """
            )
        )
        await db.execute(
            text(
                """
                UPDATE tasks
                SET is_exp_processed = TRUE
                WHERE status IN ('TODO', 'IN_PROGRESS')
                  AND is_exp_processed = FALSE
                """
            )
        )
        await db.execute(
            text(
                """
                INSERT INTO tasks (
                    user_id, title, status, importance, exp_value, due_date,
                    reschedule_count, max_reschedules, is_exp_processed,
                    is_recurring, created_at, updated_at
                )
                SELECT
                    ((n - 1) % 10000) + 1,
                    'Scheduler benchmark ' || n,
                    'TODO'::taskstatus,
                    'LOW'::taskimportance,
                    25,
                    NOW() - INTERVAL '1 day',
                    0,
                    2,
                    FALSE,
                    FALSE,
                    NOW() - INTERVAL '2 days',
                    NOW()
                FROM generate_series(1, 100000) AS n
                """
            )
        )
        await db.commit()

    started = perf_counter()
    processed = await mark_overdue_tasks()
    elapsed = perf_counter() - started
    print(f"processed={processed} elapsed_seconds={elapsed:.3f}")
    if processed != 100_000:
        raise RuntimeError(f"Expected 100000 tasks, processed {processed}")


if __name__ == "__main__":
    asyncio.run(benchmark())
