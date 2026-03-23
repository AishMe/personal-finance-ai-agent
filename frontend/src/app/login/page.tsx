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
  const [error, setError] = useState("");

  const handleAuth = async () => {
  setLoading(true);
  setError("");

  console.log("Attempting auth with:", email);
  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

  const { data, error } = isSignUp
    ? await supabase.auth.signUp({ email, password })
    : await supabase.auth.signInWithPassword({ email, password });

  console.log("Auth result:", { data, error });

  if (error) {
    setError(error.message);
  } else {
    router.push("/");
    router.refresh();
  }
  setLoading(false);
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">F</span>
          </div>
          <div>
            <p className="font-semibold text-gray-800">FinanceAI</p>
            <p className="text-xs text-gray-400">Personal assistant</p>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-gray-800 mb-1">
          {isSignUp ? "Create account" : "Welcome back"}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {isSignUp ? "Start managing your finances" : "Sign in to your account"}
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            />
          </div>
        </div>

        <button
          onClick={handleAuth}
          disabled={loading || !email || !password}
          className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          {loading ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
            className="text-indigo-600 hover:underline font-medium"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}