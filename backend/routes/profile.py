from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Annotated
from db.supabase import supabase

router = APIRouter(prefix="/profile", tags=["profile"])

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    monthly_income: Optional[float] = None
    savings_goal: Optional[float] = None
    currency: Optional[str] = None

@router.get("/")
async def get_profile(user_id: Annotated[str | None, Header(alias="user-id")] = None):
    if not user_id:
        raise HTTPException(status_code=401, detail="No user_id header")
    try:
        result = supabase.table("profiles") \
            .select("*") \
            .eq("id", user_id) \
            .single() \
            .execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/")
async def update_profile(
    profile: ProfileUpdate,
    user_id: Annotated[str | None, Header(alias="user-id")] = None
):
    if not user_id:
        raise HTTPException(status_code=401, detail="No user_id header")
    try:
        data = {k: v for k, v in profile.model_dump().items() if v is not None}
        result = supabase.table("profiles") \
            .update(data) \
            .eq("id", user_id) \
            .execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))