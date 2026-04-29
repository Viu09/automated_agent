from app.db.session import SessionLocal
from app.schemas.agent import TriggerAgentRequest
from app.services.agent_service import AgentService
from app.workers.celery_app import celery_app


@celery_app.task(name="app.workers.tasks.execute_agent_task")
def execute_agent_task(run_id: int) -> None:
    db = SessionLocal()
    try:
        AgentService(db).process_run(run_id)
    finally:
        db.close()


@celery_app.task(name="app.workers.tasks.execute_agent_by_key_task")
def execute_agent_by_key_task(agent_key: str) -> None:
    db = SessionLocal()
    try:
        AgentService(db).trigger_agent(
            agent_key=agent_key,
            payload=TriggerAgentRequest(payload={}, trigger_source="schedule", run_async=False),
        )
    finally:
        db.close()
