"""

Budget limits per category + real-time alert checking.

Supabase table required:
  budget_limits (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid references profiles(id) on delete cascade,
    category    text not null,
    amount      numeric not null,
    period      text default 'monthly',   -- 'monthly' for now
    created_at  timestamptz default now(),
    unique(user_id, category)
  )
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Annotated, Optional
from datetime import datetime, date
from collections import defaultdict

from db.supabase import supabase

router = APIRouter(prefix="/budget", tags=["budget"])


# ─── Models ───────────────────────────────────────────────────────────────────

class BudgetLimitUpsert(BaseModel):
    category: str
    amount: float          # monthly limit in user's currency


class AlertLevel(BaseModel):
    category: str
    limit: float
    spent: float
    percent: float         # spent / limit * 100
    level: str             # "ok" | "warning" | "danger" | "over"
    # "warning" = 75–99 %, "danger" = 100 %, "over" = exceeded


# ─── All valid categories (must match frontend) ────────────────────────────────

ALL_CATEGORIES = [
    "Food", "Transport", "Shopping", "Entertainment",
    "Health", "Housing", "Utilities", "Subscriptions", "Other",
]


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/limits")
async def get_limits(
    user_id: Annotated[str | None, Header(alias="user-id")] = None,
):
    """Return all budget limits for the user."""
    if not user_id:
        raise HTTPException(401, "Not logged in.")
    try:
        result = (
            supabase.table("budget_limits")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        return {"limits": result.data}
    except Exception:
        raise HTTPException(500, "Couldn't load your budget limits.")


@router.put("/limits/{category}")
async def upsert_limit(
    category: str,
    body: BudgetLimitUpsert,
    user_id: Annotated[str | None, Header(alias="user-id")] = None,
):
    """Create or update a budget limit for a category."""
    if not user_id:
        raise HTTPException(401, "Not logged in.")
    if category not in ALL_CATEGORIES:
        raise HTTPException(400, f"Unknown category '{category}'.")
    if body.amount <= 0:
        raise HTTPException(400, "Limit must be greater than zero.")

    try:
        supabase.table("budget_limits").upsert(
            {
                "user_id":  user_id,
                "category": category,
                "amount":   body.amount,
                "period":   "monthly",
            },
            on_conflict="user_id,category",
        ).execute()
        return {"ok": True, "category": category, "amount": body.amount}
    except Exception:
        raise HTTPException(500, "Couldn't save that limit. Please try again.")


@router.delete("/limits/{category}")
async def delete_limit(
    category: str,
    user_id: Annotated[str | None, Header(alias="user-id")] = None,
):
    """Remove a budget limit for a category."""
    if not user_id:
        raise HTTPException(401, "Not logged in.")
    try:
        supabase.table("budget_limits").delete().eq("user_id", user_id).eq("category", category).execute()
        return {"ok": True}
    except Exception:
        raise HTTPException(500, "Couldn't delete that limit.")


@router.get("/alerts")
async def get_alerts(
    user_id: Annotated[str | None, Header(alias="user-id")] = None,
):
    """
    Compare current-month spending per category against the user's limits.
    Returns a list of alert objects — one per category that has a limit set.
    The frontend shows these as banners on the Dashboard.
    """
    if not user_id:
        raise HTTPException(401, "Not logged in.")

    try:
        # 1. Fetch limits
        limits_res = (
            supabase.table("budget_limits")
            .select("category, amount")
            .eq("user_id", user_id)
            .execute()
        )
        limits: dict[str, float] = {r["category"]: float(r["amount"]) for r in limits_res.data}

        if not limits:
            return {"alerts": [], "has_limits": False}

        # 2. Current-month spending
        now = datetime.now()
        month_start = date(now.year, now.month, 1).isoformat()

        tx_res = (
            supabase.table("transactions")
            .select("category, amount")
            .eq("user_id", user_id)
            .eq("type", "expense")
            .gte("date", month_start)
            .execute()
        )

        spent: dict[str, float] = defaultdict(float)
        for t in tx_res.data:
            spent[t["category"]] += float(t["amount"])

        # 3. Build alert objects
        alerts = []
        for category, limit in limits.items():
            category_spent = spent.get(category, 0.0)
            percent = (category_spent / limit * 100) if limit > 0 else 0.0

            if percent >= 100:
                level = "over"
            elif percent >= 75:
                level = "warning"
            else:
                level = "ok"

            alerts.append({
                "category": category,
                "limit":    round(limit, 2),
                "spent":    round(category_spent, 2),
                "percent":  round(percent, 1),
                "level":    level,
            })

        # Sort: over first, then warning, then ok; within each group by percent desc
        order = {"over": 0, "warning": 1, "ok": 2}
        alerts.sort(key=lambda a: (order[a["level"]], -a["percent"]))

        return {"alerts": alerts, "has_limits": True}

    except Exception as e:
        raise HTTPException(500, "Couldn't check your budget alerts.")