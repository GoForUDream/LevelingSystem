# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

### Start Everything

```bash
./run.sh          # Starts both backend and frontend (kills both on exit)
```

### Backend

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000   # Dev server with hot reload
```

Backend runs at http://localhost:8000 — Swagger UI at http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm run dev        # Dev server (http://localhost:5173)
npm run check      # TypeScript + ESLint (run before committing)
npm run typecheck  # TypeScript only
npm run lint       # ESLint only
npm run build      # Production build (tsc -b && vite build)
```

### Database

```bash
docker-compose up -d    # Start PostgreSQL on port 5433
docker-compose down     # Stop
```

The DB auto-initializes via SQLAlchemy `create_all` on backend startup — no migrations needed.

## Architecture

### Backend (`backend/`)

Strict layered architecture — each domain follows the same vertical slice:

```
resolvers/ → services/ → repositories/ → models/
```

- **`resolvers/`** — FastAPI routers; thin, only handle HTTP, call services
- **`services/`** — All business logic (EXP calculation, level-up, achievement triggering)
- **`repositories/`** — SQLAlchemy async queries; no business logic
- **`models/`** — SQLAlchemy ORM models (`user`, `task`, `goal`, `achievement`)
- **`schemas/`** — Pydantic models for request/response validation
- **`constants/`** — `levels.py` (pre-calculated LEVEL_THRESHOLDS + IMPORTANCE_EXP), `ranks.py` (rank titles by level range), `achievements.py` (all 48 badge definitions)
- **`jobs/`** — `overdue_checker.py` runs via APScheduler at midnight UTC; marks tasks OVERDUE and applies EXP penalties
- **`middleware/auth_middleware.py`** — `get_current_user` dependency used by all protected routes; validates JWT and returns ORM user

**Auth flow:** Google OAuth → backend receives code → exchanges for Google user info → issues own JWT → frontend stores JWT in localStorage.

**Datetime convention:** All datetimes stored as **naive UTC** in the DB (no timezone info). Use `utc_now()` from `task_service.py` and `to_naive_utc()` helpers when handling datetimes. User timezone offset (minutes from UTC) is stored on the `User` model and used only for display/achievement logic on the frontend.

### Frontend (`frontend/src/`)

- **`pages/`** — One file per route: `CalendarPage`, `GoalsPage`, `AchievementsPage`, `StatsPage`, `LoginPage`, `AuthCallback`
- **`components/`** — Shared components; `ui/` has Radix-based primitives; `stats/` has Recharts chart components for StatsPage
- **`contexts/AuthContext.tsx`** — Provides `user`, `token`, `logout`; JWT stored in localStorage; fetches `/api/auth/me` on load
- **`hooks/useStats.ts`** — Fetches and memoizes stats data for StatsPage
- **`types/`** — TypeScript interfaces mirroring backend schemas
- **`constants/`** — Achievement definitions mirrored from backend (badge metadata, category info)

**API calls:** All fetch calls include `Authorization: Bearer <token>` from `AuthContext`. Base URL is `http://localhost:8000`.

### Key Domain Logic

**EXP & Leveling:**

- Task EXP: Trivial=10, Low=25, Medium=50, High=100, Critical=200 (defined in `constants/levels.py`)
- Level thresholds pre-calculated: `100 × (level ^ 1.8)`, stored in `LEVEL_THRESHOLDS` dict for O(1) lookup
- Level-up/down logic lives in `services/user_service.py` — called after any EXP change
- 12 rank titles defined in `constants/ranks.py` by level range (1–5 up to 100+)

**Overdue System:**

- APScheduler job runs at midnight UTC (`jobs/overdue_checker.py`)
- Also runs once on startup to catch missed penalties
- Overdue/cancelled tasks apply a penalty (deducted EXP); recurring tasks spawn their next occurrence automatically

**Achievement System:**

- `UserAchievementStats` model tracks aggregated counters (tasks completed, streaks, etc.)
- `UserAchievement` model records each unlocked badge with timestamp
- `achievement_service.py` checks thresholds after every relevant action and returns newly unlocked badges
- Frontend receives unlocked badges in API responses and queues `BadgeUnlockModal` displays one at a time

**Calendar:**

- Month-based lazy loading — only loads ±6 months from current month
- Prevents scrolling before `user.created_at` date
- Auto-reloads on day change (detected via `document.visibilitychange`)

## NOTES:

- Always ask more if you needed more information for complete the task, nothing should be doing without fully confirmation
- Update AGENTS.md file everytime there is a change related to this file that need update.
