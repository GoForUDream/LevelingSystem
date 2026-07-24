from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from db.database import Base


class SchedulerState(Base):
    __tablename__ = "scheduler_state"

    job_name: Mapped[str] = mapped_column(String(100), primary_key=True)
    last_started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_succeeded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_processed_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
