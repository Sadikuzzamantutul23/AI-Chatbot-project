
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine
from app.api.routes.auth import router as auth_router
from app.api.routes.conversations import router as conversations_router
from app.api.routes.messages import router as messages_router
from app.api.routes.admin import router as admin_router


app = FastAPI(
    title="AI Chatbot API",
    description="Backend API for our AI Chatbot",
    version="1.0.0",
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


# Register API Routers
app.include_router(auth_router)
app.include_router(conversations_router)
app.include_router(messages_router)
app.include_router(admin_router)


@app.get("/")
def root():
    return {
        "message": "AI Chatbot Backend is running!"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI Chatbot API",
    }


@app.get("/db-health")
def database_health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "connected",
            "database": "ai_chatbot",
        }

    except Exception as error:
        return {
            "status": "error",
            "message": str(error),
        }
