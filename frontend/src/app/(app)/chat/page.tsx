"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import { getUserId } from "@/lib/user";
import { Send, Sparkles } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Analyse my budget this month",
  "Help me save ₹10,000 in 3 months",
  "How much have I spent on food?",
  "Am I on track with my savings goal?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hi! I'm FinanceAI. I can see your transactions and financial profile — ask me anything specific to your money.",
  }]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userId = await getUserId();
    if (!userId) { router.push("/login"); return; }

    const userMsg: Message = { role: "user", content: input };
    const updated = [...messages, userMsg];
    setMessages(updated); setInput(""); setLoading(true);

    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "user-id": userId },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      setMessages([...updated, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([...updated, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header */}
      <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, background: "var(--bg-surface)" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, var(--accent), #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: 14 }}>F</div>
        <div>
          <p style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>FinanceAI</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Personalised to your financial data</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "user" ? (
              <div className="chat-bubble-user">{msg.content}</div>
            ) : (
              <div className="chat-bubble-ai">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div className="chat-bubble-ai" style={{ display: "flex", gap: 4, alignItems: "center", padding: "12px 16px" }}>
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips — only on first message */}
      {messages.length === 1 && (
        <div style={{ padding: "0 24px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s} onClick={() => setInput(s)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 12 }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", background: "var(--bg-surface)", display: "flex", gap: 10 }}>
        <div className="input-group" style={{ flex: 1 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder="Ask about your finances…"
            style={{ padding: "10px 14px" }}
          />
        </div>
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="btn btn-primary btn-icon"
          style={{ width: 40, height: 40 }}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}