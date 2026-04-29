from app.db.models.agent import AgentDefinition
from app.db.models.agent_run import AgentRun
from app.schemas.agent import AgentListItem, AgentRunRead


def to_agent_list_item(agent: AgentDefinition) -> AgentListItem:
    return AgentListItem(
        key=agent.key,
        name=agent.name,
        description=agent.description,
        enabled=agent.enabled,
        schedule=agent.schedule,
        default_config=agent.default_config,
    )


def to_run_read(run: AgentRun) -> AgentRunRead:
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
