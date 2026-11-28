import json
from datetime import date, datetime, time, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.dependencies import get_admin_user, get_db
from app.models.admin_activity import AdminActivity
from app.models.ai_request import AIRequest
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.schemas.admin import (
    AdminActivityPage,
    AdminAIRequestPage,
    AdminConversationDetail,
    AdminConversationPage,
    AdminOverview,
    AdminProfile,
    AdminUserDetail,
    AdminUserPage,
    PasswordChangeRequest,
    UserStatusUpdate,
)


router = APIRouter(prefix="/api/admin", tags=["Admin"])


def record_activity(
    db: Session,
    admin: User,
    action: str,
    target_type: str,
    target_id: int | None = None,
    details: dict | None = None,
) -> None:
    db.add(AdminActivity(
        admin_user_id=admin.id,
        admin_email=admin.email,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=json.dumps(details, ensure_ascii=False) if details else None,
    ))


def get_user_or_404(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def user_row(db: Session, user: User) -> dict:
    conversations = db.query(func.count(Conversation.id)).filter(
        Conversation.user_id == user.id
    ).scalar() or 0
    messages = (
        db.query(func.count(Message.id))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .filter(Conversation.user_id == user.id)
        .scalar()
        or 0
    )
    ai_requests = db.query(func.count(AIRequest.id)).filter(
        AIRequest.user_id == user.id
    ).scalar() or 0
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "is_active": user.is_active,
        "is_admin": user.is_admin,
        "created_at": user.created_at,
        "conversation_count": conversations,
        "message_count": messages,
        "ai_request_count": ai_requests,
    }


@router.get("/profile", response_model=AdminProfile)
def get_admin_profile(admin: User = Depends(get_admin_user)):
    return admin


@router.patch("/profile/password", response_model=AdminProfile)
def change_admin_password(
    data: PasswordChangeRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    if not verify_password(data.current_password, admin.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if data.current_password == data.new_password:
        raise HTTPException(status_code=400, detail="New password must be different")

    admin.hashed_password = hash_password(data.new_password)
    record_activity(db, admin, "password_changed", "admin", admin.id)
    db.commit()
    db.refresh(admin)
    return admin


@router.get("/overview", response_model=AdminOverview)
def get_overview(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    today = date.today()
    today_start = datetime.combine(today, time.min)
    week_start = datetime.combine(today - timedelta(days=today.weekday()), time.min)
    month_start = datetime.combine(today.replace(day=1), time.min)
    thirty_days_ago = datetime.combine(today - timedelta(days=29), time.min)

    count_users = db.query(func.count(User.id))
    total_users = count_users.scalar() or 0
    total_conversations = db.query(func.count(Conversation.id)).scalar() or 0
    total_messages = db.query(func.count(Message.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0
    new_today = db.query(func.count(User.id)).filter(User.created_at >= today_start).scalar() or 0
    new_week = db.query(func.count(User.id)).filter(User.created_at >= week_start).scalar() or 0
    new_month = db.query(func.count(User.id)).filter(User.created_at >= month_start).scalar() or 0

    total_ai = db.query(func.count(AIRequest.id)).scalar() or 0
    succeeded = db.query(func.count(AIRequest.id)).filter(AIRequest.status == "success").scalar() or 0
    failed = db.query(func.count(AIRequest.id)).filter(AIRequest.status == "failed").scalar() or 0
    prompt_tokens = db.query(func.coalesce(func.sum(AIRequest.prompt_tokens), 0)).scalar() or 0
    completion_tokens = db.query(func.coalesce(func.sum(AIRequest.completion_tokens), 0)).scalar() or 0
    total_tokens = db.query(func.coalesce(func.sum(AIRequest.total_tokens), 0)).scalar() or 0

    day_column = func.date(AIRequest.created_at).label("day")
    daily_rows = (
        db.query(
            day_column,
            func.count(AIRequest.id).label("requests"),
            func.sum(case((AIRequest.status == "success", 1), else_=0)).label("succeeded"),
            func.sum(case((AIRequest.status == "failed", 1), else_=0)).label("failed"),
        )
        .filter(AIRequest.created_at >= thirty_days_ago)
        .group_by(day_column)
        .all()
    )
    daily_by_date = {row.day: row for row in daily_rows}
    daily_usage = []
    for day_offset in range(30):
        usage_day = today - timedelta(days=29 - day_offset)
        row = daily_by_date.get(usage_day)
        daily_usage.append({
            "day": usage_day,
            "requests": row.requests if row else 0,
            "succeeded": (row.succeeded or 0) if row else 0,
            "failed": (row.failed or 0) if row else 0,
        })

    return {
        "total_users": total_users,
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "active_users": active_users,
        "new_users_today": new_today,
        "new_users_this_week": new_week,
        "new_users_this_month": new_month,
        "total_ai_requests": total_ai,
        "successful_ai_requests": succeeded,
        "failed_ai_requests": failed,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_tokens": total_tokens,
        "usage_last_30_days": daily_usage,
    }


@router.get("/users", response_model=AdminUserPage)
def list_users(
    search: str | None = Query(default=None, max_length=255),
    account_status: Literal["all", "active", "inactive"] = "all",
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    query = db.query(User)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter((User.name.ilike(search_term)) | (User.email.ilike(search_term)))
    if account_status == "active":
        query = query.filter(User.is_active.is_(True))
    elif account_status == "inactive":
        query = query.filter(User.is_active.is_(False))

    total = query.count()
    users = query.order_by(User.created_at.desc(), User.id.desc()).offset(offset).limit(limit).all()
    return {"items": [user_row(db, user) for user in users], "total": total, "limit": limit, "offset": offset}


@router.get("/users/{user_id}", response_model=AdminUserDetail)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    return user_row(db, get_user_or_404(db, user_id))


@router.patch("/users/{user_id}/status", response_model=AdminUserDetail)
def update_user_status(
    user_id: int,
    data: UserStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    user = get_user_or_404(db, user_id)
    if user.id == admin.id and not data.is_active:
        raise HTTPException(status_code=409, detail="You cannot deactivate your own admin account")
    user.is_active = data.is_active
    record_activity(
        db,
        admin,
        "user_activated" if data.is_active else "user_deactivated",
        "user",
        user.id,
        {"is_active": data.is_active},
    )
    db.commit()
    db.refresh(user)
    return user_row(db, user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    user = get_user_or_404(db, user_id)
    if user.id == admin.id:
        raise HTTPException(status_code=409, detail="You cannot delete your own admin account")
    record_activity(db, admin, "user_deleted", "user", user.id)
    db.delete(user)
    db.commit()


@router.get("/conversations", response_model=AdminConversationPage)
def list_all_conversations(
    search: str | None = Query(default=None, max_length=255),
    user_id: int | None = None,
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    message_counts = (
        db.query(Message.conversation_id.label("conversation_id"), func.count(Message.id).label("message_count"))
        .group_by(Message.conversation_id)
        .subquery()
    )
    query = (
        db.query(Conversation, User.name, User.email, func.coalesce(message_counts.c.message_count, 0))
        .join(User, User.id == Conversation.user_id)
        .outerjoin(message_counts, message_counts.c.conversation_id == Conversation.id)
    )
    count_query = db.query(func.count(Conversation.id)).join(User, User.id == Conversation.user_id)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter((Conversation.title.ilike(search_term)) | (User.name.ilike(search_term)) | (User.email.ilike(search_term)))
        count_query = count_query.filter((Conversation.title.ilike(search_term)) | (User.name.ilike(search_term)) | (User.email.ilike(search_term)))
    if user_id is not None:
        query = query.filter(Conversation.user_id == user_id)
        count_query = count_query.filter(Conversation.user_id == user_id)

    rows = query.order_by(Conversation.updated_at.desc()).offset(offset).limit(limit).all()
    items = [{
        "id": conversation.id,
        "user_id": conversation.user_id,
        "user_name": name,
        "user_email": email,
        "title": conversation.title,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
        "message_count": message_count,
    } for conversation, name, email, message_count in rows]
    return {"items": items, "total": count_query.scalar() or 0, "limit": limit, "offset": offset}


@router.get("/conversations/{conversation_id}", response_model=AdminConversationDetail)
def get_conversation_detail(
    conversation_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    row = (
        db.query(Conversation, User.name, User.email)
        .join(User, User.id == Conversation.user_id)
        .filter(Conversation.id == conversation_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conversation, name, email = row
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc(), Message.id.asc())
        .all()
    )
    return {
        "id": conversation.id,
        "user_id": conversation.user_id,
        "user_name": name,
        "user_email": email,
        "title": conversation.title,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
        "message_count": len(messages),
        "messages": messages,
    }


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    record_activity(db, admin, "conversation_deleted", "conversation", conversation.id)
    db.delete(conversation)
    db.commit()


@router.get("/ai-usage", response_model=AdminAIRequestPage)
def list_ai_requests(
    user_id: int | None = None,
    request_status: Literal["success", "failed"] | None = None,
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    query = db.query(AIRequest, User.name, User.email).outerjoin(User, User.id == AIRequest.user_id)
    if user_id is not None:
        query = query.filter(AIRequest.user_id == user_id)
    if request_status:
        query = query.filter(AIRequest.status == request_status)
    total = query.count()
    rows = query.order_by(AIRequest.created_at.desc(), AIRequest.id.desc()).offset(offset).limit(limit).all()
    items = [{
        "id": request.id,
        "user_id": request.user_id,
        "user_name": name,
        "user_email": email,
        "conversation_id": request.conversation_id,
        "model_name": request.model_name,
        "status": request.status,
        "prompt_tokens": request.prompt_tokens,
        "completion_tokens": request.completion_tokens,
        "total_tokens": request.total_tokens,
        "error_message": request.error_message,
        "created_at": request.created_at,
    } for request, name, email in rows]
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.get("/activity", response_model=AdminActivityPage)
def list_admin_activity(
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    query = db.query(AdminActivity)
    total = query.count()
    items = query.order_by(AdminActivity.created_at.desc(), AdminActivity.id.desc()).offset(offset).limit(limit).all()
    return {"items": items, "total": total, "limit": limit, "offset": offset}
