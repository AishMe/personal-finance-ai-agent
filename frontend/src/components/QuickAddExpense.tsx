"use client";
// frontend/src/components/QuickAddExpense.tsx

import { useState, useCallback, useRef, useEffect } from "react";
import { Sparkles, Check, AlertCircle, Loader2, X, TrendingDown, TrendingUp } from "lucide-react";
import { parseTransactionText, ParsedTransaction } from "@/lib/nlp";
import { getUserId } from "@/lib/user";

interface QuickAddProps {
  onSaved: () => void;
}

// How long the user must stop typing before we fire the parse request
const DEBOUNCE_MS = 900;

// Minimum characters before we even attempt a parse
const MIN_LEN = 6;

export default function QuickAddExpense({ onSaved }: QuickAddProps) {
  const [text, setText]           = useState("");
  const [parsed, setParsed]       = useState<ParsedTransaction | null>(null);
  const [parsing, setParsing]     = useState(false);   // AI call in flight
  const [saving, setSaving]       = useState(false);   // save call in flight
  const [error, setError]         = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState<number | undefined>();

  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track the text that triggered the current/last parse so we can detect
  // if the user edited it while the AI was thinking
  const pendingText   = useRef("");

  // Fetch the user's monthly income once on mount so salary entries auto-fill
  useEffect(() => {
    (async () => {
      const userId = await getUserId();
      if (!userId) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/`, {
          headers: { "user-id": userId },
        });
        if (res.ok) {
          const data = await res.json();
          setMonthlyIncome(data.monthly_income ?? undefined);
        }
      } catch {
        // silently ignore — salary auto-fill just won't work
      }
    })();
  }, []);

  const resetState = useCallback(() => {
    setParsed(null);
    setError("");
    setJustSaved(false);
  }, []);

  const handleChange = useCallback(
    (val: string) => {
      setText(val);
      resetState();

      // Cancel any pending parse
      if (debounceRef.current) clearTimeout(debounceRef.current);

      // Don't even start if too short
      if (val.trim().length < MIN_LEN) return;

      debounceRef.current = setTimeout(async () => {
        pendingText.current = val;
        setParsing(true);
        setError("");

        try {
          const result = await parseTransactionText(val, monthlyIncome);

          // Only show the result if the input hasn't changed since we fired
          if (pendingText.current === val) {
            setParsed(result);
          }
        } catch (e: unknown) {
          if (pendingText.current === val) {
            // Show the backend's user-friendly message, nothing technical
            const raw = e instanceof Error ? e.message : "";
            setError(
              raw && !raw.match(/\d{3}|fetch|network|json/i)
                ? raw
                : "Couldn't figure that out. Try rephrasing — e.g. \"spent 200 on lunch\"."
            );
          }
        } finally {
          if (pendingText.current === val) {
            setParsing(false);
          }
        }
      }, DEBOUNCE_MS);
    },
    [monthlyIncome, resetState]
  );

  const handleClear = useCallback(() => {
    setText("");
    resetState();
    setParsing(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pendingText.current = "";
  }, [resetState]);

  const handleSave = async () => {
    if (!parsed || saving || parsing) return;
    setSaving(true);
    setError("");

    try {
      const userId = await getUserId();
      if (!userId) {
        setError("You're not logged in. Please refresh and sign in again.");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-id": userId,
        },
        body: JSON.stringify({
          type:        parsed.type,
          amount:      parsed.amount,
          category:    parsed.category,
          description: parsed.description,
          date:        parsed.date,
        }),
      });

      if (!res.ok) throw new Error("save_failed");

      // Success — show tick briefly then reset
      setText("");
      setParsed(null);
      setError("");
      setJustSaved(true);
      pendingText.current = "";
      setTimeout(() => setJustSaved(false), 2500);
      onSaved();
    } catch {
      setError("Couldn't save right now. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Derive whether the Save button should be clickable
  const canSave = parsed !== null && !parsing && !saving;

  // Colour pill based on transaction type
  const typeColor =
    parsed?.type === "income"
      ? "bg-green-900/60 text-green-300 border border-green-700"
      : "bg-indigo-900/60 text-indigo-300 border border-indigo-700";

  const TypeIcon = parsed?.type === "income" ? TrendingUp : TrendingDown;

  return (
    <div className="quick-add-wrapper">

      {/* ── Header label ── */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={15} className="text-indigo-400" />
        <span className="text-sm font-medium text-zinc-300">Quick Add with AI</span>
        <span className="text-xs text-zinc-500 ml-1 hidden sm:inline">
          e.g. &quot;spent 450 on groceries&quot; or &quot;got salary today&quot;
        </span>
      </div>

      {/* ── Input ── */}
      <div className="relative">
        <input
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Describe a transaction in plain English…"
          className="quick-add-input"
          // Disable only while saving — never during parsing so the user can
          // keep typing and override what they wrote
          disabled={saving}
          aria-label="Natural language transaction input"
        />

        {/* Spinner (inside input, right side) — shown while AI is thinking */}
        {parsing && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
            <Loader2 size={15} className="animate-spin" />
          </span>
        )}

        {/* Clear button — only when not parsing/saving */}
        {text && !parsing && !saving && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Clear input"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── "Still thinking" hint — shown while typing AND debounce hasn't fired yet ── */}
      {text.trim().length >= MIN_LEN && !parsing && !parsed && !error && !justSaved && (
        <p className="text-xs text-zinc-600 mt-2">Waiting for you to finish typing…</p>
      )}

      {/* ── Parsing status ── */}
      {parsing && (
        <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1.5">
          <Loader2 size={11} className="animate-spin" />
          Reading your transaction…
        </p>
      )}

      {/* ── Error message (user-friendly only) ── */}
      {error && !parsing && (
        <div className="flex items-start gap-2 mt-3 text-sm text-red-400">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Success flash ── */}
      {justSaved && (
        <div className="flex items-center gap-2 mt-3 text-sm text-green-400">
          <Check size={14} />
          <span>Saved! Your dashboard has been updated.</span>
        </div>
      )}

      {/* ── Parse preview card ── */}
      {parsed && !parsing && !justSaved && (
        <div className="parse-preview mt-3">

          {/* Type badge + amount row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <p className="text-xs text-zinc-500 mb-2">Here&apos;s what I understood:</p>
              <div className="flex flex-wrap gap-2 items-center">
                {/* Income / Expense badge */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${typeColor}`}>
                  <TypeIcon size={11} />
                  {parsed.type === "income" ? "Income" : "Expense"}
                </span>
                {/* Amount */}
                <span className="parse-tag">₹{parsed.amount.toLocaleString()}</span>
                {/* Category */}
                <span className="parse-tag">{parsed.category}</span>
                {/* Date */}
                <span className="parse-tag">{parsed.date}</span>
              </div>
              {parsed.description && (
                <p className="text-xs text-zinc-500 mt-2 italic">{parsed.description}</p>
              )}
            </div>

            {/* Confidence indicator — subtle, not shown as % to avoid confusion */}
            <div className="shrink-0 text-right">
              <p className="text-xs text-zinc-600">Confidence</p>
              <div className="flex gap-0.5 mt-1 justify-end">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i <= Math.ceil(parsed.confidence * 5)
                        ? parsed.confidence >= 0.7
                          ? "bg-green-500"
                          : parsed.confidence >= 0.4
                          ? "bg-yellow-500"
                          : "bg-red-500"
                        : "bg-zinc-700"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Low confidence nudge */}
          {parsed.confidence < 0.45 && (
            <p className="text-xs text-yellow-400/80 mb-3">
              I&apos;m not fully sure about this — double-check the details look right before saving.
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="quick-add-save-btn"
            >
              {saving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check size={13} />
                  {parsed.type === "income" ? "Save Income" : "Save Expense"}
                </>
              )}
            </button>

            <button onClick={handleClear} className="quick-add-cancel-btn">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}