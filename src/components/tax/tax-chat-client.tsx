"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Which tax regime is better for me?",
  "How can I maximise Section 80C deductions?",
  "What is my effective tax rate?",
  "Explain my TDS deductions",
];

export function TaxChatClient() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId;
    const res = await fetch("/api/tax/chat/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taxYear: "2024-25", title: "Tax Query" }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error?.message ?? "Failed to create session");
    const id = data.data.id as string;
    setSessionId(id);
    return id;
  }

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return;
    setError(null);
    setInput("");
    setLoading(true);

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const sid = await ensureSession();
      const res = await fetch(`/api/tax/chat/sessions/${sid}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message ?? "Failed to send message");

      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.data.content as string,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 rounded-[2px] border border-border overflow-hidden min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center py-12">
            <div className="text-4xl">🤖</div>
            <div className="space-y-1">
              <p className="font-semibold font-heading">Ask your Tax Advisor</p>
              <p className="text-sm text-muted-foreground">
                Get personalised answers grounded in your actual financial data
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-[2px] px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-[2px] px-4 py-2.5 text-sm text-muted-foreground">
              Thinking…
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive text-center">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
          placeholder="Ask about your taxes…"
          disabled={loading}
          className="flex-1 rounded-[2px] border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="rounded-[2px] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
