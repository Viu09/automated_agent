from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.agent import AgentListItem, AgentRunRead, TriggerAgentRequest
from app.services.agent_service import AgentService

router = APIRouter()


@router.get("", response_model=list[AgentListItem])
async def list_agents(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[AgentListItem]:
    return AgentService(db).list_agents()


@router.post("/{agent_key}/trigger", response_model=AgentRunRead, status_code=status.HTTP_202_ACCEPTED)
async def trigger_agent(
    agent_key: str,
    payload: TriggerAgentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AgentRunRead:
    service = AgentService(db)
    try:
        return service.trigger_agent(agent_key=agent_key, payload=payload, user=current_user)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/{agent_key}/results", response_model=list[AgentRunRead])
async def get_agent_results(
    agent_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AgentRunRead]:
    return AgentService(db).list_agent_runs(agent_key=agent_key, user=current_user)
