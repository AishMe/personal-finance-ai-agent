from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Annotated, Optional
from datetime import date, timedelta
import httpx
import os
import json
import re

router = APIRouter(prefix="/nlp", tags=["nlp"])


class ParseRequest(BaseModel):
    text: str
    monthly_income: Optional[float] = None   # from user profile, for salary auto-fill


class ParsedTransaction(BaseModel):
    type: str          # "income" or "expense"
    amount: float
    category: str
    description: str
    date: str          # ISO format YYYY-MM-DD
    confidence: float  # 0.0 – 1.0


@router.post("/parse-expense", response_model=ParsedTransaction)
async def parse_transaction(
    req: ParseRequest,
    user_id: Annotated[str | None, Header(alias="user-id")] = None,
):
    """
    Parse a natural language transaction (income OR expense) into structured data.

    Examples:
      "spent 450 on groceries yesterday"   -> expense, Food, yesterday
      "got salary today"                   -> income, Salary, uses monthly_income if provided
      "received 5000 freelance payment"    -> income, Freelance, today
    """
    if not req.text or len(req.text.strip()) < 3:
        raise HTTPException(status_code=400, detail="Please type a bit more so I can understand.")

    today = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=1)).isoformat()

    # Build the salary hint line conditionally
    salary_hint = ""
    if req.monthly_income and req.monthly_income > 0:
        salary_hint = (
            f"\n- IMPORTANT: If the text refers to salary/pay/stipend/wages without mentioning "
            f"a specific amount, automatically use {req.monthly_income} as the amount — "
            f"that is the user's monthly income saved in their profile. Do NOT output 0."
        )

    prompt = f"""Today is {today}. Parse this financial transaction and respond ONLY with a JSON object — no markdown, no explanation, no code fences.

Text: "{req.text}"

Return exactly this JSON:
{{
  "type": <"income" or "expense">,
  "amount": <positive number>,
  "category": <see rules below>,
  "description": "<brief label, max 40 chars>",
  "date": "<YYYY-MM-DD>",
  "confidence": <0.0 to 1.0>
}}

Type detection:
- "expense" → spent, paid, bought, bill, fee, cost, charged, ordered, subscribed
- "income"  → received, got, earned, salary, pay, stipend, credited, freelance, payment received, income

Category rules:
- expense categories: Food, Transport, Shopping, Entertainment, Health, Housing, Utilities, Subscriptions, Other
- income categories:  Salary, Freelance, Investment, Gift, Other

Date rules:
- "yesterday" → use {yesterday}
- "today" or no date mentioned → use {today}
- "last monday/friday/etc" → calculate the most recent past occurrence

Confidence rules:
- 0.9+ : amount, type, and category are all explicitly stated
- 0.6-0.89 : one field is inferred
- 0.3-0.59 : multiple fields guessed
- below 0.3 : very unclear
{salary_hint}"""

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {os.environ.get('OPENROUTER_API_KEY')}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Finance Agent",
                },
                json={
                    "model": "openrouter/auto",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 250,
                },
                timeout=20.0,
            )
            resp.raise_for_status()
            data = resp.json()

        choices = data.get("choices", [])
        if not choices:
            raise ValueError("No choices returned from AI")

        content = choices[0].get("message", {}).get("content", "")
        if not content:
            raise ValueError("Empty content from AI")

        # Strip any markdown fences the model adds anyway
        clean = re.sub(r"```json|```", "", content).strip()

        parsed = json.loads(clean)

        # Validate required fields exist
        for field in ("type", "amount", "category", "date"):
            if field not in parsed:
                raise ValueError(f"Missing field: {field}")

        # Normalise type
        tx_type = str(parsed["type"]).lower().strip()
        if tx_type not in ("income", "expense"):
            tx_type = "expense"  # safe fallback
        parsed["type"] = tx_type

        # Ensure amount is positive
        parsed["amount"] = abs(float(parsed["amount"]))

        # If salary keyword used but amount came back 0, use monthly_income
        salary_keywords = ("salary", "pay", "stipend", "wages", "paycheck", "payday")
        if (
            parsed["amount"] == 0
            and req.monthly_income
            and any(kw in req.text.lower() for kw in salary_keywords)
        ):
            parsed["amount"] = req.monthly_income

        # Validate / fallback date
        try:
            date.fromisoformat(str(parsed["date"]))
        except (ValueError, KeyError, TypeError):
            parsed["date"] = today

        # Clamp confidence
        parsed["confidence"] = max(0.0, min(1.0, float(parsed.get("confidence", 0.7))))

        # Ensure description is a clean string
        parsed["description"] = str(parsed.get("description", "")).strip()[:50]

        return ParsedTransaction(**parsed)

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=422,
            detail="The AI returned something unexpected. Please rephrase and try again."
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="This is taking too long. Please try again in a moment."
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Something went wrong on our end. Please try again."
        )