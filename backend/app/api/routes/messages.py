
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from google.genai.errors import APIError

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.ai_request import AIRequest
from app.schemas.message import (
    MessageCreate,
    MessageResponse,
    MessagePairResponse,
)
from app.services.ai_service import generate_ai_response_with_usage
from app.core.config import GEMINI_MODEL


logger = logging.getLogger(__name__)


def add_ai_request_record(
    db: Session,
    current_user: User,
    conversation: Conversation,
    *,
    succeeded: bool,
    usage: dict | None = None,
    error_message: str | None = None,
) -> None:
    usage = usage or {}
    db.add(AIRequest(
        user_id=current_user.id,
        conversation_id=conversation.id,
        model_name=GEMINI_MODEL,
        status="success" if succeeded else "failed",
        prompt_tokens=usage.get("prompt_tokens"),
        completion_tokens=usage.get("completion_tokens"),
        total_tokens=usage.get("total_tokens"),
        error_message=error_message[:500] if error_message else None,
    ))

router = APIRouter(
    prefix="/api/conversations/{conversation_id}/messages",
    tags=["Messages"],
)


def get_user_conversation(
    conversation_id: int,
    db: Session,
    current_user: User,
):
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    return conversation


@router.post(
    "",
    response_model=MessagePairResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_message(
    conversation_id: int,
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = get_user_conversation(
        conversation_id,
        db,
        current_user,
    )

    # 1. Save user message
    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=data.content,
    )

    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    # 2. Get conversation history
    history = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc(), Message.id.asc())
        .all()
    )

    messages = [
        {
            "role": message.role,
            "content": message.content,
        }
        for message in history
    ]

    # 3. Generate AI response
    try:
        ai_reply, usage = generate_ai_response_with_usage(messages)

    except APIError as error:
        logger.exception("Gemini API request failed")
        add_ai_request_record(
            db,
            current_user,
            conversation,
            succeeded=False,
            error_message=f"Gemini API error {error.code}",
        )
        db.commit()

        if error.code == 503:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is temporarily unavailable. Please try again later.",
            )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service request failed.",
        )
    except Exception as error:
        logger.exception("Unexpected AI service failure")
        add_ai_request_record(
            db,
            current_user,
            conversation,
            succeeded=False,
            error_message=f"{type(error).__name__}: AI service failure",
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service request failed.",
        )

    # 4. Save assistant message
    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=ai_reply,
    )

    db.add(assistant_message)
    add_ai_request_record(db, current_user, conversation, succeeded=True, usage=usage)
    conversation.updated_at = func.now()

    db.commit()
    db.refresh(assistant_message)

    # 5. Return both messages
    return {
        "user_message": user_message,
        "assistant_message": assistant_message,
    }


@router.post(
    "/regenerate",
    response_model=MessageResponse,
)
def regenerate_last_response(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = get_user_conversation(conversation_id, db, current_user)
    history = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc(), Message.id.asc())
        .all()
    )

    if not history or history[-1].role != "assistant":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="There is no assistant response to regenerate.",
        )

    assistant_message = history[-1]
    prompt_history = [
        {"role": message.role, "content": message.content}
        for message in history[:-1]
    ]

    try:
        assistant_text, usage = generate_ai_response_with_usage(prompt_history)
        assistant_message.content = assistant_text
    except APIError as error:
        logger.exception("Gemini API request failed during regeneration")
        db.rollback()
        add_ai_request_record(
            db,
            current_user,
            conversation,
            succeeded=False,
            error_message=f"Gemini API error {error.code}",
        )
        db.commit()
        if error.code == 503:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is temporarily unavailable. Please try again later.",
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service request failed.",
        )
    except Exception as error:
        logger.exception("Unexpected AI service failure during regeneration")
        db.rollback()
        add_ai_request_record(
            db,
            current_user,
            conversation,
            succeeded=False,
            error_message=f"{type(error).__name__}: AI service failure",
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service request failed.",
        )

    add_ai_request_record(db, current_user, conversation, succeeded=True, usage=usage)
    conversation.updated_at = func.now()
    db.commit()
    db.refresh(assistant_message)
    return assistant_message


@router.get(
    "",
    response_model=list[MessageResponse],
)
def get_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = get_user_conversation(
        conversation_id,
        db,
        current_user,
    )

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(
            Message.created_at.asc(),
            Message.id.asc(),
        )
        .all()
    )

    return messages
