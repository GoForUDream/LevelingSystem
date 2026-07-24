import asyncio
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import asyncpg
from jose import jwt


PROFILES = {
    "smoke": (100, 20_000),
    "capacity": (10_000, 2_000_000),
}
SECRET = "load-test-secret-that-is-never-used-outside-this-stack"


async def seed() -> None:
    profile = os.getenv("SEED_PROFILE", "smoke")
    if profile == "heavy":
        user_count, task_count = 10_000, int(os.getenv("HEAVY_TASK_COUNT", "5000000"))
    else:
        user_count, task_count = PROFILES[profile]

    connection = await asyncpg.connect(
        "postgresql://load:load-only-password@load-db:5432/leveling_load"
    )
    try:
        await connection.execute(
            "TRUNCATE user_achievements, user_achievement_stats, tasks, goals, "
            "users RESTART IDENTITY CASCADE"
        )
        await connection.execute(
            """
            INSERT INTO users (
                email, name, google_id, total_exp, level, timezone_offset,
                is_active, is_guest, language, session_version, created_at, updated_at
            )
            SELECT
                'load-' || n || '@example.test',
                'Load User ' || n,
                'load-google-' || n,
                (n % 100) * 100,
                1,
                CASE WHEN n % 3 = 0 THEN 420 WHEN n % 3 = 1 THEN -300 ELSE 0 END,
                TRUE, FALSE, 'en', 0,
                CASE
                    WHEN n % 10 IN (0, 1) THEN NOW() + ((n % 30 + 1) || ' days')::interval
                    ELSE NOW() - ((n % 730) || ' days')::interval
                END,
                NOW()
            FROM generate_series(1, $1) AS n
            """,
            user_count,
        )
        await connection.execute(
            """
            INSERT INTO user_achievement_stats (
                user_id, total_tasks_completed, total_goals_completed,
                early_bird_count, night_owl_count, instant_completions,
                perfect_days, current_streak, longest_streak,
                longest_inactive_days
            )
            SELECT id, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM users
            """
        )
        await connection.execute(
            """
            INSERT INTO tasks (
                user_id, title, status, importance, exp_value, due_date,
                reschedule_count, max_reschedules, exp_earned, exp_penalty,
                is_exp_processed, is_recurring, completed_at,
                failed_at, cancelled_at, created_at, updated_at
            )
            SELECT
                ((n - 1) % $1) + 1,
                'Load task ' || n,
                (CASE n % 10
                    WHEN 0 THEN 'TODO'
                    WHEN 1 THEN 'IN_PROGRESS'
                    WHEN 2 THEN 'FAILED'
                    WHEN 3 THEN 'OVERDUE'
                    WHEN 4 THEN 'CANCELLED'
                    ELSE 'COMPLETED'
                END)::taskstatus,
                (CASE n % 5
                    WHEN 0 THEN 'TRIVIAL'
                    WHEN 1 THEN 'LOW'
                    WHEN 2 THEN 'MEDIUM'
                    WHEN 3 THEN 'HIGH'
                    ELSE 'CRITICAL'
                END)::taskimportance,
                100,
                NOW() - ((n % 730) || ' days')::interval,
                0,
                2,
                CASE WHEN n % 10 >= 5 THEN 100 END,
                CASE n % 10 WHEN 2 THEN 50 WHEN 3 THEN 100 WHEN 4 THEN 20 END,
                n % 10 NOT IN (0, 1),
                FALSE,
                CASE WHEN n % 10 >= 5 THEN NOW() - ((n % 730) || ' days')::interval END,
                CASE WHEN n % 10 IN (2, 3) THEN NOW() - ((n % 730) || ' days')::interval END,
                CASE WHEN n % 10 = 4 THEN NOW() - ((n % 730) || ' days')::interval END,
                NOW() - (((n % 730) + 1) || ' days')::interval,
                NOW()
            FROM generate_series(1, $2) AS n
            """,
            user_count,
            task_count,
        )
    finally:
        await connection.close()

    now = datetime.now(timezone.utc)
    tokens = [
        jwt.encode(
            {
                "sub": str(user_id),
                "sv": 0,
                "iat": now,
                "exp": now + timedelta(days=7),
            },
            SECRET,
            algorithm="HS256",
        )
        for user_id in range(1, user_count + 1)
    ]
    output = Path(os.getenv("TOKEN_OUTPUT", "/data/tokens.json"))
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(tokens), encoding="utf-8")
    print(f"Seeded profile={profile} users={user_count} tasks={task_count}")


if __name__ == "__main__":
    asyncio.run(seed())
