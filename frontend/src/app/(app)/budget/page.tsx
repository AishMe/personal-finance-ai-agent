"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUserId } from "@/lib/user";
import { ShieldCheck, Pencil, Trash2, Plus, Check, X, AlertCircle, Loader2 } from "lucide-react";

interface BudgetLimit { id?: string; category: string; amount: number }
interface Alert { category: string; limit: number; spent: number; percent: number; level: "ok"|"warning"|"over" }

const CATEGORIES = ["Food","Transport","Shopping","Entertainment","Health","Housing","Utilities","Subscriptions","Other"];
const CAT_EMOJI: Record<string, string> = {
  Food:"🍔", Transport:"🚗", Shopping:"🛍️", Entertainment:"🎬",
  Health:"💊", Housing:"🏠", Utilities:"⚡", Subscriptions:"📱", Other:"📦",
};

function ProgressBar({ percent, level }: { percent: number; level: string }) {
  const fill = level === "over" ? "progress-fill-danger" : level === "warning" ? "progress-fill-warning" : "progress-fill-accent";
  return (
    <div className="progress-track">
      <div className={`progress-fill ${fill}`} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  );
}

export default function BudgetPage() {
  const [limits, setLimits]     = useState<BudgetLimit[]>([]);
  const [alerts, setAlerts]     = useState<Alert[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editCat, setEditCat]   = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [addCat, setAddCat]     = useState(CATEGORIES[0]);
  const [addAmount, setAddAmount] = useState("");
  const [showAdd, setShowAdd]   = useState(false);
  const [error, setError]       = useState("");
  const router = useRouter();

  const fetchAll = useCallback(async () => {
    const userId = await getUserId();
    if (!userId) { router.push("/login"); return; }
    try {
      const [limRes, alertRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/limits`, { headers: { "user-id": userId } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/alerts`,  { headers: { "user-id": userId } }),
      ]);
      setLimits((await limRes.json()).limits   ?? []);
      setAlerts((await alertRes.json()).alerts ?? []);
    } catch { setError("Couldn't load your budget data."); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveLimit = async (category: string, amount: string) => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) { setError("Please enter a valid amount greater than zero."); return; }
    setError(""); setSaving(category);
    try {
      const userId = await getUserId();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/limits/${encodeURIComponent(category)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "user-id": userId ?? "" },
        body: JSON.stringify({ category, amount: parsed }),
      });
      if (!res.ok) throw new Error((await res.json()).detail);
      setEditCat(null); setShowAdd(false); setAddAmount("");
      await fetchAll();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Couldn't save."); }
    finally { setSaving(null); }
  };

  const deleteLimit = async (category: string) => {
    setDeleting(category);
    try {
      const userId = await getUserId();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/limits/${encodeURIComponent(category)}`, {
        method: "DELETE", headers: { "user-id": userId ?? "" },
      });
      await fetchAll();
    } catch { setError("Couldn't delete that limit."); }
    finally { setDeleting(null); }
  };

  const alertMap: Record<string, Alert> = {};
  alerts.forEach((a) => { alertMap[a.category] = a; });
  const usedCats    = new Set(limits.map((l) => l.category));
  const available   = CATEGORIES.filter((c) => !usedCats.has(c));
  const warnCount   = alerts.filter((a) => a.level !== "ok").length;

  if (loading) return (
    <div className="page-container" style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh" }}>
      <Loader2 size={22} className="animate-spin" style={{ color: "var(--accent)" }} />
    </div>
  );

  return (
    <div className="page-container" style={{ maxWidth: 680 }}>

      {/* Header */}
      <div className="page-header" style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap: 12 }}>
          <div className="stat-icon stat-icon-blue"><ShieldCheck size={17} /></div>
          <div>
            <h1 className="page-title">Budget Limits</h1>
            <p className="page-sub">Monthly spending caps per category</p>
          </div>
        </div>
        {warnCount > 0 && (
          <span className="badge badge-warning" style={{ fontSize: 12, padding: "5px 12px" }}>
            {warnCount} alert{warnCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="alert-banner alert-danger" style={{ marginBottom: 16 }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError("")} style={{ background:"none", border:"none", color:"inherit", cursor:"pointer", padding:0, display:"flex" }}>
            <X size={13} />
          </button>
        </div>
      )}

      {/* Empty state */}
      {limits.length === 0 && !showAdd && (
        <div className="budget-empty-state">
          <ShieldCheck size={36} style={{ color:"var(--text-faint)", margin:"0 auto 12px", display:"block" }} />
          <p style={{ fontWeight:600, color:"var(--text-secondary)", marginBottom:6, fontSize:15 }}>No budget limits set yet</p>
          <p style={{ fontSize:13, color:"var(--text-muted)", marginBottom:24 }}>
            Set a monthly cap for any spending category.<br />We'll alert you when you're getting close.
          </p>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary">
            <Plus size={15} /> Add your first limit
          </button>
        </div>
      )}

      {/* Cards */}
      {limits.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap: 12, marginBottom: 16 }}>
          {limits.map((lim) => {
            const alert    = alertMap[lim.category];
            const isEdit   = editCat === lim.category;
            const isSaving = saving  === lim.category;
            const isDel    = deleting === lim.category;
            const borderC  = alert?.level === "over" ? "#7f1d1d" : alert?.level === "warning" ? "#78350f" : "var(--border)";
            const bgC      = alert?.level === "over" ? "var(--danger-dim)" : alert?.level === "warning" ? "var(--warning-dim)" : "var(--bg-surface)";

            return (
              <div key={lim.category} style={{ background:bgC, border:`1px solid ${borderC}`, borderRadius:"var(--radius-lg)", padding:18 }}>
                {/* Top */}
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom: alert || isEdit ? 14 : 0 }}>
                  <span style={{ fontSize:22 }}>{CAT_EMOJI[lim.category]}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontWeight:600, fontSize:14, color:"var(--text-primary)" }}>{lim.category}</span>
                      {alert?.level === "over"    && <span className="badge badge-danger">Over budget</span>}
                      {alert?.level === "warning" && <span className="badge badge-warning">{alert.percent.toFixed(0)}% used</span>}
                    </div>
                    {!isEdit && (
                      <span style={{ fontSize:12, color:"var(--text-muted)" }}>₹{lim.amount.toLocaleString()} / month</span>
                    )}
                  </div>
                  {!isEdit && (
                    <div style={{ display:"flex", gap:6 }}>
                      <button
                        onClick={() => { setEditCat(lim.category); setEditAmount(String(lim.amount)); setError(""); }}
                        className="btn btn-secondary btn-icon"
                        style={{ width:32, height:32 }}
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteLimit(lim.category)}
                        disabled={!!isDel}
                        className="btn btn-danger btn-icon"
                        style={{ width:32, height:32 }}
                        title="Delete"
                      >
                        {isDel ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress */}
                {alert && (
                  <div style={{ marginBottom: isEdit ? 14 : 0 }}>
                    <ProgressBar percent={alert.percent} level={alert.level} />
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--text-muted)", marginTop:5 }}>
                      <span>₹{alert.spent.toLocaleString()} spent</span>
                      <span>₹{alert.limit.toLocaleString()} limit</span>
                    </div>
                  </div>
                )}

                {/* Inline edit */}
                {isEdit && (
                  <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
                    <div style={{ flex:1 }}>
                      <label className="form-label">Monthly limit (₹)</label>
                      <div className="input-group">
                        <span className="input-prefix">₹</span>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveLimit(lim.category, editAmount)}
                          autoFocus
                          placeholder="Amount"
                        />
                      </div>
                    </div>
                    <button onClick={() => saveLimit(lim.category, editAmount)} disabled={isSaving} className="btn btn-primary">
                      {isSaving ? <Loader2 size={13} className="animate-spin" /> : <><Check size={13} /> Save</>}
                    </button>
                    <button onClick={() => setEditCat(null)} className="btn btn-secondary">
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add form */}
      {showAdd && available.length > 0 && (
        <div className="card card-p-lg" style={{ marginBottom: 16 }}>
          <h2 style={{ marginBottom: 16 }}>Add a new limit</h2>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div>
              <label className="form-label">Category</label>
              <select value={addCat} onChange={(e) => setAddCat(e.target.value)}>
                {available.map((c) => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Monthly limit (₹)</label>
              <div className="input-group">
                <span className="input-prefix">₹</span>
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveLimit(addCat, addAmount)}
                  placeholder="e.g. 5000"
                />
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => saveLimit(addCat, addAmount)} disabled={!!saving} className="btn btn-primary">
              {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Check size={14} /> Save limit</>}
            </button>
            <button onClick={() => { setShowAdd(false); setAddAmount(""); setError(""); }} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add another */}
      {limits.length > 0 && !showAdd && available.length > 0 && (
        <button
          onClick={() => { setShowAdd(true); setAddCat(available[0]); setAddAmount(""); }}
          className="btn btn-secondary"
          style={{ width:"100%", justifyContent:"center" }}
        >
          <Plus size={15} /> Add another limit
        </button>
      )}

      {available.length === 0 && limits.length > 0 && (
        <p style={{ textAlign:"center", fontSize:12, color:"var(--text-faint)", marginTop:8 }}>
          You've set limits for all categories.
        </p>
      )}
    </div>
  );
}