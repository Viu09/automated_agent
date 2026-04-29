from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.agent import AgentRunRead
from app.services.agent_service import AgentService

router = APIRouter()


@router.get("/latest", response_model=list[AgentRunRead])
async def get_latest_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AgentRunRead]:
    return AgentService(db).latest_runs(user=current_user)
