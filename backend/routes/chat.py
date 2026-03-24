from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Annotated
from agent.runner import run_agent
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
        user_context = build_user_context(user_id) if user_id else "No user data."
        messages = [m.model_dump() for m in request.messages]

        reply = await run_agent(
            messages=messages,
            user_id=user_id or "",
            user_context=user_context,
        )
        return ChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))