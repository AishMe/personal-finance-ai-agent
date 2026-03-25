// frontend/src/lib/nlp.ts

export interface ParsedTransaction {
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;        // YYYY-MM-DD
  confidence: number;  // 0.0 – 1.0
}

/**
 * Parse a natural language string into a structured transaction.
 * Pass monthly_income so the backend can auto-fill salary entries.
 */
export async function parseTransactionText(
  text: string,
  monthlyIncome?: number
): Promise<ParsedTransaction> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/nlp/parse-expense`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        monthly_income: monthlyIncome ?? null,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // Surface the backend's user-friendly message, or a generic fallback
    throw new Error(
      err.detail || "Couldn't understand that. Try something like \"spent 200 on lunch\"."
    );
  }

  return res.json();
}