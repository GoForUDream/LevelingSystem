"""Add cursor-friendly task and goal indexes."""

from alembic import op


revision = "20260724_01"
down_revision = "20260715_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    for statement in (
        "DROP INDEX IF EXISTS ix_tasks_user_due",
        "DROP INDEX IF EXISTS ix_tasks_goal_id",
        "DROP INDEX IF EXISTS ix_goals_user_created",
        "CREATE INDEX IF NOT EXISTS ix_tasks_user_due_id ON tasks (user_id, due_date, id)",
        "CREATE INDEX IF NOT EXISTS ix_tasks_user_created_id ON tasks (user_id, created_at, id)",
        "CREATE INDEX IF NOT EXISTS ix_tasks_goal_status_created_id ON tasks (goal_id, status, created_at, id)",
        "CREATE INDEX IF NOT EXISTS ix_goals_user_created_id ON goals (user_id, created_at, id)",
    ):
        op.execute(statement)


def downgrade() -> None:
    for statement in (
        "DROP INDEX IF EXISTS ix_goals_user_created_id",
        "DROP INDEX IF EXISTS ix_tasks_goal_status_created_id",
        "DROP INDEX IF EXISTS ix_tasks_user_created_id",
        "DROP INDEX IF EXISTS ix_tasks_user_due_id",
        "CREATE INDEX IF NOT EXISTS ix_goals_user_created ON goals (user_id, created_at)",
        "CREATE INDEX IF NOT EXISTS ix_tasks_goal_id ON tasks (goal_id)",
        "CREATE INDEX IF NOT EXISTS ix_tasks_user_due ON tasks (user_id, due_date)",
    ):
        op.execute(statement)
