"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { getUserId } from "@/lib/user";
import {
  CheckCircle, AlertTriangle, Info, Lightbulb, RefreshCw,
} from "lucide-react";

type Insight = {
  type: "success" | "warning" | "info" | "tip";
  title: string;
  message: string;
  action: string;
};

const insightConfig = {
  success: {
    icon: CheckCircle,
    bg: "bg-green-50",
    border: "border-green-200",
    iconColor: "text-green-500",
    titleColor: "text-green-800",
    textColor: "text-green-700",
    actionColor: "text-green-600",
    badge: "bg-green-100 text-green-700",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconColor: "text-amber-500",
    titleColor: "text-amber-800",
    textColor: "text-amber-700",
    actionColor: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconColor: "text-blue-500",
    titleColor: "text-blue-800",
    textColor: "text-blue-700",
    actionColor: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
  },
  tip: {
    icon: Lightbulb,
    bg: "bg-purple-50",
    border: "border-purple-200",
    iconColor: "text-purple-500",
    titleColor: "text-purple-800",
    textColor: "text-purple-700",
    actionColor: "text-purple-600",
    badge: "bg-purple-100 text-purple-700",
  },
};

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const router = useRouter();

  const fetchInsights = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const userId = await getUserId();
    if (!userId) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/insights/`,
        { headers: { "user-id": userId } }
      );
      const data = await res.json();
      setInsights(data.insights || []);
      setMessage(data.message || "");
    } catch (e) {
      setMessage("Failed to load insights.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchInsights(); }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">AI Insights</h1>
          <p className="text-gray-500 text-sm mt-1">
            Automatically generated from your financial data
          </p>
        </div>
        <button
          onClick={() => fetchInsights(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-gray-50 border border-gray-100 rounded-2xl p-5 animate-pulse h-40"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && message && insights.length === 0 && (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-10 text-center">
          <Lightbulb size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">{message}</p>
        </div>
      )}

      {/* Insight Cards */}
      {!loading && insights.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {insights.map((insight, i) => {
              const config = insightConfig[insight.type] ?? insightConfig.info;
              const Icon = config.icon;
              return (
                <div
                  key={i}
                  className={`rounded-2xl border p-5 ${config.bg} ${config.border}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Icon size={20} className={`mt-0.5 shrink-0 ${config.iconColor}`} />
                    <div className="flex-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.badge} capitalize`}>
                        {insight.type}
                      </span>
                      <h3 className={`font-semibold mt-2 ${config.titleColor}`}>
                        {insight.title}
                      </h3>
                    </div>
                  </div>
                  <p className={`text-sm leading-relaxed mb-3 ${config.textColor}`}>
                    {insight.message}
                  </p>
                  <div className={`text-xs font-medium ${config.actionColor} flex items-center gap-1`}>
                    <span>→</span>
                    <span>{insight.action}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-400 text-center mt-6">
            Insights are generated by AI based on your transaction data.
            Not financial advice — consult a professional for major decisions.
          </p>
        </>
      )}
    </div>
  );
}