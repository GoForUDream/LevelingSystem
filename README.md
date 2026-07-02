# Leveling System

A personal productivity app inspired by RPG progression. Create tasks and goals, complete them for EXP, level up, and unlock achievements over time.

The app is intended to run locally through Docker for personal use.

## What It Includes

- Calendar-based task planning
- Task priorities, recurring tasks, overdue handling, and EXP penalties
- Goals linked to tasks
- Levels, ranks, and achievement badges
- Stats and activity charts
- Google OAuth or guest login

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: FastAPI, SQLAlchemy async, APScheduler
- Database: PostgreSQL
- Runtime: Docker Compose

## Prerequisites

- Docker Desktop
- Google OAuth credentials, only if you want Google login

## Environment Setup

Copy the Docker env example:

```bash
copy .env.docker.example .env.docker
```

Edit `.env.docker`:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=replace-with-a-long-random-secret
```

For guest-only local use, Google credentials can stay empty.

## Google OAuth Setup

In Google Cloud Console, configure the OAuth client as a Web application.

Authorized JavaScript origin:

```text
http://localhost:5173
```

Authorized redirect URI:

```text
http://localhost:5173/api/auth/callback
```

The app uses Nginx to proxy `/api/*` from the frontend container to the backend container, so the OAuth callback uses port `5173`.

## Run The App

From the repository root:

```bash
docker compose --env-file .env.docker up -d --build
```

Open:

```text
http://localhost:5173
```

The running services are:

- `leveling_frontend`: serves the web app on `localhost:5173`
- `leveling_backend`: FastAPI backend inside the Docker network
- `leveling_db`: PostgreSQL database with persistent Docker volume storage

## Stop The App

```bash
docker compose --env-file .env.docker down
```

This stops containers but keeps database data in the Docker volume.

## Restart After Env Changes

If `.env.docker` changes:

```bash
docker compose --env-file .env.docker up -d --no-build
```

If source code or Dockerfiles change:

```bash
docker compose --env-file .env.docker up -d --build
```

## Auto Start On Windows

The compose services use `restart: unless-stopped`.

To start the app automatically after reboot:

1. Open Docker Desktop.
2. Go to Settings -> General.
3. Enable "Start Docker Desktop when you sign in".
4. Start the app once with `docker compose --env-file .env.docker up -d --build`.

After that, Docker should restart the containers when Docker Desktop starts.

## Useful Commands

View status:

```bash
docker compose --env-file .env.docker ps
```

View backend logs:

```bash
docker logs -f leveling_backend
```

View frontend logs:

```bash
docker logs -f leveling_frontend
```

Rebuild from scratch:

```bash
docker compose --env-file .env.docker down
docker compose --env-file .env.docker up -d --build
```

## Notes

- The backend runs an overdue-task checker on startup and at midnight UTC.
- PostgreSQL data is stored in the `postgres_data` Docker volume.
- `.env.docker` is ignored by Git and should not be committed.
