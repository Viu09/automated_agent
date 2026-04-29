from fastapi import APIRouter

from app.api.v1.agent_configs import router as agent_configs_router
from app.api.v1.agents import router as agents_router
from app.api.v1.auth import router as auth_router
from app.api.v1.health import router as health_router
from app.api.v1.results import router as results_router
from app.api.v1.users import router as users_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(agent_configs_router, prefix="/agent-configs", tags=["agent-configs"])
api_router.include_router(agents_router, prefix="/agents", tags=["agents"])
api_router.include_router(results_router, prefix="/results", tags=["results"])
