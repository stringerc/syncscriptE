"""Align agent_registry with SQLModel (documentation_url, metrics).

Revision ID: b2c3d4e5f6a7
Revises: 75c7e2369caa
Create Date: 2026-04-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "75c7e2369caa"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "agent_registry",
        sa.Column("documentation_url", sa.String(), nullable=True),
    )
    op.add_column(
        "agent_registry",
        sa.Column("last_scraped", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "agent_registry",
        sa.Column("avg_latency", sa.Float(), nullable=False, server_default="0"),
    )
    op.add_column(
        "agent_registry",
        sa.Column("success_rate", sa.Float(), nullable=False, server_default="1"),
    )


def downgrade() -> None:
    op.drop_column("agent_registry", "success_rate")
    op.drop_column("agent_registry", "avg_latency")
    op.drop_column("agent_registry", "last_scraped")
    op.drop_column("agent_registry", "documentation_url")
