# Repeating Tasks Feature

## Overview

Repeating tasks allow users to create tasks that automatically generate future instances based on a chosen frequency. Users can see their upcoming tasks in advance, helping them plan and stay prepared.

---

## Frequency Types

### Daily
- Task repeats every single day
- **Best for:** Morning routines, daily habits, medication reminders

### Weekly
- Task repeats on specific days of the week
- User selects one or more days (Monday through Sunday)
- **Best for:** Gym schedules, weekly reviews, recurring meetings

### Monthly
- Task repeats on a specific date each month
- User selects a day (1-31)
- If the selected day doesn't exist in a month (e.g., 31st in February), the task falls on the last day of that month
- **Best for:** Bill payments, monthly reviews, subscription renewals

### Custom Interval
- Task repeats every X days starting from the creation date
- User specifies the number of days between occurrences
- **Best for:** Irregular cycles like changing bedsheets, haircuts, car maintenance

---

## Database Schema

### New Fields for `tasks` Table

| Field | Type | Description |
|-------|------|-------------|
| `is_recurring` | Boolean | Whether this task is a recurring task |
| `recurrence_type` | Enum | `DAILY`, `WEEKLY`, `MONTHLY`, `CUSTOM` |
| `recurrence_days` | Array[Int] | For weekly: days of week (0=Sunday, 6=Saturday) |
| `recurrence_date` | Int | For monthly: day of month (1-31) |
| `recurrence_interval` | Int | For custom: number of days between occurrences |
| `parent_task_id` | Int (FK) | Reference to the original recurring task template |
| `recurrence_end_date` | DateTime | Optional: when the recurrence should stop |

### Task Types

1. **Template Task**: The original recurring task (serves as blueprint)
   - `is_recurring = true`
   - `parent_task_id = null`
   - Not displayed on calendar directly

2. **Instance Task**: Generated task for a specific date
   - `is_recurring = false`
   - `parent_task_id = <template_id>`
   - Displayed on calendar

---

## API Endpoints

### Create Recurring Task
```
POST /api/tasks
{
  "title": "Morning Workout",
  "description": "30 min exercise",
  "importance": "MEDIUM",
  "is_recurring": true,
  "recurrence_type": "WEEKLY",
  "recurrence_days": [1, 3, 5],  // Mon, Wed, Fri
  "recurrence_end_date": null    // Optional
}
```

### Get Tasks (includes generated instances)
```
GET /api/tasks?start_date=2024-01-01&end_date=2024-01-31
```
- Returns both regular tasks and generated recurring task instances for the date range

### Update Recurring Task
```
PATCH /api/tasks/{id}
{
  "update_type": "this_only" | "this_and_future" | "all"
}
```
- `this_only`: Update only this specific instance
- `this_and_future`: Update this and all future instances
- `all`: Update the template and regenerate all instances

### Delete Recurring Task
```
DELETE /api/tasks/{id}?delete_type=this_only|this_and_future|all
```

---

## Frontend Components

### CreateTaskModal Updates

Add new section for recurring options:

```
[ ] Repeat this quest

When checked, show:
┌─────────────────────────────────────┐
│ Frequency: [Daily ▼]                │
│                                     │
│ (For Weekly)                        │
│ Days: [M] [T] [W] [T] [F] [S] [S]  │
│                                     │
│ (For Monthly)                       │
│ Day of month: [15 ▼]                │
│                                     │
│ (For Custom)                        │
│ Every [__] days                     │
│                                     │
│ End date: [Optional date picker]    │
└─────────────────────────────────────┘
```

### TaskCard Updates

- Show recurring icon on recurring task instances
- Different context menu options for recurring tasks

### Calendar Display

- Recurring task instances appear like regular tasks
- Visual indicator (small repeat icon) to distinguish them

---

## Business Logic

### Instance Generation

1. When a recurring task is created, generate instances for the visible date range (current month + 1 month ahead)
2. When user navigates to a new month, generate instances on-demand if not already created
3. Store generated instances in the database for:
   - Performance (no recalculation needed)
   - Individual task completion tracking
   - Allowing modifications to specific instances

### Completion Handling

- Completing an instance only marks that specific instance as done
- Does not affect other instances
- EXP is awarded per instance completion

### Edge Cases

1. **Monthly 31st**: If task is set for 31st, generate on last day of shorter months
2. **Leap years**: February 29th tasks only appear in leap years
3. **Past instances**: Don't generate instances for dates before task creation
4. **Timezone handling**: Use user's timezone for day calculations

---

## UI/UX Considerations

### Solo Leveling Theme

- Recurring tasks are "Daily Quests" or "Repeating Quests"
- Use appropriate terminology in UI
- Recurring icon styled to match the aesthetic

### User Feedback

- Toast notification when recurring task is created: "Repeating quest accepted! This quest will appear [frequency description]"
- Clear indication of recurrence pattern on task card

---

## Implementation Phases

### Phase 1: Basic Infrastructure
- [ ] Add database fields for recurrence
- [ ] Create recurrence type enum
- [ ] Update task model

### Phase 2: Backend Logic
- [ ] Instance generation service
- [ ] Update create task endpoint
- [ ] Update get tasks endpoint with date range filtering
- [ ] Handle edge cases (month end, leap years)

### Phase 3: Frontend - Create Flow
- [ ] Add recurring options to CreateTaskModal
- [ ] Frequency type selector
- [ ] Day/date pickers for each type
- [ ] Validation

### Phase 4: Frontend - Display
- [ ] Update TaskCard with recurring indicator
- [ ] Update calendar to show instances
- [ ] Edit/delete options for recurring tasks

### Phase 5: Polish
- [ ] Animations and transitions
- [ ] Error handling
- [ ] Loading states
- [ ] Testing edge cases

---

## Future Enhancements

- Skip specific instances without deleting
- Pause/resume recurring tasks
- Statistics for recurring task completion rates
- Streak tracking for daily recurring tasks
