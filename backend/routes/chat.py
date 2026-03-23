from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agent.llm import chat_with_ai
from agent.prompts import FINANCE_SYSTEM_PROMPT

router = APIRouter(prefix="/chat", tags=["chat"])

class Message(BaseModel):
    role: str   # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: list[Message]

class ChatResponse(BaseModel):
    reply: str

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        messages = [m.model_dump() for m in request.messages]
        reply = await chat_with_ai(
            messages=messages,
            system_prompt=FINANCE_SYSTEM_PROMPT,
        )
        return ChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))