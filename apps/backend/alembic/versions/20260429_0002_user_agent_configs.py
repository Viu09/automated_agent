"""Add user agent configs

Revision ID: 20260429_0002
Revises: 20260429_0001
Create Date: 2026-04-29 00:30:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260429_0002"
down_revision = "20260429_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_agent_configs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("agent_key", sa.String(length=100), nullable=False),
        sa.Column("config", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_user_agent_configs_id", "user_agent_configs", ["id"], unique=False)
    op.create_index("ix_user_agent_configs_user_id", "user_agent_configs", ["user_id"], unique=False)
    op.create_index("ix_user_agent_configs_agent_key", "user_agent_configs", ["agent_key"], unique=False)
    op.create_unique_constraint("uq_user_agent_config_user_agent", "user_agent_configs", ["user_id", "agent_key"])


def downgrade() -> None:
    op.drop_constraint("uq_user_agent_config_user_agent", "user_agent_configs", type_="unique")
    op.drop_index("ix_user_agent_configs_agent_key", table_name="user_agent_configs")
    op.drop_index("ix_user_agent_configs_user_id", table_name="user_agent_configs")
    op.drop_index("ix_user_agent_configs_id", table_name="user_agent_configs")
    op.drop_table("user_agent_configs")
