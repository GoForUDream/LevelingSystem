"""Production schema baseline with ownership constraints and indexes."""

from alembic import op

from db.database import Base
import models  # noqa: F401

revision = "20260715_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind, checkfirst=True)

    for statement in (
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE",
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(10)",
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_days VARCHAR(100)",
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER",
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMP",
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS goal_id INTEGER",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone_offset INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT FALSE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(10) NOT NULL DEFAULT 'en'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE user_achievement_stats ADD COLUMN IF NOT EXISTS last_perfect_day_date DATE",
    ):
        op.execute(statement)

    # Existing local databases may predate foreign keys. Remove unreachable
    # orphan rows and detach invalid goal references before adding constraints.
    op.execute("DELETE FROM user_achievements WHERE user_id NOT IN (SELECT id FROM users)")
    op.execute("DELETE FROM user_achievement_stats WHERE user_id NOT IN (SELECT id FROM users)")
    op.execute("DELETE FROM tasks WHERE user_id NOT IN (SELECT id FROM users)")
    op.execute("DELETE FROM goals WHERE user_id NOT IN (SELECT id FROM users)")
    op.execute("UPDATE tasks SET goal_id = NULL WHERE goal_id IS NOT NULL AND goal_id NOT IN (SELECT id FROM goals)")
    op.execute("UPDATE tasks SET goal_id = NULL FROM goals WHERE tasks.goal_id = goals.id AND tasks.user_id <> goals.user_id")

    for statement in (
        "CREATE INDEX IF NOT EXISTS ix_tasks_user_due ON tasks (user_id, due_date)",
        "CREATE INDEX IF NOT EXISTS ix_tasks_user_status ON tasks (user_id, status)",
        "CREATE INDEX IF NOT EXISTS ix_tasks_user_completed ON tasks (user_id, completed_at)",
        "CREATE INDEX IF NOT EXISTS ix_tasks_user_failed ON tasks (user_id, failed_at)",
        "CREATE INDEX IF NOT EXISTS ix_tasks_goal_id ON tasks (goal_id)",
        "CREATE INDEX IF NOT EXISTS ix_goals_user_created ON goals (user_id, created_at)",
        "CREATE INDEX IF NOT EXISTS ix_user_achievements_user ON user_achievements (user_id)",
    ):
        op.execute(statement)

    constraints = (
        ("tasks", "fk_tasks_user_id", "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE"),
        ("tasks", "fk_tasks_goal_id", "FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL"),
        ("goals", "fk_goals_user_id", "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE"),
        ("user_achievements", "fk_user_achievements_user_id", "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE"),
        ("user_achievement_stats", "fk_user_achievement_stats_user_id", "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE"),
    )
    for table, name, definition in constraints:
        op.execute(
            f"""
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '{name}') THEN
                    ALTER TABLE {table} ADD CONSTRAINT {name} {definition};
                END IF;
            END $$;
            """
        )


def downgrade() -> None:
    for table, name in (
        ("user_achievement_stats", "fk_user_achievement_stats_user_id"),
        ("user_achievements", "fk_user_achievements_user_id"),
        ("goals", "fk_goals_user_id"),
        ("tasks", "fk_tasks_goal_id"),
        ("tasks", "fk_tasks_user_id"),
    ):
        op.execute(f"ALTER TABLE {table} DROP CONSTRAINT IF EXISTS {name}")
