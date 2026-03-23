from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Annotated
from datetime import date
from db.supabase import supabase

router = APIRouter(prefix="/transactions", tags=["transactions"])

class TransactionCreate(BaseModel):
    type: str
    amount: float
    category: str
    description: Optional[str] = ""
    date: Optional[str] = None

@router.get("/")
async def get_transactions(user_id: Annotated[str | None, Header()] = None):
    if not user_id:
        raise HTTPException(status_code=401, detail="No user_id header")
    try:
        result = supabase.table("transactions") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("date", desc=True) \
            .execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_transaction(
    tx: TransactionCreate,
    user_id: Annotated[str | None, Header()] = None
):
    if not user_id:
        raise HTTPException(status_code=401, detail="No user_id header")
    try:
        data = tx.model_dump()
        data["user_id"] = user_id
        if not data["date"]:
            data["date"] = str(date.today())
        result = supabase.table("transactions").insert(data).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: str,
    user_id: Annotated[str | None, Header()] = None
):
    if not user_id:
        raise HTTPException(status_code=401, detail="No user_id header")
    try:
        supabase.table("transactions") \
            .delete() \
            .eq("id", transaction_id) \
            .eq("user_id", user_id) \
            .execute()
        return {"message": "Deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))