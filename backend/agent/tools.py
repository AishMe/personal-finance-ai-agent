from db.supabase import supabase
from datetime import datetime, date
from collections import defaultdict


def calculator(expression: str) -> str:
    """
    Safely evaluates a mathematical expression.
    Example: calculator("50000 * 0.20") -> "10000.0"
    """
    try:
        allowed = set("0123456789+-*/()., ")
        if not all(c in allowed for c in expression):
            return "Error: Invalid characters in expression"
        result = eval(expression, {"__builtins__": {}}, {})
        return str(round(float(result), 2))
    except Exception as e:
        return f"Error: {str(e)}"


def budget_analyzer(user_id: str) -> str:
    """
    Analyzes user's spending and returns actionable suggestions.
    """
    try:
        profile = supabase.table("profiles") \
            .select("*").eq("id", user_id).single().execute().data

        now = datetime.now()
        month_start = date(now.year, now.month, 1).isoformat()

        transactions = supabase.table("transactions") \
            .select("*") \
            .eq("user_id", user_id) \
            .gte("date", month_start) \
            .execute().data

        if not transactions:
            return "No transactions found for this month. Please add some transactions first."

        income = profile.get("monthly_income", 0)
        currency = profile.get("currency", "INR")

        categories = defaultdict(float)
        total_expenses = 0
        for t in transactions:
            if t["type"] == "expense":
                categories[t["category"]] += t["amount"]
                total_expenses += t["amount"]

        balance = income - total_expenses
        savings_rate = (balance / income * 100) if income > 0 else 0

        # Build analysis
        lines = [
            f"BUDGET ANALYSIS — {now.strftime('%B %Y')}",
            f"Income: {currency} {income:,.0f}",
            f"Total Expenses: {currency} {total_expenses:,.0f}",
            f"Balance: {currency} {balance:,.0f}",
            f"Savings Rate: {savings_rate:.1f}%",
            "",
            "SPENDING BY CATEGORY:",
        ]

        sorted_cats = sorted(categories.items(), key=lambda x: -x[1])
        for cat, amt in sorted_cats:
            pct = (amt / income * 100) if income > 0 else 0
            flag = " ⚠️ HIGH" if pct > 30 else ""
            lines.append(f"  {cat}: {currency} {amt:,.0f} ({pct:.1f}%){flag}")

        lines.append("")
        lines.append("SUGGESTIONS:")

        # Rule-based suggestions
        suggestions = []
        for cat, amt in sorted_cats:
            pct = amt / income * 100 if income > 0 else 0
            if cat == "Food" and pct > 15:
                suggestions.append(f"• Reduce Food spending from {currency} {amt:,.0f} to {currency} {income*0.15:,.0f} (15% of income). Save {currency} {amt - income*0.15:,.0f}/month.")
            elif cat == "Shopping" and pct > 10:
                suggestions.append(f"• Reduce Shopping from {currency} {amt:,.0f} to {currency} {income*0.10:,.0f}. Save {currency} {amt - income*0.10:,.0f}/month.")
            elif cat == "Subscriptions" and amt > 500:
                suggestions.append(f"• Review subscriptions costing {currency} {amt:,.0f}/month. Cancel unused ones.")
            elif cat == "Entertainment" and pct > 5:
                suggestions.append(f"• Entertainment at {pct:.1f}% of income is high. Target under 5%.")

        if not suggestions:
            suggestions.append("• Your spending looks healthy! Keep maintaining this balance.")

        lines.extend(suggestions)
        return "\n".join(lines)

    except Exception as e:
        return f"Error analyzing budget: {str(e)}"


def savings_planner(user_id: str, goal_amount: float, months: int) -> str:
    """
    Creates a personalized savings plan to reach a goal.
    """
    try:
        profile = supabase.table("profiles") \
            .select("*").eq("id", user_id).single().execute().data

        income = profile.get("monthly_income", 0)
        savings_goal = profile.get("savings_goal", 0)
        currency = profile.get("currency", "INR")

        # Get current month expenses
        now = datetime.now()
        month_start = date(now.year, now.month, 1).isoformat()
        transactions = supabase.table("transactions") \
            .select("*") \
            .eq("user_id", user_id) \
            .gte("date", month_start) \
            .execute().data

        current_expenses = sum(
            t["amount"] for t in transactions if t["type"] == "expense"
        )
        current_balance = income - current_expenses
        monthly_needed = goal_amount / months
        gap = monthly_needed - current_balance

        lines = [
            f"SAVINGS PLAN",
            f"Goal: {currency} {goal_amount:,.0f}",
            f"Timeline: {months} months",
            f"Required per month: {currency} {monthly_needed:,.0f}",
            f"Current monthly balance: {currency} {current_balance:,.0f}",
            "",
        ]

        if current_balance >= monthly_needed:
            surplus = current_balance - monthly_needed
            lines += [
                "✅ GREAT NEWS — You can already achieve this goal!",
                f"You have {currency} {current_balance:,.0f} left after expenses.",
                f"Set aside {currency} {monthly_needed:,.0f}/month for {months} months.",
                f"You'll have {currency} {surplus:,.0f} extra each month.",
                "",
                "ACTION PLAN:",
                f"• Month 1-{months}: Save {currency} {monthly_needed:,.0f} each month",
                f"• Total saved after {months} months: {currency} {monthly_needed * months:,.0f}",
                f"• Open a separate savings account and auto-transfer {currency} {monthly_needed:,.0f} on salary day",
            ]
        else:
            lines += [
                f"⚠️ You need {currency} {gap:,.0f} more per month to hit this goal.",
                "",
                "ACTION PLAN TO CLOSE THE GAP:",
                f"• Current balance after expenses: {currency} {current_balance:,.0f}",
                f"• Monthly savings needed: {currency} {monthly_needed:,.0f}",
                f"• Gap to close: {currency} {gap:,.0f}/month",
                "",
                "WAYS TO CLOSE THE GAP:",
            ]

            # Suggest cuts based on common categories
            categories = defaultdict(float)
            for t in transactions:
                if t["type"] == "expense":
                    categories[t["category"]] += t["amount"]

            potential_savings = 0
            for cat, amt in sorted(categories.items(), key=lambda x: -x[1]):
                cut = 0
                if cat == "Food" and amt > income * 0.15:
                    cut = amt - income * 0.15
                elif cat == "Shopping" and amt > income * 0.10:
                    cut = amt - income * 0.10
                elif cat == "Entertainment" and amt > income * 0.05:
                    cut = amt - income * 0.05
                elif cat == "Subscriptions" and amt > 300:
                    cut = amt * 0.5

                if cut > 0:
                    lines.append(f"  • Cut {cat} by {currency} {cut:,.0f}/month")
                    potential_savings += cut

            lines += [
                f"",
                f"Potential monthly savings: {currency} {potential_savings:,.0f}",
                f"Remaining gap after cuts: {currency} {max(0, gap - potential_savings):,.0f}",
            ]

            if potential_savings >= gap:
                lines.append(f"✅ Achievable! Follow the cuts above to reach your goal in {months} months.")
            else:
                extra = gap - potential_savings
                lines.append(f"Consider increasing income by {currency} {extra:,.0f}/month (freelance, part-time work).")

        return "\n".join(lines)

    except Exception as e:
        return f"Error creating savings plan: {str(e)}"


# Tool registry — maps tool names to functions
TOOLS = {
    "calculator": {
        "fn": calculator,
        "description": "Evaluates math expressions. Use for any calculation.",
        "requires_user_id": False,
    },
    "budget_analyzer": {
        "fn": budget_analyzer,
        "description": "Analyzes user spending and gives suggestions.",
        "requires_user_id": True,
    },
    "savings_planner": {
        "fn": savings_planner,
        "description": "Creates a savings plan given a goal amount and months.",
        "requires_user_id": True,
    },
}