from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class AgentConfigUpsert(BaseModel):
    config: dict[str, Any] = Field(default_factory=dict)


class AgentConfigRead(BaseModel):
    id: int
    agent_key: str
    config: dict[str, Any]
    updated_at: datetime
