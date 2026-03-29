"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserId } from "@/lib/user";
import { Check, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [name, setName]               = useState("");
  const [income, setIncome]           = useState("");
  const [savingsGoal, setSavingsGoal] = useState("");
  const [currency, setCurrency]       = useState("INR");
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const userId = await getUserId();
      if (!userId) { router.push("/login"); return; }
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/`, { headers: { "user-id": userId } });
      const data = await res.json();
      setName(data.name || ""); setIncome(data.monthly_income?.toString() || "");
      setSavingsGoal(data.savings_goal?.toString() || ""); setCurrency(data.currency || "INR");
    })();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    const userId = await getUserId();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "user-id": userId ?? "" },
      body: JSON.stringify({ name, monthly_income: Number(income), savings_goal: Number(savingsGoal), currency }),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="page-container" style={{ maxWidth: 520 }}>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">Update your profile so Adulting.ai can personalise its advice.</p>
      </div>

      <div className="card card-p-lg" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label className="form-label">Your name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </div>

        <div>
          <label className="form-label">Monthly income (₹)</label>
          <div className="input-group">
            <span className="input-prefix">₹</span>
            <input type="number" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="50000" />
          </div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>
            Used by AI to calculate your savings rate, give budget advice, and auto-fill salary entries.
          </p>
        </div>

        <div>
          <label className="form-label">Monthly savings goal (₹)</label>
          <div className="input-group">
            <span className="input-prefix">₹</span>
            <input type="number" value={savingsGoal} onChange={(e) => setSavingsGoal(e.target.value)} placeholder="10000" />
          </div>
        </div>

        <div>
          <label className="form-label">Currency</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="INR">INR — Indian Rupee (₹)</option>
            <option value="USD">USD — US Dollar ($)</option>
            <option value="EUR">EUR — Euro (€)</option>
            <option value="GBP">GBP — British Pound (£)</option>
          </select>
        </div>

        <div className="divider" />

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
          style={{ alignSelf: "flex-start", minWidth: 140 }}
        >
          {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</>
          : saved  ? <><Check size={13} /> Saved!</>
          : "Save settings"}
        </button>
      </div>
    </div>
  );
}