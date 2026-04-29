from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class UserPreferenceUpsert(BaseModel):
    preferences: dict[str, Any] = Field(default_factory=dict)


class UserPreferenceRead(BaseModel):
    id: int
    preferences: dict[str, Any]
    updated_at: datetime
