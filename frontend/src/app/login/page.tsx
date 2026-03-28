"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError]       = useState("");

  const handleAuth = async () => {
    setLoading(true); setError("");
    sessionStorage.removeItem("is_demo");
    sessionStorage.removeItem("demo_user_id");
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else { router.push("/dashboard"); router.refresh(); }
    setLoading(false);
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/demo/user-id`);
    const data = await res.json();
    sessionStorage.setItem("demo_user_id", data.user_id);
    sessionStorage.setItem("is_demo", "true");
    router.push("/dashboard");
    setDemoLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      background: "var(--bg-base)",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: 400, height: 400,
        background: "radial-gradient(circle, rgba(79,110,247,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div className="login-card">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: "linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 15, color: "white",
            boxShadow: "0 2px 10px rgba(79,110,247,0.4)",
          }}>F</div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>Adulting.ai</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Personal finance assistant</p>
          </div>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 4 }}>
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
          {isSignUp ? "Start tracking your finances with AI" : "Sign in to continue"}
        </p>

        {error && (
          <div className="alert-banner alert-danger" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          <div>
            <label className="form-label">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && handleAuth()} />
          </div>
        </div>

        <button
          onClick={handleAuth}
          disabled={loading || !email || !password}
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", padding: "11px 0", fontSize: 13 }}
        >
          {loading ? <><Loader2 size={14} className="animate-spin" /> Please wait…</> : isSignUp ? "Create account" : "Sign in"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
          <div className="divider" style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>or</span>
          <div className="divider" style={{ flex: 1 }} />
        </div>

        <button
          onClick={handleDemo}
          disabled={demoLoading}
          className="btn btn-secondary"
          style={{ width: "100%", justifyContent: "center", padding: "11px 0", fontSize: 13 }}
        >
          {demoLoading
            ? <><Loader2 size={14} className="animate-spin" /> Loading demo…</>
            : <><Sparkles size={14} /> Try demo — no signup needed</>
          }
        </button>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 18 }}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
            style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, padding: 0 }}
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}