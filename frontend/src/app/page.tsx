"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUserId } from "@/lib/user";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import QuickAddExpense from "@/components/QuickAddExpense"; 

const PIE_COLORS = [
  "#6366f1","#10b981","#f59e0b","#ef4444",
  "#8b5cf6","#06b6d4","#f97316","#84cc16",
];

type Summary = {
  monthly_income: number;
  total_expenses: number;
  balance: number;
  savings_goal: number;
  savings_rate: number;
  currency: string;
};

type CategoryItem = { name: string; value: number };
type TrendItem   = { month: string; income: number; expense: number };
type Transaction = {
  id: string; type: string; amount: number;
  category: string; description: string; date: string;
};

type DashboardData = {
  summary: Summary;
  category_breakdown: CategoryItem[];
  monthly_trend: TrendItem[];
  recent_transactions: Transaction[];
};

export default function DashboardPage() {
  const [data, setData]     = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  const router = useRouter();

  const fetchDashboard = useCallback(async () => {
    const userId = await getUserId();
    if (!userId) {
      router.push("/login");
      return;
    }
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/dashboard/summary`,
        { headers: { "user-id": userId } }
      );
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-gray-400 text-sm">Loading your dashboard...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 rounded-xl p-4 text-sm">
          {error || "Could not load dashboard. Make sure your backend is running."}
        </div>
      </div>
    );
  }

  const { summary, category_breakdown, monthly_trend, recent_transactions } = data;
  const cur = summary.currency === "INR" ? "₹" : summary.currency;

  const summaryCards = [
    {
      label: "Monthly Income",
      value: `${cur}${summary.monthly_income.toLocaleString()}`,
      sub: "This month",
      icon: TrendingUp,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Total Expenses",
      value: `${cur}${summary.total_expenses.toLocaleString()}`,
      sub: `${((summary.total_expenses / (summary.monthly_income || 1)) * 100).toFixed(0)}% of income`,
      icon: TrendingDown,
      color: "bg-red-50 text-red-600",
    },
    {
      label: "Remaining Balance",
      value: `${cur}${summary.balance.toLocaleString()}`,
      sub: `${summary.savings_rate}% savings rate`,
      icon: Wallet,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Savings Goal",
      value: `${cur}${summary.savings_goal.toLocaleString()}`,
      sub: summary.balance >= summary.savings_goal ? "On track!" : "Not yet reached",
      icon: PiggyBank,
      color: summary.balance >= summary.savings_goal
        ? "bg-purple-50 text-purple-600"
        : "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Your financial snapshot for{" "}
          {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── Natural Language Quick Add ── */}
      <QuickAddExpense onSaved={fetchDashboard} />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <p className="text-xl font-semibold text-gray-800">{card.value}</p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Spending by category</h2>
          {category_breakdown.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No expenses yet this month
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={category_breakdown}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={3} dataKey="value"
                  >
                    {category_breakdown.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${cur}${Number(value).toLocaleString()}`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 grid grid-cols-2 gap-1">
                {category_breakdown.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs text-gray-600">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="truncate">{item.name}</span>
                    <span className="ml-auto font-medium text-gray-800">
                      {cur}{item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Income vs expenses trend</h2>
          {monthly_trend.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthly_trend} barSize={18} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(v) => `${cur}${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value) => [`${cur}${Number(value).toLocaleString()}`, ""]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income"  fill="#10b981" radius={[4,4,0,0]} name="Income" />
                <Bar dataKey="expense" fill="#6366f1" radius={[4,4,0,0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Recent transactions</h2>
          <Link
            href="/transactions"
            className="text-indigo-600 text-sm hover:underline flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {recent_transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No transactions yet.{" "}
            <Link href="/transactions" className="text-indigo-600 hover:underline">
              Add your first one
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent_transactions.map((tx) => (
              <div key={tx.id} className="px-6 py-4 flex items-center gap-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                  tx.type === "income"
                    ? "bg-green-100 text-green-700"
                    : "bg-indigo-100 text-indigo-700"
                }`}>
                  {tx.category?.[0] ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {tx.description || tx.category}
                  </p>
                  <p className="text-xs text-gray-400">{tx.category} · {tx.date}</p>
                </div>
                <p className={`text-sm font-semibold ${
                  tx.type === "income" ? "text-green-600" : "text-gray-800"
                }`}>
                  {tx.type === "income" ? "+" : "-"}{cur}{tx.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}