"use client";
// frontend/src/app/budget/page.tsx  —  Day 13

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUserId } from "@/lib/user";
import {
  ShieldCheck, Pencil, Trash2, Plus, Check,
  X, AlertTriangle, AlertCircle, Loader2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface BudgetLimit {
  id?: string;
  category: string;
  amount: number;
}

interface Alert {
  category: string;
  limit: number;
  spent: number;
  percent: number;
  level: "ok" | "warning" | "over";
}

const CATEGORIES = [
  "Food", "Transport", "Shopping", "Entertainment",
  "Health", "Housing", "Utilities", "Subscriptions", "Other",
];

const CAT_EMOJI: Record<string, string> = {
  Food: "🍔", Transport: "🚗", Shopping: "🛍️", Entertainment: "🎬",
  Health: "💊", Housing: "🏠", Utilities: "⚡", Subscriptions: "📱", Other: "📦",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function ProgressBar({ percent, level }: { percent: number; level: string }) {
  const capped = Math.min(percent, 100);
  const color =
    level === "over"    ? "bg-red-500" :
    level === "warning" ? "bg-yellow-400" :
                          "bg-indigo-500";
  return (
    <div className="w-full bg-zinc-700 rounded-full h-2 overflow-hidden">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${capped}%` }}
      />
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function BudgetPage() {
  const [limits, setLimits]   = useState<BudgetLimit[]>([]);
  const [alerts, setAlerts]   = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState<string | null>(null);   // category being saved
  const [deleting, setDeleting] = useState<string | null>(null);

  // Inline edit state
  const [editCat, setEditCat]     = useState<string | null>(null);  // which category is open for editing
  const [editAmount, setEditAmount] = useState("");
  const [addCat, setAddCat]       = useState(CATEGORIES[0]);
  const [addAmount, setAddAmount] = useState("");
  const [showAdd, setShowAdd]     = useState(false);
  const [error, setError]         = useState("");

  const router = useRouter();

  const fetchAll = useCallback(async () => {
    const userId = await getUserId();
    if (!userId) { router.push("/login"); return; }

    try {
      const [limRes, alertRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/limits`, {
          headers: { "user-id": userId },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/alerts`, {
          headers: { "user-id": userId },
        }),
      ]);

      const limData   = await limRes.json();
      const alertData = await alertRes.json();

      setLimits(limData.limits  ?? []);
      setAlerts(alertData.alerts ?? []);
    } catch {
      setError("Couldn't load your budget data.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Save / update a limit ──────────────────────────────────────────────────

  const saveLimit = async (category: string, amount: string) => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) { setError("Please enter a valid amount greater than zero."); return; }
    setError("");
    setSaving(category);

    try {
      const userId = await getUserId();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/budget/limits/${encodeURIComponent(category)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", "user-id": userId ?? "" },
          body: JSON.stringify({ category, amount: parsed }),
        }
      );
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail); }
      setEditCat(null);
      setShowAdd(false);
      setAddAmount("");
      await fetchAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Couldn't save. Please try again.");
    } finally {
      setSaving(null);
    }
  };

  // ── Delete a limit ─────────────────────────────────────────────────────────

  const deleteLimit = async (category: string) => {
    setDeleting(category);
    try {
      const userId = await getUserId();
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/budget/limits/${encodeURIComponent(category)}`,
        { method: "DELETE", headers: { "user-id": userId ?? "" } }
      );
      await fetchAll();
    } catch {
      setError("Couldn't delete that limit.");
    } finally {
      setDeleting(null);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const alertMap: Record<string, Alert> = {};
  alerts.forEach((a) => { alertMap[a.category] = a; });

  const setCategoriesInUse = new Set(limits.map((l) => l.category));
  const availableToAdd = CATEGORIES.filter((c) => !setCategoriesInUse.has(c));

  const warningCount = alerts.filter((a) => a.level === "warning" || a.level === "over").length;

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-900/50 border border-indigo-700/50 flex items-center justify-center">
            <ShieldCheck size={20} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">Budget Limits</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              Set monthly spending caps per category. Get alerted when you&apos;re close.
            </p>
          </div>
        </div>
        {warningCount > 0 && (
          <span className="text-xs bg-yellow-900/50 border border-yellow-700/50 text-yellow-400 px-3 py-1.5 rounded-full font-medium">
            {warningCount} alert{warningCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mb-4 text-sm text-red-300 bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3">
          <AlertCircle size={14} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")}><X size={13} /></button>
        </div>
      )}

      {/* Existing limits */}
      {limits.length === 0 && !showAdd ? (
        <div className="budget-empty-state">
          <ShieldCheck size={32} className="text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">No budget limits set yet</p>
          <p className="text-zinc-600 text-sm mt-1">
            Add a limit for any spending category and we&apos;ll alert you when you&apos;re getting close.
          </p>
          <button onClick={() => setShowAdd(true)} className="btn-primary mt-5 mx-auto">
            <Plus size={15} /> Add your first limit
          </button>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {limits.map((lim) => {
            const alert     = alertMap[lim.category];
            const isEditing = editCat === lim.category;
            const isSaving  = saving  === lim.category;
            const isDeleting = deleting === lim.category;

            return (
              <div
                key={lim.category}
                className={`budget-card ${
                  alert?.level === "over"    ? "budget-card-over"    :
                  alert?.level === "warning" ? "budget-card-warning" : ""
                }`}
              >
                {/* Top row */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{CAT_EMOJI[lim.category] ?? "📦"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-200 text-sm">{lim.category}</span>
                      {alert?.level === "over" && (
                        <span className="text-xs bg-red-900/60 text-red-400 px-2 py-0.5 rounded-full">Over budget!</span>
                      )}
                      {alert?.level === "warning" && (
                        <span className="text-xs bg-yellow-900/60 text-yellow-400 px-2 py-0.5 rounded-full">
                          {alert.percent.toFixed(0)}% used
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditCat(lim.category); setEditAmount(String(lim.amount)); setError(""); }}
                        className="icon-btn"
                        title="Edit limit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteLimit(lim.category)}
                        disabled={!!isDeleting}
                        className="icon-btn icon-btn-danger"
                        title="Remove limit"
                      >
                        {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {alert && (
                  <div className="mb-3">
                    <ProgressBar percent={alert.percent} level={alert.level} />
                    <div className="flex justify-between text-xs text-zinc-500 mt-1">
                      <span>₹{alert.spent.toLocaleString()} spent</span>
                      <span>₹{alert.limit.toLocaleString()} limit</span>
                    </div>
                  </div>
                )}

                {!alert && (
                  <p className="text-xs text-zinc-600 mb-2">
                    Limit: ₹{lim.amount.toLocaleString()} / month · No spending yet this month
                  </p>
                )}

                {/* Inline edit form */}
                {isEditing && (
                  <div className="flex gap-2 mt-2">
                    <div className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 flex-1">
                      <span className="text-zinc-500 text-sm">₹</span>
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveLimit(lim.category, editAmount)}
                        autoFocus
                        className="bg-transparent text-zinc-200 text-sm w-full focus:outline-none"
                        placeholder="Monthly limit"
                      />
                    </div>
                    <button
                      onClick={() => saveLimit(lim.category, editAmount)}
                      disabled={isSaving}
                      className="btn-primary px-3 py-1.5 text-xs"
                    >
                      {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    </button>
                    <button
                      onClick={() => setEditCat(null)}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add new limit form */}
      {showAdd && availableToAdd.length > 0 && (
        <div className="budget-card mb-4">
          <p className="text-sm font-medium text-zinc-300 mb-3">Add a new budget limit</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Category</label>
              <select
                value={addCat}
                onChange={(e) => setAddCat(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-600 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {availableToAdd.map((c) => (
                  <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Monthly limit (₹)</label>
              <div className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2">
                <span className="text-zinc-500 text-sm">₹</span>
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveLimit(addCat, addAmount)}
                  placeholder="e.g. 5000"
                  className="bg-transparent text-zinc-200 text-sm w-full focus:outline-none"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => saveLimit(addCat, addAmount)}
              disabled={!!saving}
              className="btn-primary"
            >
              {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Check size={13} /> Save limit</>}
            </button>
            <button onClick={() => { setShowAdd(false); setAddAmount(""); setError(""); }} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add button (when limits exist) */}
      {limits.length > 0 && !showAdd && availableToAdd.length > 0 && (
        <button onClick={() => { setShowAdd(true); setAddCat(availableToAdd[0]); setAddAmount(""); }} className="btn-secondary w-full justify-center">
          <Plus size={15} /> Add another limit
        </button>
      )}

      {availableToAdd.length === 0 && (
        <p className="text-xs text-zinc-600 text-center mt-2">
          You&apos;ve set limits for all categories.
        </p>
      )}
    </div>
  );
}