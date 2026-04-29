from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(512), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    agent_runs: Mapped[list["AgentRun"]] = relationship(back_populates="user")
    agent_configs: Mapped[list["UserAgentConfig"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    preferences_record: Mapped["UserPreference | None"] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
    )


# Import related models so SQLAlchemy can resolve relationship targets
# when modules are loaded independently in worker processes.
from app.db.models.user_agent_config import UserAgentConfig  # noqa: E402,F401
from app.db.models.user_preference import UserPreference  # noqa: E402,F401
