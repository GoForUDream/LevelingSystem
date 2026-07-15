# Leveling System

An RPG-inspired productivity app for planning tasks and goals, earning EXP, leveling up, tracking streaks, and unlocking achievement badges.

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

Database migrations run automatically before the API starts. The dedicated scheduler performs an overdue catch-up on startup and then runs at midnight UTC.

## Production

Start from `.env.production.example`, use HTTPS, keep guest login disabled unless it is intentionally offered, and place the frontend/API behind one trusted same-origin reverse proxy.

Sites can host the web surface, but the current Python API, PostgreSQL database, and scheduler still require an external container host or a future migration to the Sites Worker and D1 runtime.

Production changes are recorded in [`docs/change-logs`](docs/change-logs).
