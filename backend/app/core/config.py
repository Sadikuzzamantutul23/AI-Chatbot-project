
import os
from pathlib import Path

from dotenv import load_dotenv

env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(env_path)

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)

# Gemini Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash")

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is missing from backend/.env")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing from backend/.env")

if not GEMINI_MODEL:
    raise RuntimeError("GEMINI_MODEL is missing from backend/.env")
