from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class AdminActivity(Base):
    __tablename__ = "admin_activities"

    id = Column(Integer, primary_key=True, index=True)
    admin_user_id = Column(Integer, nullable=True, index=True)
    admin_email = Column(String(255), nullable=False)
    action = Column(String(80), nullable=False)
    target_type = Column(String(40), nullable=False)
    target_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
