from __future__ import annotations

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    email: str
    password: str = Field(min_length=8)
    full_name: str | None = None


class UserLogin(BaseModel):
    email: str
    password: str


class AccessToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
