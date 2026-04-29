from datetime import datetime, timezone

from sqlalchemy import desc, or_, select
from sqlalchemy.orm import Session

from app.agents.registry import registry
from app.db.models.agent import AgentDefinition
from app.db.models.agent_result import AgentResult
from app.db.models.agent_run import AgentRun
from app.db.models.user import User
from app.schemas.agent import AgentListItem, AgentRunRead, TriggerAgentRequest
class AgentService:
    def __init__(self, db: Session):
        self.db = db

    def list_agents(self) -> list[AgentListItem]:
        self._sync_registry()
        agents = self.db.scalars(select(AgentDefinition).order_by(AgentDefinition.key)).all()
        return [
            AgentListItem(
                key=agent.key,
                name=agent.name,
                description=agent.description,
                enabled=agent.enabled,
                schedule=agent.schedule,
                default_config=agent.default_config,
            )
            for agent in agents
        ]

    def trigger_agent(self, agent_key: str, payload: TriggerAgentRequest, user: User | None = None) -> AgentRunRead:
        agent_definition = self._get_agent_definition(agent_key)
        if not agent_definition.enabled:
            raise KeyError(f"Agent '{agent_key}' is disabled.")

        run = AgentRun(
            user_id=user.id if user is not None else None,
            agent_key=agent_key,
            status="queued",
            trigger_source=payload.trigger_source,
            payload=payload.payload,
        )
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)

        if payload.run_async:
            try:
                from app.workers.tasks import execute_agent_task

                execute_agent_task.delay(run.id)
            except Exception:
                self.process_run(run.id)
                self.db.refresh(run)
        else:
            self.process_run(run.id)
            self.db.refresh(run)

        return self._to_run_read(run)

    def list_agent_runs(self, agent_key: str, user: User) -> list[AgentRunRead]:
        runs = self.db.scalars(
            select(AgentRun)
            .where(AgentRun.agent_key == agent_key, or_(AgentRun.user_id == user.id, AgentRun.user_id.is_(None)))
            .order_by(desc(AgentRun.started_at))
            .limit(50)
        ).all()
        return [self._to_run_read(run) for run in runs]

    def latest_runs(self, user: User) -> list[AgentRunRead]:
        runs = self.db.scalars(
            select(AgentRun)
            .where(or_(AgentRun.user_id == user.id, AgentRun.user_id.is_(None)))
            .order_by(desc(AgentRun.started_at))
            .limit(20)
        ).all()
        return [self._to_run_read(run) for run in runs]

    def process_run(self, run_id: int) -> None:
        run = self.db.get(AgentRun, run_id)
        if run is None:
            raise KeyError(f"Run '{run_id}' not found.")

        agent = registry.create(run.agent_key)
        run.status = "running"
        self.db.commit()

        try:
            result = agent.execute(run.payload)
            run.status = "completed"
            run.summary = result.summary
            run.finished_at = datetime.now(timezone.utc)
            self.db.add(
                AgentResult(
                    run_id=run.id,
                    result_type=result.result_type,
                    content=result.content,
                )
            )
        except Exception as exc:
            run.status = "failed"
            run.error_message = str(exc)
            run.finished_at = datetime.now(timezone.utc)
            raise
        finally:
            self.db.commit()

    def _sync_registry(self) -> None:
        known = {item.key: item for item in self.db.scalars(select(AgentDefinition)).all()}
        for definition in registry.definitions():
            if definition.key not in known:
                self.db.add(
                    AgentDefinition(
                        key=definition.key,
                        name=definition.name,
                        description=definition.description,
                        enabled=True,
                        schedule=definition.schedule,
                        default_config=definition.default_config,
                    )
                )
        self.db.commit()

    def _get_agent_definition(self, agent_key: str) -> AgentDefinition:
        self._sync_registry()
        agent_definition = self.db.scalar(select(AgentDefinition).where(AgentDefinition.key == agent_key))
        if agent_definition is None:
            raise KeyError(f"Agent '{agent_key}' not found.")
        return agent_definition

    @staticmethod
    def _to_run_read(run: AgentRun) -> AgentRunRead:
        return AgentRunRead.model_validate(
            {
                "id": run.id,
                "user_id": run.user_id,
                "agent_key": run.agent_key,
                "status": run.status,
                "trigger_source": run.trigger_source,
                "payload": run.payload,
                "summary": run.summary,
                "error_message": run.error_message,
                "started_at": run.started_at,
                "finished_at": run.finished_at,
                "results": [
                    {
                        "id": result.id,
                        "result_type": result.result_type,
                        "content": result.content,
                        "created_at": result.created_at,
                    }
                    for result in run.results
                ],
            }
        )
