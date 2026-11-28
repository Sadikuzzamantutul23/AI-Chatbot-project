from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class AIRequest(Base):
    __tablename__ = "ai_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    conversation_id = Column(
        Integer,
        ForeignKey("conversations.id", ondelete="SET NULL"),
        nullable=True,
    )
    model_name = Column(String(120), nullable=False)
    status = Column(String(20), nullable=False)
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    total_tokens = Column(Integer, nullable=True)
    error_message = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("ix_ai_requests_status_created_at", "status", "created_at"),
        Index("ix_ai_requests_user_created_at", "user_id", "created_at"),
    )
