from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class AdminProfile(BaseModel):
    id: int
    name: str
    email: EmailStr
    is_active: bool
    is_admin: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class UserStatusUpdate(BaseModel):
    is_active: bool


class DailyAIUsage(BaseModel):
    day: date
    requests: int
    succeeded: int
    failed: int


class AdminOverview(BaseModel):
    total_users: int
    total_conversations: int
    total_messages: int
    active_users: int
    new_users_today: int
    new_users_this_week: int
    new_users_this_month: int
    total_ai_requests: int
    successful_ai_requests: int
    failed_ai_requests: int
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    usage_last_30_days: list[DailyAIUsage]


class AdminUserRow(BaseModel):
    id: int
    name: str
    email: EmailStr
    is_active: bool
    is_admin: bool
    created_at: datetime
    conversation_count: int
    message_count: int
    ai_request_count: int


class AdminUserPage(BaseModel):
    items: list[AdminUserRow]
    total: int
    limit: int
    offset: int


class AdminUserDetail(AdminUserRow):
    pass


class AdminConversationRow(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_email: EmailStr
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int


class AdminConversationPage(BaseModel):
    items: list[AdminConversationRow]
    total: int
    limit: int
    offset: int


class AdminMessageRow(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime


class AdminConversationDetail(AdminConversationRow):
    messages: list[AdminMessageRow]


class AdminAIRequestRow(BaseModel):
    id: int
    user_id: int | None
    user_name: str | None
    user_email: EmailStr | None
    conversation_id: int | None
    model_name: str
    status: Literal["success", "failed"]
    prompt_tokens: int | None
    completion_tokens: int | None
    total_tokens: int | None
    error_message: str | None
    created_at: datetime


class AdminAIRequestPage(BaseModel):
    items: list[AdminAIRequestRow]
    total: int
    limit: int
    offset: int


class AdminActivityRow(BaseModel):
    id: int
    admin_user_id: int | None
    admin_email: EmailStr
    action: str
    target_type: str
    target_id: int | None
    details: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminActivityPage(BaseModel):
    items: list[AdminActivityRow]
    total: int
    limit: int
    offset: int
