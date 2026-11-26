
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from google.genai.errors import APIError

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.message import (
    MessageCreate,
    MessageResponse,
    MessagePairResponse,
)
from app.services.ai_service import generate_ai_response


logger = logging.getLogger(__name__)

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
        ai_reply = generate_ai_response(messages)

    except APIError as error:
        logger.exception("Gemini API request failed")

        if error.code == 503:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is temporarily unavailable. Please try again later.",
            )

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
        assistant_message.content = generate_ai_response(prompt_history)
    except APIError as error:
        logger.exception("Gemini API request failed during regeneration")
        db.rollback()
        if error.code == 503:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is temporarily unavailable. Please try again later.",
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service request failed.",
        )

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
