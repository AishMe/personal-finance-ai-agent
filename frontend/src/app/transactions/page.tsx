"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2 } from "lucide-react";

type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
};

const CATEGORIES = {
  expense: ["Food", "Rent", "Transport", "Utilities", "Subscriptions", "Shopping", "Health", "Other"],
  income:  ["Salary", "Freelance", "Investment", "Gift", "Other"],
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  const fetchTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/transactions/`,
      { headers: { "user-id": user.id } }
    );
    const data = await res.json();
    setTransactions(data);
    setLoading(false);
  };

  useEffect(() => { fetchTransactions(); }, []);

  const handleAdd = async () => {
    if (!amount || isNaN(Number(amount))) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "user-id": user.id,
      },
      body: JSON.stringify({ type, amount: Number(amount), category, description, date: txDate }),
    });

    setAmount("");
    setDescription("");
    setShowForm(false);
    setSaving(false);
    fetchTransactions();
  };

  const handleDelete = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${id}`, {
      method: "DELETE",
      headers: { "user-id": user.id },
    });
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Transactions</h1>
          <p className="text-gray-500 text-sm mt-1">Track your income and expenses</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add transaction
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-5 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">New transaction</h2>

          {/* Type toggle */}
          <div className="flex gap-2 mb-4">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setType(t); setCategory(CATEGORIES[t][0]); }}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                  type === t
                    ? t === "expense"
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : "bg-green-50 text-green-600 border border-green-200"
                    : "bg-gray-50 text-gray-500 border border-gray-100"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full border border-zinc-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-700 text-zinc-100"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES[type].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional note"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Date</label>
              <input
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !amount}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white py-2 rounded-xl text-sm font-medium transition-colors"
            >
              {saving ? "Saving..." : "Save transaction"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-zinc-800 rounded-2xl border border-zinc-700 shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No transactions yet. Add your first one above.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map((tx) => (
              <div key={tx.id} className="px-5 py-4 flex items-center gap-4 group hover:bg-zinc-700/50 transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                  tx.type === "income"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  {tx.category[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate">
                    {tx.description || tx.category}
                  </p>
                  <p className="text-xs text-zinc-400">{tx.category} · {tx.date}</p>
                </div>
                <p className={`text-sm font-semibold ${
                  tx.type === "income" ? "text-green-600" : "text-gray-800"
                }`}>
                  {tx.type === "income" ? "+" : "-"}₹{tx.amount.toLocaleString()}
                </p>
                <button
                  onClick={() => handleDelete(tx.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all ml-2"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}