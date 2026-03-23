from db.supabase import supabase
from datetime import datetime

def build_user_context(user_id: str) -> str:
    """
    Fetches user's profile and recent transactions from Supabase
    and builds a context string to inject into the AI system prompt.
    """
    try:
        # Fetch profile
        profile = supabase.table("profiles") \
            .select("*") \
            .eq("id", user_id) \
            .single() \
            .execute().data

        # Fetch last 30 transactions
        transactions = supabase.table("transactions") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("date", desc=True) \
            .limit(30) \
            .execute().data

        if not profile:
            return "No profile found for this user."

        # Build summary
        currency = profile.get("currency", "INR")
        income = profile.get("monthly_income", 0)
        savings_goal = profile.get("savings_goal", 0)
        name = profile.get("name", "User")

        # Calculate totals from transactions
        total_expenses = sum(t["amount"] for t in transactions if t["type"] == "expense")
        total_income_tx = sum(t["amount"] for t in transactions if t["type"] == "income")

        # Category breakdown
        categories = {}
        for t in transactions:
            if t["type"] == "expense":
                cat = t["category"]
                categories[cat] = categories.get(cat, 0) + t["amount"]

        category_breakdown = "\n".join(
            f"  - {cat}: {currency} {amount:,.0f}"
            for cat, amount in sorted(categories.items(), key=lambda x: -x[1])
        )

        # Recent transactions list
        recent_list = "\n".join(
            f"  - {t['date']} | {t['type'].upper()} | {t['category']} | {currency} {t['amount']:,.0f} | {t.get('description', '')}"
            for t in transactions[:10]
        )

        context = f"""
=== USER FINANCIAL PROFILE ===
Name: {name}
Monthly Income: {currency} {income:,.0f}
Savings Goal: {currency} {savings_goal:,.0f} per month
Currency: {currency}

=== RECENT ACTIVITY (last 30 transactions) ===
Total Expenses: {currency} {total_expenses:,.0f}
Total Income Recorded: {currency} {total_income_tx:,.0f}
Remaining (Income - Expenses): {currency} {income - total_expenses:,.0f}
Savings Goal Progress: {(income - total_expenses) / savings_goal * 100:.1f}% of goal achieved

=== SPENDING BY CATEGORY ===
{category_breakdown if category_breakdown else "No expenses recorded yet."}

=== LAST 10 TRANSACTIONS ===
{recent_list if recent_list else "No transactions recorded yet."}
===============================
"""
        return context

    except Exception as e:
        return f"Could not load user financial data: {str(e)}"