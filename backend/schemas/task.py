from pydantic import BaseModel, ConfigDict, Field, model_validator
from datetime import datetime
from models.task import TaskStatus, TaskImportance, RecurrenceType


class TaskCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=4000)
    importance: TaskImportance = TaskImportance.MEDIUM
    due_date: datetime | None = None
    category_id: int | None = None
    project_id: int | None = None
    goal_id: int | None = None
    is_recurring: bool = False
    recurrence_type: RecurrenceType | None = None
    recurrence_days: list[int] | None = None
    recurrence_interval: int | None = Field(default=None, ge=1, le=365)
    recurrence_end_date: datetime | None = None

    @model_validator(mode="after")
    def validate_recurrence(self):
        if not self.is_recurring:
            return self
        if self.recurrence_type is None:
            raise ValueError("recurrence_type is required for recurring tasks")
        if self.recurrence_type in {RecurrenceType.WEEKLY, RecurrenceType.MONTHLY}:
            if not self.recurrence_days:
                raise ValueError("recurrence_days is required for this recurrence type")
        if self.recurrence_type == RecurrenceType.WEEKLY and any(
            day < 0 or day > 6 for day in self.recurrence_days or []
        ):
            raise ValueError("weekly recurrence days must be between 0 and 6")
        if self.recurrence_type == RecurrenceType.MONTHLY and any(
            day not in {-1, *range(1, 32)} for day in self.recurrence_days or []
        ):
            raise ValueError("monthly recurrence days must be -1 or between 1 and 31")
        if self.recurrence_type == RecurrenceType.CUSTOM and self.recurrence_interval is None:
            raise ValueError("recurrence_interval is required for custom recurrence")
        if self.recurrence_end_date and self.due_date and self.recurrence_end_date < self.due_date:
            raise ValueError("recurrence_end_date cannot be before due_date")
        return self


class TaskUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=4000)
    importance: TaskImportance | None = None
    due_date: datetime | None = None
    category_id: int | None = None
    project_id: int | None = None
    goal_id: int | None = None
    is_recurring: bool | None = None
    recurrence_type: RecurrenceType | None = None
    recurrence_days: list[int] | None = None
    recurrence_interval: int | None = Field(default=None, ge=1, le=365)


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    title: str
    description: str | None
    status: TaskStatus
    importance: TaskImportance
    exp_value: int
    due_date: datetime | None
    original_due_date: datetime | None
    reschedule_count: int
    max_reschedules: int
    last_rescheduled_at: datetime | None
    exp_earned: int | None
    exp_penalty: int | None
    is_exp_processed: bool
    category_id: int | None
    project_id: int | None
    goal_id: int | None
    started_at: datetime | None
    completed_at: datetime | None
    failed_at: datetime | None
    is_recurring: bool
    recurrence_type: RecurrenceType | None
    recurrence_days: str | None
    recurrence_interval: int | None
    recurrence_end_date: datetime | None
    created_at: datetime
    updated_at: datetime
