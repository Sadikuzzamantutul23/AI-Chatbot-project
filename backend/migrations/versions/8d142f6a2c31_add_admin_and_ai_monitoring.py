"""add admin roles and AI usage audit tables

Revision ID: 8d142f6a2c31
Revises: 3eabd896dab6
Create Date: 2026-11-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8d142f6a2c31"
down_revision: Union[str, Sequence[str], None] = "3eabd896dab6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_admin", sa.Boolean(), server_default="0", nullable=False),
    )
    op.create_table(
        "ai_requests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("conversation_id", sa.Integer(), nullable=True),
        sa.Column("model_name", sa.String(length=120), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("prompt_tokens", sa.Integer(), nullable=True),
        sa.Column("completion_tokens", sa.Integer(), nullable=True),
        sa.Column("total_tokens", sa.Integer(), nullable=True),
        sa.Column("error_message", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_requests_id"), "ai_requests", ["id"], unique=False)
    op.create_index("ix_ai_requests_status_created_at", "ai_requests", ["status", "created_at"], unique=False)
    op.create_index("ix_ai_requests_user_created_at", "ai_requests", ["user_id", "created_at"], unique=False)
    op.create_table(
        "admin_activities",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("admin_user_id", sa.Integer(), nullable=True),
        sa.Column("admin_email", sa.String(length=255), nullable=False),
        sa.Column("action", sa.String(length=80), nullable=False),
        sa.Column("target_type", sa.String(length=40), nullable=False),
        sa.Column("target_id", sa.Integer(), nullable=True),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_admin_activities_id"), "admin_activities", ["id"], unique=False)
    op.create_index(op.f("ix_admin_activities_admin_user_id"), "admin_activities", ["admin_user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_admin_activities_admin_user_id"), table_name="admin_activities")
    op.drop_index(op.f("ix_admin_activities_id"), table_name="admin_activities")
    op.drop_table("admin_activities")
    op.drop_index("ix_ai_requests_user_created_at", table_name="ai_requests")
    op.drop_index("ix_ai_requests_status_created_at", table_name="ai_requests")
    op.drop_index(op.f("ix_ai_requests_id"), table_name="ai_requests")
    op.drop_table("ai_requests")
    op.drop_column("users", "is_admin")
