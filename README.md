# Life OS

Life OS is a cross-platform foundation for a personal operating system driven by autonomous agents. This repository currently contains the MVP backend skeleton with a modular agent runtime, asynchronous workers, and Docker-based local development.

## Current Scope

- FastAPI backend
- JWT authentication and user accounts
- PostgreSQL persistence
- Redis broker
- Celery workers and scheduler
- Modular agents with a shared execution contract
- Alembic migrations
- Minimal Next.js dashboard
- MVP agents:
  - Weather
  - News
  - Productivity

## Local Run

1. Start the stack:

```bash
./run.sh
```

This script will create `.env` from `.env.example` automatically if needed, then launch the full Docker stack.

2. Open:

- API: `http://localhost:8000`
- OpenAPI: `http://localhost:8000/api/v1/openapi.json`
- Web dashboard: `http://localhost:3000`

## Local CORS

The backend accepts local development origins from `localhost`, `127.0.0.1`, `0.0.0.0`, and common private LAN IP ranges through `BACKEND_CORS_ORIGIN_REGEX` in `.env`.

## Stop The Stack

```bash
./stop.sh
```

## Key Endpoints

- `GET /api/v1/health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/agents`
- `POST /api/v1/agents/{agent_key}/trigger`
- `GET /api/v1/agents/{agent_key}/results`
- `GET /api/v1/results/latest`

## Repo Layout

- `apps/backend`: FastAPI app, agent framework, workers, models
- `apps/web`: minimal Next.js dashboard
- `infra/docker`: container images
- `docs`: architecture notes
