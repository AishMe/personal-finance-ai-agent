"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserId } from "@/lib/user";
import { CheckCircle, AlertTriangle, Info, Lightbulb, RefreshCw, Loader2, Sparkles } from "lucide-react";

type Insight = { type: "success"|"warning"|"info"|"tip"; title: string; message: string; action: string };

const CONFIG = {
  success: { icon: CheckCircle,  bg: "var(--success-dim)",  border: "#064e3b", color: "var(--success-text)",  iconColor: "#34d399" },
  warning: { icon: AlertTriangle, bg: "var(--warning-dim)", border: "#78350f", color: "var(--warning-text)",  iconColor: "#fbbf24" },
  info:    { icon: Info,          bg: "var(--accent-dim)",  border: "#1e3a8a", color: "#a5b4fc",              iconColor: "var(--accent)" },
  tip:     { icon: Lightbulb,     bg: "#1e0f4b",            border: "#4c1d95", color: "#c084fc",              iconColor: "#a855f7" },
};

export default function InsightsPage() {
  const [insights, setInsights]   = useState<Insight[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage]     = useState("");
  const router = useRouter();

  const fetchInsights = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const userId = await getUserId();
    if (!userId) { router.push("/login"); return; }
    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/insights/`, { headers: { "user-id": userId } });
      const data = await res.json();
      setInsights(data.insights || []); setMessage(data.message || "");
    } catch { setMessage("Failed to load insights."); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchInsights(); }, []);

  return (
    <div className="page-container" style={{ maxWidth: 760 }}>
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={20} style={{ color: "var(--accent)" }} />
            AI Insights
          </h1>
          <p className="page-sub">Automatically generated from your financial data</p>
        </div>
        <button onClick={() => fetchInsights(true)} disabled={refreshing || loading} className="btn btn-secondary btn-sm">
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[1,2,3,4].map((i) => <div key={i} className="skeleton" style={{ height: 140, borderRadius: "var(--radius-lg)" }} />)}
        </div>
      )}

      {!loading && message && insights.length === 0 && (
        <div className="budget-empty-state">
          <Lightbulb size={28} style={{ color: "var(--text-faint)", margin: "0 auto 10px" }} />
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{message}</p>
        </div>
      )}

      {!loading && insights.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            {insights.map((ins, i) => {
              const cfg  = CONFIG[ins.type] ?? CONFIG.info;
              const Icon = cfg.icon;
              return (
                <div key={i} style={{
                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                  borderRadius: "var(--radius-lg)", padding: 20,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <Icon size={16} style={{ color: cfg.iconColor, flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: cfg.iconColor, display: "block", marginBottom: 4 }}>{ins.type}</span>
                      <p style={{ fontSize: 13, fontWeight: 600, color: cfg.color, margin: 0 }}>{ins.title}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, lineHeight: 1.7, color: cfg.color, opacity: 0.85, marginBottom: 10 }}>{ins.message}</p>
                  <p style={{ fontSize: 11, color: cfg.iconColor, fontWeight: 500 }}>→ {ins.action}</p>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: "var(--text-faint)", textAlign: "center" }}>
            AI-generated insights based on your data. Not financial advice.
          </p>
        </>
      )}
    </div>
  );
}