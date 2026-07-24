# Leveling System

An RPG-inspired productivity app for planning tasks and goals, earning EXP, leveling up, tracking streaks, and unlocking achievement badges.

Task and goal timelines use bounded cursor pagination and virtualized calendar rendering. Stats use bounded timelines, local-calendar timezone semantics, and cached client queries.

## Stack

- React, TypeScript, Vite, and Tailwind CSS
- FastAPI and async SQLAlchemy
- PostgreSQL with Alembic migrations
- Docker Compose with separate web, API, scheduler, and database services

## Local Setup

Requirements: Docker Desktop and optional Google OAuth credentials.

```powershell
Copy-Item .env.docker.example .env.docker
docker compose --env-file .env.docker up -d --build
```

Open `http://localhost:5173`.

For Google login, configure these exact Google OAuth values:

```text
Authorized origin: http://localhost:5173
Redirect URI:     http://localhost:5173/api/auth/callback
```

Guest login is enabled by default only for local development. Set a long random `JWT_SECRET` in `.env.docker` before keeping real data.

## Operations

```powershell
# Status
docker compose --env-file .env.docker ps

# Logs
docker compose --env-file .env.docker logs -f backend scheduler

# Restart after environment-only changes
docker compose --env-file .env.docker up -d --no-build

# Stop while preserving database data
docker compose --env-file .env.docker down
```

Database migrations run automatically before the API starts. The dedicated scheduler catches up on startup, checks overdue tasks every minute, and persists job health:

```powershell
Invoke-RestMethod http://localhost:5173/api/health/scheduler
```

## Load Testing

Load tests use an isolated Compose project and database volume. Results are written to the ignored `load-tests/results` directory.

```powershell
# 100 users / 20,000 tasks, then 100 RPS Stats for five minutes
.\load-tests\run.ps1 seed smoke
.\load-tests\run.ps1 warm

# 10,000 users / 2,000,000 tasks and scheduler/concurrency checks
.\load-tests\run.ps1 seed capacity
.\load-tests\run.ps1 scheduler
.\load-tests\run.ps1 achievements

# Other traffic profiles and cleanup
.\load-tests\run.ps1 mixed
.\load-tests\run.ps1 write
.\load-tests\run.ps1 spike
.\load-tests\run.ps1 cleanup
```

Local k6 results are a regression signal, not proof of cloud capacity.

## Production

Start from `.env.production.example`, use HTTPS, keep guest login disabled unless it is intentionally offered, and place the frontend/API behind one trusted same-origin reverse proxy.

Sites can host the web surface, but the current Python API, PostgreSQL database, and scheduler still require an external container host or a future migration to the Sites Worker and D1 runtime.

Production changes are recorded in [`docs/change-logs`](docs/change-logs).
