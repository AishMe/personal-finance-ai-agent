"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async () => {
    setLoading(true);
    setError("");
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else { router.push("/"); router.refresh(); }
    setLoading(false);
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    // Store demo user ID in sessionStorage
    // so all API calls use demo data
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/demo/user-id`);
    const data = await res.json();
    sessionStorage.setItem("demo_user_id", data.user_id);
    sessionStorage.setItem("is_demo", "true");
    router.push("/");
    setDemoLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-8 border border-gray-100 shadow-xl">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
            F
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-800">FinanceAI</p>
            <p className="text-xs text-gray-400">Personal finance assistant</p>
          </div>
        </div>

        <h1 className="text-xl font-bold text-gray-800 mb-1">
          {isSignUp ? "Create account" : "Welcome back"}
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          {isSignUp ? "Start managing your finances smarter" : "Sign in to continue"}
        </p>

        {error && (
          <div className="text-sm rounded-xl px-4 py-3 mb-4 bg-red-50 text-red-500">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl px-4 py-2.5 text-sm border border-gray-200 text-gray-800 placeholder:text-gray-300 outline-none focus:border-indigo-400 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === "Enter" && handleAuth()}
              className="w-full rounded-xl px-4 py-2.5 text-sm border border-gray-200 text-gray-800 placeholder:text-gray-300 outline-none focus:border-indigo-400 transition-colors"
            />
          </div>
        </div>

        <button
          onClick={handleAuth}
          disabled={loading || !email || !password}
          className="w-full mt-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          {loading ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Demo button */}
        <button
          onClick={handleDemo}
          disabled={demoLoading}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 transition-colors border border-indigo-100"
        >
          {demoLoading ? "Loading demo..." : "Try Demo — no signup needed"}
        </button>

        <p className="text-center text-sm text-gray-400 mt-4">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
            className="text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}