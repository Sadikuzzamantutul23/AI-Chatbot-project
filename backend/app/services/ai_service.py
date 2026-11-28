
from google import genai

from app.core.config import GEMINI_API_KEY, GEMINI_MODEL


client = genai.Client(api_key=GEMINI_API_KEY)


def generate_ai_response_with_usage(messages: list[dict]) -> tuple[str, dict[str, int | None]]:
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

    metadata = getattr(response, "usage_metadata", None)
    usage = {
        "prompt_tokens": getattr(metadata, "prompt_token_count", None),
        "completion_tokens": getattr(metadata, "candidates_token_count", None),
        "total_tokens": getattr(metadata, "total_token_count", None),
    }
    return response.text or "", usage


def generate_ai_response(messages: list[dict]) -> str:
    """Keep the original service interface for existing callers."""
    response, _usage = generate_ai_response_with_usage(messages)
    return response
