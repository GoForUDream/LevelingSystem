"""Harden task outcome statistics and overdue scheduling."""

from alembic import op
import sqlalchemy as sa


revision = "20260724_02"
down_revision = "20260724_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    task_columns = {column["name"] for column in inspector.get_columns("tasks")}
    if "cancelled_at" not in task_columns:
        op.add_column("tasks", sa.Column("cancelled_at", sa.DateTime(), nullable=True))
    op.execute(
        "UPDATE tasks SET cancelled_at = updated_at "
        "WHERE status = 'CANCELLED' AND cancelled_at IS NULL"
    )

    for statement in (
        "DROP INDEX IF EXISTS ix_tasks_user_completed",
        "DROP INDEX IF EXISTS ix_tasks_user_failed",
        "CREATE INDEX IF NOT EXISTS ix_tasks_stats_completed ON tasks (user_id, completed_at) "
        "WHERE status = 'COMPLETED'",
        "CREATE INDEX IF NOT EXISTS ix_tasks_stats_failed ON tasks (user_id, failed_at) "
        "WHERE status IN ('FAILED', 'OVERDUE')",
        "CREATE INDEX IF NOT EXISTS ix_tasks_stats_cancelled ON tasks (user_id, cancelled_at) "
        "WHERE status = 'CANCELLED'",
        "CREATE INDEX IF NOT EXISTS ix_tasks_overdue_claim ON tasks (due_date, id) "
        "WHERE status IN ('TODO', 'IN_PROGRESS') AND is_exp_processed = FALSE",
    ):
        op.execute(statement)

    if not inspector.has_table("scheduler_state"):
        op.create_table(
            "scheduler_state",
            sa.Column("job_name", sa.String(length=100), primary_key=True),
            sa.Column("last_started_at", sa.DateTime(), nullable=True),
            sa.Column("last_succeeded_at", sa.DateTime(), nullable=True),
            sa.Column("last_duration_ms", sa.Integer(), nullable=True),
            sa.Column(
                "last_processed_count",
                sa.Integer(),
                nullable=False,
                server_default="0",
            ),
            sa.Column("last_error", sa.Text(), nullable=True),
        )


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if inspector.has_table("scheduler_state"):
        op.drop_table("scheduler_state")
    for index_name in (
        "ix_tasks_overdue_claim",
        "ix_tasks_stats_cancelled",
        "ix_tasks_stats_failed",
        "ix_tasks_stats_completed",
    ):
        op.execute(f"DROP INDEX IF EXISTS {index_name}")
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_tasks_user_completed "
        "ON tasks (user_id, completed_at)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_tasks_user_failed "
        "ON tasks (user_id, failed_at)"
    )
    task_columns = {column["name"] for column in inspector.get_columns("tasks")}
    if "cancelled_at" in task_columns:
        op.drop_column("tasks", "cancelled_at")
