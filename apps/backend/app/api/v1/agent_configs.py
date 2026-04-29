from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.agent_config import AgentConfigRead, AgentConfigUpsert
from app.services.agent_config_service import AgentConfigService

router = APIRouter()


@router.get("", response_model=list[AgentConfigRead])
async def list_agent_configs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AgentConfigRead]:
    return AgentConfigService(db).list_for_user(current_user)


@router.put("/{agent_key}", response_model=AgentConfigRead)
async def upsert_agent_config(
    agent_key: str,
    payload: AgentConfigUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AgentConfigRead:
    return AgentConfigService(db).upsert(current_user, agent_key, payload)
