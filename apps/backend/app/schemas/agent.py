from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class TriggerAgentRequest(BaseModel):
    payload: dict[str, Any] = Field(default_factory=dict)
    trigger_source: str = "manual"
    run_async: bool = True


class AgentListItem(BaseModel):
    key: str
    name: str
    description: str
    enabled: bool
    schedule: str | None = None
    default_config: dict[str, Any] = Field(default_factory=dict)


class AgentResultRead(BaseModel):
    id: int
    result_type: str
    content: dict[str, Any]
    created_at: datetime


class AgentRunRead(BaseModel):
    id: int
    user_id: int | None = None
    agent_key: str
    status: str
    trigger_source: str
    payload: dict[str, Any]
    summary: str | None = None
    error_message: str | None = None
    started_at: datetime
    finished_at: datetime | None = None
    results: list[AgentResultRead] = Field(default_factory=list)
