from pydantic import BaseModel
from datetime import datetime
from models.task import TaskStatus, TaskImportance, RecurrenceType


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    status: TaskStatus = TaskStatus.TODO
    importance: TaskImportance = TaskImportance.MEDIUM
    due_date: datetime | None = None
    category_id: int | None = None
    project_id: int | None = None
    is_recurring: bool = False
    recurrence_type: RecurrenceType | None = None
    recurrence_days: list[int] | None = None
    recurrence_interval: int | None = None
    recurrence_end_date: datetime | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    importance: TaskImportance | None = None
    due_date: datetime | None = None
    category_id: int | None = None
    project_id: int | None = None
    is_recurring: bool | None = None
    recurrence_type: RecurrenceType | None = None
    recurrence_days: list[int] | None = None
    recurrence_interval: int | None = None


class TaskResponse(BaseModel):
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

    class Config:
        from_attributes = True
