from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agents.registry import registry
from app.db.models.agent import AgentDefinition


def sync_agent_registry(db: Session) -> None:
    known = {item.key: item for item in db.scalars(select(AgentDefinition)).all()}

    for definition in registry.definitions():
        if definition.key not in known:
            db.add(
                AgentDefinition(
                    key=definition.key,
                    name=definition.name,
                    description=definition.description,
                    enabled=True,
                    schedule=definition.schedule,
                    default_config=definition.default_config,
                )
            )

    db.commit()
