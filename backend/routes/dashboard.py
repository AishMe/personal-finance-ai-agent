from fastapi import APIRouter, HTTPException, Header
from typing import Annotated
from db.supabase import supabase
from datetime import datetime, date
from collections import defaultdict

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/summary")
async def get_summary(
    user_id: Annotated[str | None, Header(alias="user-id")] = None
):
    if not user_id:
        raise HTTPException(status_code=401, detail="No user_id header")
    try:
        # Fetch profile
        profile = supabase.table("profiles") \
            .select("*") \
            .eq("id", user_id) \
            .single() \
            .execute().data

        # Current month transactions
        now = datetime.now()
        month_start = date(now.year, now.month, 1).isoformat()

        transactions = supabase.table("transactions") \
            .select("*") \
            .eq("user_id", user_id) \
            .gte("date", month_start) \
            .execute().data

        # All transactions for trend (last 6 months)
        all_transactions = supabase.table("transactions") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("date", desc=False) \
            .execute().data

        # Calculate monthly summaries
        monthly = defaultdict(lambda: {"income": 0, "expense": 0})
        for t in all_transactions:
            month = t["date"][:7]  # e.g. "2026-03"
            monthly[month][t["type"]] += t["amount"]

        # Category breakdown for current month
        categories = defaultdict(float)
        total_expenses = 0
        total_income = 0

        for t in transactions:
            if t["type"] == "expense":
                categories[t["category"]] += t["amount"]
                total_expenses += t["amount"]
            else:
                total_income += t["amount"]

        monthly_income = profile.get("monthly_income", 0)
        savings_goal = profile.get("savings_goal", 0)
        balance = monthly_income - total_expenses
        savings_rate = (balance / monthly_income * 100) if monthly_income > 0 else 0

        return {
            "summary": {
                "monthly_income": monthly_income,
                "total_expenses": total_expenses,
                "balance": balance,
                "savings_goal": savings_goal,
                "savings_rate": round(savings_rate, 1),
                "currency": profile.get("currency", "INR"),
            },
            "category_breakdown": [
                {"name": cat, "value": round(amt)}
                for cat, amt in sorted(
                    categories.items(), key=lambda x: -x[1]
                )
            ],
            "monthly_trend": [
                {
                    "month": month,
                    "income": round(data["income"]),
                    "expense": round(data["expense"]),
                }
                for month, data in sorted(monthly.items())[-6:]
            ],
            "recent_transactions": sorted(
                all_transactions, key=lambda x: x["date"], reverse=True
            )[:5],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))