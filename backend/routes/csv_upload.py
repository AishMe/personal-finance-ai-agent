"""

Supports:
  • CSV   (.csv)         — standard bank statement export
  • Excel (.xlsx / .xls) — using openpyxl

Handles the common bank pattern where Debit and Credit are TWO separate
columns instead of a single signed-amount column.
"""

from fastapi import APIRouter, HTTPException, Header, UploadFile, File
from pydantic import BaseModel
from typing import Annotated, Optional
from datetime import date
import httpx, os, json, re, csv, io

router = APIRouter(prefix="/csv", tags=["csv"])


# ─── Pydantic models ──────────────────────────────────────────────────────────

class RawRow(BaseModel):
    date: str
    description: str
    # Unified amount string already resolved to a single value by the frontend
    amount: str          # always a positive-ish number string, e.g. "1234.56"
    # "income" / "expense" / "" — pre-computed by the frontend from debit/credit cols
    type_hint: Optional[str] = ""


class ParseCSVRequest(BaseModel):
    rows: list[RawRow]
    monthly_income: Optional[float] = None


class CategorizedRow(BaseModel):
    date: str
    description: str
    amount: float
    type: str            # "income" | "expense"
    category: str
    original_description: str


class BulkInsertRequest(BaseModel):
    transactions: list[CategorizedRow]


# ─── Amount helpers ───────────────────────────────────────────────────────────

def clean_amount(raw: str) -> float:
    """Strip currency symbols/commas, return abs(float). Returns 0 on failure."""
    cleaned = re.sub(r"[^\d.\-]", "", str(raw).replace(",", ""))
    try:
        return abs(float(cleaned))
    except ValueError:
        return 0.0


# ─── AI batch categorization ─────────────────────────────────────────────────

VALID_EXPENSE_CATS = [
    "Food", "Transport", "Shopping", "Entertainment",
    "Health", "Housing", "Utilities", "Subscriptions", "Other",
]
VALID_INCOME_CATS = ["Salary", "Freelance", "Investment", "Gift", "Other"]


async def categorize_batch(rows: list[RawRow]) -> list[CategorizedRow]:
    """
    Single OpenRouter call for up to 20 rows.
    type_hint is passed to the model — if it's already "income"/"expense"
    the model should respect it; if empty the model infers from description.
    Falls back gracefully (category = "Other") on any failure.
    """
    if not rows:
        return []

    today = date.today().isoformat()

    items = "\n".join(
        f'{i+1}. date={r.date or today} | desc="{r.description}" | '
        f'amount={r.amount} | type_hint={r.type_hint or "unknown"}'
        for i, r in enumerate(rows)
    )

    prompt = f"""Categorize these bank transactions. Respond ONLY with a valid JSON array — no markdown, no explanation, no code fences.

Transactions:
{items}

For EACH transaction return one object:
{{
  "index": <1-based integer>,
  "type": <"income" or "expense">,
  "category": <see rules>,
  "description": "<clean short label, max 40 chars>"
}}

Rules:
- If type_hint is "income" or "expense", use it — do NOT override it.
- Only infer type from description when type_hint is "unknown".
- expense categories: Food, Transport, Shopping, Entertainment, Health, Housing, Utilities, Subscriptions, Other
- income  categories: Salary, Freelance, Investment, Gift, Other

Smart categorization examples:
SWIGGY/ZOMATO → Food | UBER/OLA/RAPIDO → Transport | AMAZON/FLIPKART → Shopping
NETFLIX/SPOTIFY/HOTSTAR → Subscriptions | SALARY CREDIT → Salary income
HOSPITAL/PHARMACY → Health | EMI/LOAN → Housing | ELECTRICITY/WATER → Utilities

Return a JSON array of exactly {len(rows)} objects, indexed 1 to {len(rows)}."""

    ai_map: dict = {}
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
                    "max_tokens": 1200,
                },
                timeout=35.0,
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            clean = re.sub(r"```json|```", "", content).strip()
            ai_results: list[dict] = json.loads(clean)
            ai_map = {item["index"]: item for item in ai_results if "index" in item}
    except Exception:
        pass   # fall through — every row gets "Other"

    results: list[CategorizedRow] = []
    for i, row in enumerate(rows):
        ai = ai_map.get(i + 1, {})

        # Respect the frontend's type_hint first, then AI, then fallback
        tx_type = row.type_hint or ai.get("type", "expense")
        if tx_type not in ("income", "expense"):
            tx_type = "expense"

        category = ai.get("category", "Other")
        valid = VALID_INCOME_CATS if tx_type == "income" else VALID_EXPENSE_CATS
        if category not in valid:
            category = "Other"

        results.append(CategorizedRow(
            date=row.date or today,
            description=ai.get("description", row.description[:40]),
            amount=clean_amount(row.amount),
            type=tx_type,
            category=category,
            original_description=row.description,
        ))

    return results


# ─── File parsing helpers ─────────────────────────────────────────────────────

def parse_csv_content(content: bytes) -> tuple[list[str], list[dict], int]:
    """Returns (headers, preview_rows[0:5], total_rows)."""
    text = None
    for enc in ("utf-8", "utf-8-sig", "latin-1", "cp1252"):
        try:
            text = content.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    if text is None:
        raise HTTPException(
            400,
            "Couldn't read that file. Make sure it's saved as CSV (UTF-8 or Latin-1)."
        )

    try:
        reader = csv.DictReader(io.StringIO(text))
        headers = list(reader.fieldnames or [])
        if not headers:
            raise HTTPException(400, "The CSV has no header row. Add column names and try again.")
        rows, total = [], 0
        for row in reader:
            total += 1
            if total <= 5:
                rows.append(dict(row))
        if total == 0:
            raise HTTPException(400, "The file is empty — no rows found.")
        return headers, rows, total
    except csv.Error:
        raise HTTPException(400, "That doesn't look like a valid CSV file.")


def parse_excel_content(content: bytes) -> tuple[list[str], list[dict], int]:
    """Returns (headers, preview_rows[0:5], total_rows) from an xlsx/xls file."""
    try:
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
        ws = wb.active
        rows_iter = ws.iter_rows(values_only=True)

        # First row = headers
        header_row = next(rows_iter, None)
        if not header_row:
            raise HTTPException(400, "The Excel file is empty.")
        headers = [str(h).strip() if h is not None else f"Col{i}" for i, h in enumerate(header_row)]

        preview, total = [], 0
        for row in rows_iter:
            total += 1
            if total <= 5:
                preview.append({headers[i]: (str(v).strip() if v is not None else "") for i, v in enumerate(row)})
        if total == 0:
            raise HTTPException(400, "The Excel file has headers but no data rows.")
        return headers, preview, total
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Couldn't read the Excel file. Make sure it's a valid .xlsx file.")



# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/read-file")
async def read_file(
    file: UploadFile = File(...),
    user_id: Annotated[str | None, Header(alias="user-id")] = None,
):
    """
    Accept CSV or XLSX. Return headers + 5 preview rows + total count.
    The frontend uses this to let the user map columns.
    """
    if not user_id:
        raise HTTPException(401, "Not logged in.")

    fname = (file.filename or "").lower()
    if not fname:
        raise HTTPException(400, "No file received.")

    content = await file.read()

    if fname.endswith(".csv"):
        headers, preview, total = parse_csv_content(content)
        file_type = "csv"
    elif fname.endswith((".xlsx", ".xls")):
        headers, preview, total = parse_excel_content(content)
        file_type = "excel"
    else:
        raise HTTPException(400, "Please upload a CSV or Excel (.xlsx) file.")

    return {
        "headers": headers,
        "preview_rows": preview,
        "total_rows": total,
        "file_type": file_type,
    }


@router.post("/parse-rows")
async def parse_rows(
    req: ParseCSVRequest,
    user_id: Annotated[str | None, Header(alias="user-id")] = None,
):
    """
    AI-categorize pre-mapped rows. Max 200 rows.
    The frontend already resolved debit/credit columns into a single amount + type_hint.
    """
    if not user_id:
        raise HTTPException(401, "Not logged in.")
    if not req.rows:
        raise HTTPException(400, "No rows received.")
    if len(req.rows) > 200:
        raise HTTPException(400, "Please upload 200 rows or fewer at a time.")

    valid = [r for r in req.rows if r.description.strip() and r.amount.strip() and r.amount.strip() != "0"]
    if not valid:
        raise HTTPException(400, "No valid rows found. Check that you mapped the right columns.")

    BATCH = 20
    categorized: list[CategorizedRow] = []
    for i in range(0, len(valid), BATCH):
        categorized.extend(await categorize_batch(valid[i: i + BATCH]))

    return {"transactions": [t.model_dump() for t in categorized], "count": len(categorized)}


@router.post("/confirm")
async def confirm_import(
    req: BulkInsertRequest,
    user_id: Annotated[str | None, Header(alias="user-id")] = None,
):
    """Bulk-insert confirmed transactions into Supabase."""
    if not user_id:
        raise HTTPException(401, "Not logged in.")
    if not req.transactions:
        raise HTTPException(400, "Nothing to import.")

    from db.supabase import supabase

    to_insert = [
        {
            "user_id":     user_id,
            "type":        t.type,
            "amount":      t.amount,
            "category":    t.category,
            "description": t.description,
            "date":        t.date,
        }
        for t in req.transactions
        if t.amount > 0
    ]

    if not to_insert:
        raise HTTPException(400, "All selected rows had zero amounts — nothing was imported.")

    try:
        supabase.table("transactions").insert(to_insert).execute()
    except Exception:
        raise HTTPException(500, "Something went wrong while saving. Please try again.")

    return {"imported": len(to_insert)}