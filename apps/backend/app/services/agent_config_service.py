from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.user import User
from app.db.models.user_agent_config import UserAgentConfig
from app.schemas.agent_config import AgentConfigRead, AgentConfigUpsert


class AgentConfigService:
    def __init__(self, db: Session):
        self.db = db

    def list_for_user(self, user: User) -> list[AgentConfigRead]:
        configs = self.db.scalars(
            select(UserAgentConfig).where(UserAgentConfig.user_id == user.id).order_by(UserAgentConfig.agent_key)
        ).all()
        return [self._to_read(item) for item in configs]

    def upsert(self, user: User, agent_key: str, payload: AgentConfigUpsert) -> AgentConfigRead:
        config = self.db.scalar(
            select(UserAgentConfig).where(UserAgentConfig.user_id == user.id, UserAgentConfig.agent_key == agent_key)
        )
        if config is None:
            config = UserAgentConfig(user_id=user.id, agent_key=agent_key, config=payload.config)
            self.db.add(config)
        else:
            config.config = payload.config
        self.db.commit()
        self.db.refresh(config)
        return self._to_read(config)

    @staticmethod
    def _to_read(item: UserAgentConfig) -> AgentConfigRead:
        return AgentConfigRead.model_validate(
            {
                "id": item.id,
                "agent_key": item.agent_key,
                "config": item.config,
                "updated_at": item.updated_at,
            }
        )
