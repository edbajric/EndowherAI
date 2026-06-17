"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import type { LIMEFactor } from "@/components/insights/AIInsightsPanel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface FloatingChatProps {
  /** LIME factors from the last AIInsightsPanel assessment — personalises the chat responses */
  limeContext?: LIMEFactor[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const DISCLAIMER =
  "EndoWherAI AI is for educational purposes only and does not provide medical advice, diagnoses, or treatment. Always consult a qualified healthcare professional.";

const SUGGESTIONS = [
  "What helps with pelvic pain?",
  "Best supplements for PCOS?",
  "Does anti-inflammatory diet work?",
  "How long is the diagnostic delay?",
];

const WELCOME: Message = {
  role: "assistant",
  content:
    "Hi! I'm your EndoWherAI research assistant. I have access to anonymised findings from our research cohort and can tell you which symptom patterns and remedies are most correlated with improvement. What would you like to know?",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function FloatingChat({ limeContext }: FloatingChatProps) {
  const supabase = createClient();
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  async function send(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    setInput("");
    setError(null);
    setMessages((m) => [...m, { role: "user", content: userText }]);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(`${API_URL}/api/v1/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message:      userText,
          lime_factors: limeContext ?? [],
        }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error((detail as any).detail ?? `Server error ${res.status}`);
      }

      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      setError(e.message);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "I'm having trouble connecting right now. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Floating trigger button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI chat" : "Open AI research assistant"}
        className={[
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center",
          "rounded-full shadow-xl ring-2 ring-white/30 transition-all hover:scale-105 active:scale-95",
          open ? "bg-inkStrong" : "bg-primary",
        ].join(" ")}
      >
        {open ? (
          /* X icon */
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        ) : (
          /* Chat bubble icon */
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
            <path
              d="M8 10h8M8 14h5M3 12c0 4.97 4.03 9 9 9 1.65 0 3.2-.45 4.52-1.24L21 21l-1.76-4.48A8.96 8.96 0 0 0 21 12 9 9 0 1 0 3 12z"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* ── Chat window ── */}
      {open && (
        <div
          role="dialog"
          aria-label="EndoWherAI research assistant"
          className={[
            "fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-50",
            "flex flex-col",
            "w-[calc(100vw-2rem)] max-w-sm",
            "h-[min(520px,80dvh)]",
            "rounded-3xl bg-bg shadow-2xl ring-1 ring-ink/10 overflow-hidden",
          ].join(" ")}
        >
          {/* Header */}
          <div className="shrink-0 bg-primary px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-white text-lg">🔬</span>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">EndoWherAI Assistant</p>
                <p className="text-xs text-white/70">Research-grounded · Not medical advice</p>
              </div>
            </div>
          </div>

          {/* Hardcoded disclaimer — always visible */}
          <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-3 py-2">
            <p className="text-xs text-amber-800 leading-4">
              ⚕️ <strong>Disclaimer:</strong> {DISCLAIMER}
            </p>
          </div>

          {/* LIME context badge (when available) */}
          {limeContext && limeContext.length > 0 && (
            <div className="shrink-0 bg-bgSoft border-b border-ink/5 px-3 py-2">
              <p className="text-xs text-inkMuted">
                ✨ Personalised using your last risk assessment ({limeContext.length} factor{limeContext.length !== 1 ? "s" : ""} loaded)
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={[
                    "max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-6 whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-primary text-white"
                      : "bg-bgSoft text-inkStrong ring-1 ring-ink/10",
                  ].join(" ")}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-bgSoft px-4 py-2.5 ring-1 ring-ink/10">
                  <span className="flex gap-1 items-center text-xs text-inkMuted">
                    <span className="animate-bounce [animation-delay:0ms]">·</span>
                    <span className="animate-bounce [animation-delay:150ms]">·</span>
                    <span className="animate-bounce [animation-delay:300ms]">·</span>
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggestion chips — only on fresh chat */}
          {messages.length === 1 && (
            <div className="shrink-0 px-3 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="shrink-0 rounded-full bg-bgSoft px-3 py-1.5 text-xs font-medium text-inkStrong ring-1 ring-ink/10 hover:bg-bgMuted transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div className="shrink-0 border-t border-ink/10 px-3 py-3">
            {error && (
              <p className="mb-2 text-xs text-red-500">{error}</p>
            )}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                className="flex-1 rounded-full bg-bgSoft px-4 py-2 text-sm ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-accent2"
                placeholder="Ask about PCOS, endo, remedies…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                disabled={loading}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
