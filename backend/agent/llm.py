import httpx
import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "openrouter/free"

async def chat_with_ai(messages: list, system_prompt: str = None) -> str:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Finance Agent",
    }

    full_messages = []
    if system_prompt:
        full_messages.append({"role": "system", "content": system_prompt})
    full_messages.extend(messages)

    payload = {
        "model": MODEL,
        "messages": full_messages,
        "max_tokens": 4000,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            OPENROUTER_URL,
            headers=headers,
            json=payload,
            timeout=30.0,
        )
        response.raise_for_status()
        data = response.json()

        # Debug: print full response so we can see what came back
        # print("OPENROUTER RESPONSE:", data)

        # Safe extraction — handle unexpected response shapes
        choices = data.get("choices")
        if not choices or len(choices) == 0:
            raise ValueError(f"No choices in response: {data}")

        message = choices[0].get("message", {})
        content = message.get("content")

        # Fallback: some reasoning models use 'reasoning' field
        if content is None:
            content = message.get("reasoning")

        if content is None:
            raise ValueError(f"No content in response: {data}")

        return content