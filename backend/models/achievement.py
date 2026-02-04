from sqlalchemy import Integer, String, DateTime, Date, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from db.database import Base
from datetime import datetime, date


class UserAchievementStats(Base):
    __tablename__ = "user_achievement_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)

    total_tasks_completed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_goals_completed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    early_bird_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    night_owl_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    instant_completions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    perfect_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    current_streak: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_active_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    longest_inactive_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    __table_args__ = (
        UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    badge_id: Mapped[str] = mapped_column(String(50), nullable=False)
    unlocked_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
