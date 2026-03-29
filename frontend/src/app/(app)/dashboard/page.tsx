"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUserId } from "@/lib/user";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import QuickAddExpense from "@/components/QuickAddExpense";
import BudgetAlerts    from "@/components/BudgetAlerts";

const PIE_COLORS = ["#4f6ef7","#34d399","#fbbf24","#f87171","#a78bfa","#22d3ee","#fb923c","#a3e635"];

type Summary      = { monthly_income: number; total_expenses: number; balance: number; savings_goal: number; savings_rate: number; currency: string };
type CategoryItem = { name: string; value: number };
type TrendItem    = { month: string; income: number; expense: number };
type Transaction  = { id: string; type: string; amount: number; category: string; description: string; date: string };
type DashboardData = { summary: Summary; category_breakdown: CategoryItem[]; monthly_trend: TrendItem[]; recent_transactions: Transaction[] };

const CAT_EMOJI: Record<string, string> = {
  Food:"🍔", Transport:"🚗", Shopping:"🛍️", Entertainment:"🎬",
  Health:"💊", Housing:"🏠", Utilities:"⚡", Subscriptions:"📱",
  Salary:"💰", Freelance:"💻", Investment:"📈", Gift:"🎁", Other:"📦",
};

export default function DashboardPage() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const router = useRouter();

  const fetchDashboard = useCallback(async () => {
    const userId = await getUserId();
    if (!userId) { router.push("/login"); return; }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/summary`, { headers: { "user-id": userId } });
      if (!res.ok) throw new Error("Failed");
      setData(await res.json());
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) return (
    <div className="page-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <Loader2 size={22} className="animate-spin" style={{ color: "var(--accent)" }} />
    </div>
  );

  if (error || !data) return (
    <div className="page-container">
      <div className="alert-banner alert-danger">{error || "Could not load dashboard."}</div>
    </div>
  );

  const { summary, category_breakdown, monthly_trend, recent_transactions } = data;
  const cur = summary.currency === "INR" ? "₹" : summary.currency;
  const savingsPct = Math.min(100, Math.round((summary.balance / (summary.savings_goal || 1)) * 100));

  const stats = [
    { label: "Monthly Income",    value: `${cur}${summary.monthly_income.toLocaleString()}`,  sub: "Base salary + other",                 icon: TrendingUp,   iconClass: "stat-icon-green"  },
    { label: "Spent This Month",  value: `${cur}${summary.total_expenses.toLocaleString()}`,  sub: `${((summary.total_expenses/(summary.monthly_income||1))*100).toFixed(0)}% of income`,    icon: TrendingDown, iconClass: "stat-icon-red"    },
    { label: "Remaining",         value: `${cur}${summary.balance.toLocaleString()}`,         sub: `${summary.savings_rate}% savings rate`, icon: Wallet,       iconClass: "stat-icon-blue"   },
    { label: "Savings Goal",      value: `${cur}${summary.savings_goal.toLocaleString()}`,    sub: summary.balance >= summary.savings_goal ? "✓ On track" : `${savingsPct}% reached`, icon: PiggyBank, iconClass: summary.balance >= summary.savings_goal ? "stat-icon-green" : "stat-icon-amber" },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title" style={{ fontSize: 28 }}>Dashboard</h1>
        <p className="page-sub">
          {new Date().toLocaleString("default", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Budget alerts */}
      <BudgetAlerts />

      {/* Quick add */}
      <div style={{ marginBottom: 24 }}>
        <QuickAddExpense onSaved={fetchDashboard} />
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div className={`stat-icon ${s.iconClass}`}><Icon size={15} /></div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value mono">{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Pie */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Spending by category</span>
          </div>
          <div className="card-p">
            {category_breakdown.length === 0 ? (
              <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No expenses yet this month</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={category_breakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
                      {category_breakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [`${cur}${Number(v).toLocaleString()}`, ""]}
                      contentStyle={{ background: "var(--bg-overlay)", border: "1px solid var(--border-light)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px", marginTop: 8 }}>
                  {category_breakdown.map((item, i) => (
                    <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                      <span style={{ color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                      <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", fontSize: 11 }}>{cur}{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bar */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Income vs expenses</span>
          </div>
          <div className="card-p">
            {monthly_trend.length === 0 ? (
              <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthly_trend} barSize={14} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "var(--font-ui)" }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "var(--font-ui)" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v, n) => [`${cur}${Number(v).toLocaleString()}`, n]}
                    contentStyle={{ background: "var(--bg-overlay)", border: "1px solid var(--border-light)", borderRadius: 8, fontSize: 13, color: "var(--text-primary)", boxShadow: "0 4px 16px rgba(0,0,0,0.5)" }}
                    labelStyle={{ color: "var(--text-muted)", marginBottom: 4 }}
                    itemStyle={{ color: "var(--text-secondary)" }}
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  />
                  <Bar dataKey="income"  fill="#34d399" radius={[4,4,0,0]} name="Income" />
                  <Bar dataKey="expense" fill="#4f6ef7" radius={[4,4,0,0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent transactions</span>
          <Link href="/transactions" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>
            View all <ArrowRight size={13} />
          </Link>
        </div>
        {recent_transactions.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No transactions yet.{" "}
            <Link href="/transactions" style={{ color: "var(--accent)" }}>Add your first one</Link>
          </div>
        ) : (
          recent_transactions.map((tx) => (
            <div key={tx.id} className="tx-item">
              <div className={`tx-icon ${tx.type === "income" ? "tx-icon-income" : "tx-icon-expense"}`}>
                {CAT_EMOJI[tx.category] ?? tx.category?.[0] ?? "?"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="tx-desc">{tx.description || tx.category}</div>
                <div className="tx-meta">{tx.category} · {tx.date}</div>
              </div>
              <div className={`tx-amount ${tx.type === "income" ? "tx-amount-income" : "tx-amount-expense"}`}>
                {tx.type === "income" ? "+" : "−"}{cur}{tx.amount.toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}