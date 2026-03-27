"use client";
// Compact alert strip shown at the top of the Dashboard when limits are close/exceeded.

import { useEffect, useState } from "react";
import { AlertTriangle, AlertCircle, X, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getUserId } from "@/lib/user";

interface Alert {
  category: string;
  limit: number;
  spent: number;
  percent: number;
  level: "ok" | "warning" | "over";
}

const CAT_EMOJI: Record<string, string> = {
  Food: "🍔", Transport: "🚗", Shopping: "🛍️", Entertainment: "🎬",
  Health: "💊", Housing: "🏠", Utilities: "⚡", Subscriptions: "📱", Other: "📦",
};

export default function BudgetAlerts() {
  const [alerts, setAlerts]   = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [hasLimits, setHasLimits] = useState(false);

  useEffect(() => {
    (async () => {
      const userId = await getUserId();
      if (!userId) return;
      try {
        const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/budget/alerts`, {
          headers: { "user-id": userId },
        });
        if (!res.ok) return;
        const data = await res.json();
        setAlerts(data.alerts ?? []);
        setHasLimits(data.has_limits ?? false);
      } catch { /* silently ignore */ }
    })();
  }, []);

  const visible = alerts.filter(
    (a) => (a.level === "warning" || a.level === "over") && !dismissed.has(a.category)
  );

  // Don't render anything if no alerts or all dismissed
  if (!hasLimits || visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {visible.map((alert) => (
        <div
          key={alert.category}
          className={`budget-alert-strip ${
            alert.level === "over" ? "budget-alert-over" : "budget-alert-warning"
          }`}
        >
          <span className="text-base">{CAT_EMOJI[alert.category] ?? "📦"}</span>

          <div className="flex-1 min-w-0">
            {alert.level === "over" ? (
              <span className="text-sm font-medium">
                <span className="font-semibold">{alert.category}</span> is over budget —{" "}
                ₹{alert.spent.toLocaleString()} spent of ₹{alert.limit.toLocaleString()} limit
              </span>
            ) : (
              <span className="text-sm font-medium">
                <span className="font-semibold">{alert.category}</span> is at{" "}
                {alert.percent.toFixed(0)}% of your ₹{alert.limit.toLocaleString()} budget
              </span>
            )}
          </div>

          <Link
            href="/budget"
            className="text-xs underline underline-offset-2 opacity-75 hover:opacity-100 whitespace-nowrap flex items-center gap-0.5"
          >
            Edit <ArrowRight size={11} />
          </Link>

          <button
            onClick={() => setDismissed((d) => new Set(d).add(alert.category))}
            className="text-current opacity-50 hover:opacity-100 transition-opacity shrink-0"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}