from fastapi import APIRouter
from db.supabase import supabase

router = APIRouter(prefix="/demo", tags=["demo"])

DEMO_USER_ID = "01bcfe03-fb3c-4e81-b2f7-b0ab6f6884d0"

@router.get("/user-id")
async def get_demo_user_id():
    """
    Returns the demo user ID.
    Frontend uses this to make API calls as the demo user
    without requiring authentication.
    """
    return { "user_id": DEMO_USER_ID, "name": "Demo User" }