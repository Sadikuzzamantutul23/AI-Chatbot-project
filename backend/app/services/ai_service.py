
from google import genai

from app.core.config import GEMINI_API_KEY, GEMINI_MODEL


client = genai.Client(api_key=GEMINI_API_KEY)


def generate_ai_response(messages: list[dict]) -> str:
    gemini_messages = []

    for message in messages:
        role = message["role"]

        # Gemini uses "model" instead of "assistant"
        if role == "assistant":
            role = "model"

        gemini_messages.append({
            "role": role,
            "parts": [
                {"text": message["content"]}
            ],
        })

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=gemini_messages,
    )

    return response.text or ""
