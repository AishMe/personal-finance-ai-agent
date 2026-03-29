// frontend/src/app/page.tsx  —  Adulting.ai Landing Page
// The app dashboard moves to /dashboard
"use client"
import Link from "next/link";

/* ─── Feature data ────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: "🤖", title: "AI Financial Copilot",      desc: "Chat with an AI that knows your actual transactions, income, and goals — not generic advice." },
  { icon: "📊", title: "Smart Expense Tracking",    desc: "Log expenses in plain English. Say 'spent 450 on groceries yesterday' and we handle the rest." },
  { icon: "🛡️", title: "Budget Limits & Alerts",   desc: "Set monthly caps per category. Get real-time alerts before you overspend, not after." },
  { icon: "📈", title: "AI-Powered Insights",       desc: "Two-stage AI pipeline spots patterns in your data and delivers actionable savings tips weekly." },
  { icon: "📥", title: "CSV & Excel Import",        desc: "Upload your bank statement and AI auto-categorizes every transaction in seconds." },
  { icon: "🎯", title: "Savings Goals Tracker",     desc: "Set goals, track progress, and let AI build a personalised plan to hit them on time." },
];

const STEPS = [
  { n: "01", title: "Connect your data",          desc: "Sign up and add transactions manually, use natural language, or bulk-import from your bank statement." },
  { n: "02", title: "AI analyses everything",     desc: "Our two-stage AI engine categorises spending, detects patterns, and benchmarks against your goals." },
  { n: "03", title: "Get personalised advice",    desc: "Chat with your financial copilot, review AI insights, and act on specific, number-backed recommendations." },
];

/* ─── Landing Page ────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div style={{ background: "hsl(230,20%,4%)", minHeight: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif", color: "#e2e8f0", overflowX: "hidden" }}>

      {/* ── Ambient background glows ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)", width: 900, height: 600, background: "radial-gradient(ellipse, rgba(0,255,136,0.06) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "30%", right: "-10%", width: 500, height: 500, background: "radial-gradient(circle, rgba(251,191,36,0.04) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "0%", left: "-10%", width: 600, height: 600, background: "radial-gradient(circle, rgba(79,110,247,0.05) 0%, transparent 70%)" }} />
        {/* Grid overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ══════════════════ NAVBAR ══════════════════ */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(8,10,18,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 40px",
        }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: "linear-gradient(135deg, #00ff88 0%, #00c96e 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 15, color: "#080d18",
                boxShadow: "0 0 16px rgba(0,255,136,0.3)",
              }}>A</div>
              <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", color: "#f0f4fc" }}>
                Adulting<span style={{ color: "#00ff88" }}>.ai</span>
              </span>
            </div>

            {/* Nav links */}
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
              <a href="#features" style={{ fontSize: 14, color: "#8b9ab5", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#f0f4fc")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8b9ab5")}>Features</a>
              <a href="#how" style={{ fontSize: 14, color: "#8b9ab5", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#f0f4fc")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8b9ab5")}>How it works</a>
              <Link href="/login" style={{
                fontSize: 14, fontWeight: 600,
                background: "rgba(0,255,136,0.1)",
                border: "1px solid rgba(0,255,136,0.3)",
                color: "#00ff88", padding: "7px 20px", borderRadius: 8,
                textDecoration: "none", transition: "all 0.15s",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,255,136,0.18)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px rgba(0,255,136,0.2)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,255,136,0.1)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* ══════════════════ HERO ══════════════════ */}
        <section style={{ padding: "120px 40px 100px", textAlign: "center", maxWidth: 860, margin: "0 auto" }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)",
            borderRadius: 99, padding: "6px 16px", marginBottom: 32,
            fontSize: 12, fontWeight: 600, color: "#00ff88", letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 8px #00ff88", display: "inline-block" }} />
            AI-powered personal finance
          </div>

          <h1 style={{
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            margin: "0 0 24px",
            color: "#f0f4fc",
          }}>
            Your AI-Powered<br />
            <span style={{
              background: "linear-gradient(135deg, #00ff88 0%, #00c96e 50%, #fbbf24 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>Financial Copilot</span>
          </h1>

          <p style={{ fontSize: 19, color: "#8b9ab5", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 44px" }}>
            Stop guessing where your money goes. Adulting.ai tracks every rupee,
            spots patterns in your spending, and gives advice based on your actual numbers.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "linear-gradient(135deg, #00ff88, #00c96e)",
              color: "#080d18", fontWeight: 700, fontSize: 15,
              padding: "14px 32px", borderRadius: 10, textDecoration: "none",
              boxShadow: "0 4px 24px rgba(0,255,136,0.35)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,255,136,0.45)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,255,136,0.35)"; }}
            >
              Get Started Free →
            </Link>
            <a href="#how" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#b0bdd4", fontWeight: 600, fontSize: 15,
              padding: "14px 28px", borderRadius: 10, textDecoration: "none",
              transition: "all 0.15s",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "#f0f4fc"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.color = "#b0bdd4"; }}
            >
              See How It Works
            </a>
          </div>

          {/* Hero stat strip */}
          <div style={{ display: "flex", justifyContent: "center", gap: 48, marginTop: 72, flexWrap: "wrap" }}>
            {[
              { val: "₹0", label: "Cost to get started" },
              { val: "AI", label: "Powered insights" },
              { val: "100%", label: "Privacy focused" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 500, color: "#00ff88", letterSpacing: "-0.02em" }}>{s.val}</div>
                <div style={{ fontSize: 12, color: "#4d5e7a", marginTop: 4, letterSpacing: "0.04em", textTransform: "uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════ FEATURES ══════════════════ */}
        <section id="features" style={{ padding: "100px 40px", maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#00ff88", marginBottom: 12 }}>Features</p>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f0f4fc", margin: "0 0 16px" }}>
              Everything you need to<br />actually understand your money
            </h2>
            <p style={{ fontSize: 16, color: "#6b7fa0", maxWidth: 480, margin: "0 auto" }}>
              Built for people who are serious about taking control of their finances — not just tracking them.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: "rgba(14,20,36,0.8)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: 28,
                backdropFilter: "blur(8px)",
                transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
                cursor: "default",
              }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(0,255,136,0.2)";
                  el.style.transform = "translateY(-3px)";
                  el.style.boxShadow = "0 8px 32px rgba(0,255,136,0.08)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(255,255,255,0.06)";
                  el.style.transform = "";
                  el.style.boxShadow = "";
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f0f4fc", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "#6b7fa0", lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════ HOW IT WORKS ══════════════════ */}
        <section id="how" style={{ padding: "100px 40px", maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#fbbf24", marginBottom: 12 }}>How it works</p>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f0f4fc", margin: 0 }}>
              From zero to financial clarity<br />in three steps
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 32, alignItems: "flex-start", position: "relative" }}>
                {/* Line connector */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 600, color: "#00ff88",
                    flexShrink: 0,
                  }}>{step.n}</div>
                  {i < STEPS.length - 1 && (
                    <div style={{ width: 1, flex: 1, minHeight: 48, background: "linear-gradient(180deg, rgba(0,255,136,0.2) 0%, transparent 100%)", margin: "8px 0" }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < STEPS.length - 1 ? 40 : 0, paddingTop: 12, flex: 1 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#f0f4fc", marginBottom: 10 }}>{step.title}</h3>
                  <p style={{ fontSize: 14, color: "#6b7fa0", lineHeight: 1.8, margin: 0 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════ CTA ══════════════════ */}
        <section style={{ padding: "80px 40px 120px", maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            background: "rgba(14,20,36,0.9)",
            border: "1px solid rgba(0,255,136,0.15)",
            borderRadius: 24,
            padding: "56px 48px",
            boxShadow: "0 0 80px rgba(0,255,136,0.06), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}>
            <div style={{ fontSize: 40, marginBottom: 20 }}>💸</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", color: "#f0f4fc", margin: "0 0 16px" }}>
              Start adulting smarter today
            </h2>
            <p style={{ fontSize: 15, color: "#6b7fa0", marginBottom: 36, lineHeight: 1.7 }}>
              No credit card. No subscriptions. Just a seriously good AI that helps you understand and improve your finances.
            </p>
            <Link href="/login" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "linear-gradient(135deg, #00ff88, #00c96e)",
              color: "#080d18", fontWeight: 700, fontSize: 15,
              padding: "14px 36px", borderRadius: 10, textDecoration: "none",
              boxShadow: "0 4px 24px rgba(0,255,136,0.35)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,255,136,0.45)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,255,136,0.35)"; }}
            >
              Get Started Free →
            </Link>
          </div>
        </section>

        {/* ══════════════════ FOOTER ══════════════════ */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 40px" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 6,
                background: "linear-gradient(135deg, #00ff88, #00c96e)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 12, color: "#080d18",
              }}>A</div>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#8b9ab5" }}>
                Adulting<span style={{ color: "#00ff88" }}>.ai</span>
              </span>
            </div>
            <p style={{ fontSize: 12, color: "#3d5070", margin: 0 }}>
              © {new Date().getFullYear()} Adulting.ai · Built with ❤️ and too much caffeine
            </p>
            <div style={{ display: "flex", gap: 20 }}>
              {["Privacy", "Terms"].map((l) => (
                <a key={l} href="#" style={{ fontSize: 12, color: "#3d5070", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#6b7fa0")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#3d5070")}>{l}</a>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}