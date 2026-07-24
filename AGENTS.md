# AGENTS.md

Repository guidance for coding agents working on Leveling System.

## Commands

### Docker stack

```powershell
docker compose --env-file .env.docker up -d --build
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f backend scheduler
docker compose --env-file .env.docker down
```

The stack contains `db`, `backend`, `scheduler`, and `frontend`. Alembic migrations run before the backend starts. The scheduler is a separate process and must not be started inside a web worker.

### Backend

```powershell
cd backend
..\backend\venv\Scripts\python.exe -m pytest -q
..\backend\venv\Scripts\alembic.exe upgrade head
..\backend\venv\Scripts\uvicorn.exe main:app --reload --port 8000
```

Swagger is available at `http://localhost:8000/docs` in development and disabled in production.

### Frontend

```powershell
cd frontend
npm run test
npm run check
npm run build
npm audit --omit=dev
npm run dev
```

## Architecture

Backend domains follow `resolvers -> services -> repositories -> models`. Keep HTTP concerns in resolvers, business rules in services, and SQL in repositories.

- `db/migrations`: Alembic schema history
- `jobs/scheduler_runner.py`: dedicated APScheduler process
- `jobs/overdue_checker.py`: idempotent, database-locked overdue processing
- `middleware/auth_middleware.py`: HTTP-only cookie and mobile bearer authentication
- `middleware/rate_limit.py`: public auth endpoint throttling

The browser uses an HTTP-only `leveling_session` cookie. Never put session JWTs in URLs or browser storage. Mobile clients continue to use bearer tokens. Every protected query and mutation must enforce the authenticated user's ownership server-side.

All datetimes are stored as naive UTC. Use `utc_now()` and `to_naive_utc()` from the domain services.

Frontend API calls use `apiFetch` or explicitly set `credentials: "include"`. The production browser/API setup must remain same-origin unless a complete cross-origin cookie and CSRF design is introduced.

Calendar task reads use `/api/tasks/range/page`, a three-month rolling cache, and TanStack Virtual. General task and goal reads must use cursor-paginated endpoints. The legacy list endpoints are deprecated compatibility surfaces and reject collections above 1,000 records.

Frontend pages should remain composition-focused. Put HTTP calls in `src/api`, reusable stateful behavior in `src/hooks`, shared domain types in `src/types`, and pure calculations in `src/lib` or `src/constants`.

## Change Rules

- Add schema changes through Alembic; do not add startup `ALTER TABLE` statements.
- Keep the backend, scheduler, and achievement updates transactionally consistent.
- Run backend tests, frontend tests, `npm run check`, the production build, and production dependency audit before handoff.
- Update this file whenever commands or architecture change.
- Record material production changes in `docs/change-logs/<timestamp>.md` with what changed, why, and verification results.
