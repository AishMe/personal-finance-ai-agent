from fastapi import APIRouter, HTTPException, Header
from typing import Annotated
from db.supabase import supabase
from agent.llm import chat_with_ai
from agent.context import build_user_context
from datetime import datetime, date
from collections import defaultdict

router = APIRouter(prefix="/insights", tags=["insights"])

def analyze_finances(user_id: str) -> dict:
    """
    Runs rule-based analysis on user's transactions.
    Returns structured findings the AI will turn into insights.
    """
    now = datetime.now()
    month_start = date(now.year, now.month, 1).isoformat()
    last_month_start = date(
        now.year if now.month > 1 else now.year - 1,
        now.month - 1 if now.month > 1 else 12,
        1
    ).isoformat()

    # Current month transactions
    current = supabase.table("transactions") \
        .select("*") \
        .eq("user_id", user_id) \
        .gte("date", month_start) \
        .execute().data

    # Last month transactions
    last = supabase.table("transactions") \
        .select("*") \
        .eq("user_id", user_id) \
        .gte("date", last_month_start) \
        .lt("date", month_start) \
        .execute().data

    # Profile
    profile = supabase.table("profiles") \
        .select("*") \
        .eq("id", user_id) \
        .single() \
        .execute().data

    currency = profile.get("currency", "INR")
    monthly_income = profile.get("monthly_income", 0)
    savings_goal = profile.get("savings_goal", 0)

    # Current month totals
    curr_expenses = sum(t["amount"] for t in current if t["type"] == "expense")
    curr_categories = defaultdict(float)
    for t in current:
        if t["type"] == "expense":
            curr_categories[t["category"]] += t["amount"]

    # Last month totals
    last_expenses = sum(t["amount"] for t in last if t["type"] == "expense")
    last_categories = defaultdict(float)
    for t in last:
        if t["type"] == "expense":
            last_categories[t["category"]] += t["amount"]

    # Detect subscriptions (recurring same amount + category)
    subscription_cats = ["Subscriptions", "Entertainment", "Streaming"]
    subscriptions = [
        t for t in current
        if t["type"] == "expense" and t["category"] in subscription_cats
    ]
    subscription_total = sum(t["amount"] for t in subscriptions)

    # Top spending category
    top_category = max(curr_categories.items(), key=lambda x: x[1]) \
        if curr_categories else ("None", 0)

    # Month over month change
    mom_change = 0
    mom_pct = 0
    if last_expenses > 0:
        mom_change = curr_expenses - last_expenses
        mom_pct = round((mom_change / last_expenses) * 100, 1)

    # Savings progress
    balance = monthly_income - curr_expenses
    savings_progress = round((balance / savings_goal * 100), 1) \
        if savings_goal > 0 else 0

    return {
        "currency": currency,
        "monthly_income": monthly_income,
        "savings_goal": savings_goal,
        "curr_expenses": curr_expenses,
        "balance": balance,
        "savings_progress": savings_progress,
        "top_category": top_category,
        "mom_change": mom_change,
        "mom_pct": mom_pct,
        "curr_categories": dict(curr_categories),
        "subscription_total": subscription_total,
        "num_transactions": len(current),
    }


@router.get("/")
async def get_insights(
    user_id: Annotated[str | None, Header(alias="user-id")] = None
):
    if not user_id:
        raise HTTPException(status_code=401, detail="No user_id header")
    try:
        # Step 1 — Rule-based analysis
        analysis = analyze_finances(user_id)

        if analysis["num_transactions"] == 0:
            return {
                "insights": [],
                "message": "Add some transactions to get personalized insights."
            }

        cur = analysis["currency"]
        c = analysis

        # Step 2 — Build a structured prompt for the AI
        analysis_prompt = f"""
Based on this user's financial data, generate exactly 4 short insight cards.
Each insight must be specific, actionable, and use the real numbers provided.

Financial data:
- Monthly income: {cur} {c['monthly_income']:,}
- Total expenses this month: {cur} {c['curr_expenses']:,}
- Remaining balance: {cur} {c['balance']:,}
- Savings goal: {cur} {c['savings_goal']:,}
- Savings goal progress: {c['savings_progress']}%
- Top spending category: {c['top_category'][0]} ({cur} {c['top_category'][1]:,.0f})
- Month over month change: {c['mom_pct']}% ({'increase' if c['mom_change'] > 0 else 'decrease'})
- Subscription spending: {cur} {c['subscription_total']:,}
- Category breakdown: {c['curr_categories']}

Return ONLY a JSON array of exactly 4 objects. No explanation, no markdown, just raw JSON.
Each object must have these exact fields:
- type: one of "success", "warning", "info", "tip"
- title: short title (max 6 words)
- message: specific insight with real numbers (max 25 words)
- action: what the user should do (max 10 words)

Example format:
[
  {{
    "type": "warning",
    "title": "Food spending is high",
    "message": "You spent {cur} 8,400 on food — 25% of your income. The average should be under 15%.",
    "action": "Set a food budget of {cur} 5,000 next month"
  }}
]
"""
        # Step 3 — Ask the AI to generate insight cards
        raw = await chat_with_ai(
            messages=[{"role": "user", "content": analysis_prompt}],
            system_prompt="You are a financial data analyst. Return only valid JSON arrays. No markdown, no explanation."
        )

        # Step 4 — Parse the AI response
        import json
        import re

        # Strip markdown code blocks if present
        clean = re.sub(r"```json|```", "", raw).strip()
        insights = json.loads(clean)

        return {"insights": insights}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))