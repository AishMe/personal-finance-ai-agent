"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, TrendingUp, TrendingDown, Pencil, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { getUserId } from "@/lib/user";

type Transaction = { id: string; type: "income" | "expense"; amount: number; category: string; description: string; date: string };

const CATEGORIES = {
  expense: ["Food","Rent","Transport","Utilities","Subscriptions","Shopping","Health","Other"],
  income:  ["Salary","Freelance","Investment","Gift","Other"],
};

const CAT_EMOJI: Record<string, string> = {
  Food:"🍔", Rent:"🏠", Transport:"🚗", Utilities:"⚡", Subscriptions:"📱",
  Shopping:"🛍️", Health:"💊", Salary:"💰", Freelance:"💻", Investment:"📈", Gift:"🎁", Other:"📦",
};

interface EditState { id: string; type: "income"|"expense"; amount: string; category: string; description: string; date: string }

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [editing, setEditing]     = useState<EditState | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Add form
  const [addType, setAddType]         = useState<"income"|"expense">("expense");
  const [addAmount, setAddAmount]     = useState("");
  const [addCategory, setAddCategory] = useState("Food");
  const [addDesc, setAddDesc]         = useState("");
  const [addDate, setAddDate]         = useState(new Date().toISOString().split("T")[0]);

  const router = useRouter();

  const fetchTransactions = async () => {
    const userId = await getUserId();
    if (!userId) { router.push("/login"); return; }
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/`, { headers: { "user-id": userId } });
    setTransactions(await res.json());
    setLoading(false);
  };
  useEffect(() => { fetchTransactions(); }, []);

  const handleAdd = async () => {
    if (!addAmount || isNaN(Number(addAmount))) return;
    setSaving(true);
    const userId = await getUserId();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "user-id": userId ?? "" },
      body: JSON.stringify({ type: addType, amount: Number(addAmount), category: addCategory, description: addDesc, date: addDate }),
    });
    setAddAmount(""); setAddDesc(""); setShowForm(false); setSaving(false);
    fetchTransactions();
  };

  const handleDelete = async (id: string) => {
    const userId = await getUserId();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${id}`, { method: "DELETE", headers: { "user-id": userId ?? "" } });
    setTransactions((p) => p.filter((t) => t.id !== id));
  };

  const saveEdit = async () => {
    if (!editing || !editing.amount) return;
    setEditSaving(true);
    const userId = await getUserId();
    // Delete + re-create (backend has no PUT for transactions)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${editing.id}`, { method: "DELETE", headers: { "user-id": userId ?? "" } });
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "user-id": userId ?? "" },
      body: JSON.stringify({ type: editing.type, amount: Number(editing.amount), category: editing.category, description: editing.description, date: editing.date }),
    });
    setEditing(null); setEditSaving(false);
    fetchTransactions();
  };

  const typeBtnStyle = (t: "income"|"expense", active: boolean) => ({
    flex: 1, padding: "9px 0", borderRadius: "var(--radius-md)",
    border: `1px solid ${active ? (t === "expense" ? "#991b1b" : "#064e3b") : "var(--border)"}`,
    background: active ? (t === "expense" ? "var(--danger-dim)" : "var(--success-dim)") : "var(--bg-elevated)",
    color: active ? (t === "expense" ? "var(--danger-text)" : "var(--success-text)") : "var(--text-muted)",
    fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  });

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-sub">Your full income and expense history</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); }} className="btn btn-primary">
          <Plus size={15} /> Add transaction
        </button>
      </div>

      {/* ── Add form ── */}
      {showForm && (
        <div className="card card-p-lg" style={{ marginBottom: 20 }}>
          <h2 style={{ marginBottom: 18 }}>New transaction</h2>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {(["expense","income"] as const).map((t) => (
              <button key={t} onClick={() => { setAddType(t); setAddCategory(CATEGORIES[t][0]); }} style={typeBtnStyle(t, addType === t)}>
                {t === "expense" ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div><label className="form-label">Amount (₹)</label><input type="number" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} placeholder="0" /></div>
            <div><label className="form-label">Category</label><select value={addCategory} onChange={(e) => setAddCategory(e.target.value)}>{CATEGORIES[addType].map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><label className="form-label">Description</label><input type="text" value={addDesc} onChange={(e) => setAddDesc(e.target.value)} placeholder="Optional note" /></div>
            <div><label className="form-label">Date</label><input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} /></div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleAdd} disabled={saving || !addAmount} className="btn btn-primary">
              {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : "Save transaction"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* ── List ── */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 40, display: "flex", justifyContent: "center" }}>
            <Loader2 size={22} className="animate-spin" style={{ color: "var(--accent)" }} />
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
            No transactions yet. Add your first one above.
          </div>
        ) : transactions.map((tx) => {
          // ── Inline edit row ──
          if (editing?.id === tx.id && editing) {
            return (
              <div key={tx.id} style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  {(["expense","income"] as const).map((t) => (
                    <button key={t} onClick={() => setEditing({ ...editing, type: t, category: CATEGORIES[t][0] })} style={typeBtnStyle(t, editing.type === t)}>
                      {t === "expense" ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
                  <div><label className="form-label">Amount (₹)</label><input type="number" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: e.target.value })} /></div>
                  <div><label className="form-label">Category</label><select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>{CATEGORIES[editing.type].map((c) => <option key={c}>{c}</option>)}</select></div>
                  <div><label className="form-label">Description</label><input type="text" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Optional" /></div>
                  <div><label className="form-label">Date</label><input type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} /></div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={saveEdit} disabled={editSaving} className="btn btn-primary btn-sm">
                    {editSaving ? <><Loader2 size={12} className="animate-spin" /> Saving…</> : <><Check size={13} /> Save changes</>}
                  </button>
                  <button onClick={() => setEditing(null)} className="btn btn-secondary btn-sm"><X size={13} /> Cancel</button>
                </div>
              </div>
            );
          }

          // ── Normal row ──
          return (
            <div key={tx.id} className="tx-item">
              <div className={`tx-icon ${tx.type === "income" ? "tx-icon-income" : "tx-icon-expense"}`}>
                {CAT_EMOJI[tx.category] ?? tx.category?.[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="tx-desc">{tx.description || tx.category}</div>
                <div className="tx-meta">{tx.category} · {tx.date}</div>
              </div>
              <div className={`tx-amount mono ${tx.type === "income" ? "tx-amount-income" : "tx-amount-expense"}`}>
                {tx.type === "income" ? "+" : "−"}₹{tx.amount.toLocaleString()}
              </div>
              {/* Edit */}
              <button
                onClick={() => setEditing({ id: tx.id, type: tx.type, amount: String(tx.amount), category: tx.category, description: tx.description, date: tx.date })}
                className="btn btn-ghost btn-icon-sm"
                title="Edit transaction"
                style={{ marginLeft: 8, opacity: 0.5, transition: "opacity 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
              >
                <Pencil size={13} />
              </button>
              {/* Delete */}
              <button
                onClick={() => handleDelete(tx.id)}
                className="btn btn-ghost btn-icon-sm"
                title="Delete transaction"
                style={{ marginLeft: 2, opacity: 0.5, color: "var(--danger)", transition: "opacity 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}