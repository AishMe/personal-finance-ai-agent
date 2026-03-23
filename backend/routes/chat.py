from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Annotated
from agent.llm import chat_with_ai
from agent.prompts import build_system_prompt
from agent.context import build_user_context

router = APIRouter(prefix="/chat", tags=["chat"])

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[Message]

class ChatResponse(BaseModel):
    reply: str

@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    user_id: Annotated[str | None, Header(alias="user-id")] = None
):
    try:
        # Build personalized context from user's real data
        if user_id:
            user_context = build_user_context(user_id)
        else:
            user_context = "No user data available."

        system_prompt = build_system_prompt(user_context)
        messages = [m.model_dump() for m in request.messages]

        reply = await chat_with_ai(
            messages=messages,
            system_prompt=system_prompt,
        )
        return ChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))