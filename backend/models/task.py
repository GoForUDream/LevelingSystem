from sqlalchemy import String, Text, Integer, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from db.database import Base
import enum
from datetime import datetime


class TaskStatus(str, enum.Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ON_HOLD = "ON_HOLD"
    RESCHEDULED = "RESCHEDULED"
    OVERDUE = "OVERDUE"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class TaskImportance(str, enum.Enum):
    TRIVIAL = "TRIVIAL"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RecurrenceType(str, enum.Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    CUSTOM = "CUSTOM"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[TaskStatus] = mapped_column(
        SQLEnum(TaskStatus), nullable=False, default=TaskStatus.TODO
    )
    importance: Mapped[TaskImportance] = mapped_column(
        SQLEnum(TaskImportance), nullable=False, default=TaskImportance.MEDIUM
    )
    exp_value: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    due_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    original_due_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    reschedule_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    max_reschedules: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    last_rescheduled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    exp_earned: Mapped[int | None] = mapped_column(Integer, nullable=True)
    exp_penalty: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_exp_processed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    category_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    project_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    goal_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    failed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    is_recurring: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    recurrence_type: Mapped[str | None] = mapped_column(
        SQLEnum(RecurrenceType), nullable=True
    )
    recurrence_days: Mapped[str | None] = mapped_column(String(100), nullable=True)
    recurrence_interval: Mapped[int | None] = mapped_column(Integer, nullable=True)
    recurrence_end_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )
