# Life OS Architecture

## Backend

- `FastAPI` exposes the application API.
- JWT auth secures user-scoped endpoints.
- `PostgreSQL` stores users, agent definitions, agent runs, and results.
- `Redis` powers Celery message passing and caching-ready infrastructure.
- `Celery` workers execute agents asynchronously.
- `Celery Beat` schedules recurring agent runs.
- `Alembic` owns schema evolution and replaces runtime `create_all`.

## Agent Model

Each agent follows the same pipeline:

1. Collect inputs from APIs, sensors, or the database.
2. Process those inputs into domain context.
3. Decide on a recommendation or next step.
4. Act by returning a result that is persisted and can later emit events.

## Extensibility

New agents only need:

1. A class inheriting from `BaseAgent`
2. Registration in `app/agents/registry.py`
3. Optional schedule entry in `app/agents/scheduler.py`
4. Optional external client module

## Web Dashboard

- `Next.js` provides a thin control surface over the backend API.
- Authentication happens against backend JWT endpoints.
- The dashboard currently supports:
  - account creation
  - sign-in
  - listing agents
  - triggering agents
  - reading latest runs
