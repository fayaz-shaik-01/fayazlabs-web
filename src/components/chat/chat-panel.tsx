"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp, RotateCcw, Sparkles, X } from "lucide-react";
import { ChatMessageBubble } from "@/components/chat/chat-message";
import { BoltFace } from "@/components/chat/bolt-face";
import { useChatStore, type OrbStatus } from "@/stores/chat-store";
import type { QueryType } from "@/lib/api";
import { cn } from "@/lib/utils";

export const SUGGESTIONS: { label: string; queryType: QueryType }[] = [
  { label: "What do you build?", queryType: "CHAT" },
  { label: "Tell me about your projects", queryType: "PROJECT_QUERY" },
  { label: "Explain your tech stack", queryType: "ARCHITECTURE_EXPLAIN" },
  { label: "How do you test AI products?", queryType: "CHAT" },
];

/** Extra questions that fit the page the visitor is on. */
function contextual(pathname: string): { label: string; queryType: QueryType }[] {
  if (pathname.startsWith("/learning")) return [{ label: "Where should I start the course?", queryType: "CHAT" }];
  if (pathname.startsWith("/projects")) return [{ label: "Which project should I read first?", queryType: "PROJECT_QUERY" }];
  return [];
}

const STATUS_LABEL: Record<OrbStatus, string> = { idle: "Online", thinking: "Thinking", speaking: "Answering" };

/** Launcher for when the 3D Bolt is not on screen (phones, reduced motion, no WebGL, or pages where he stays out). */
function Launcher() {
  const { open, setOpen, status, boltActive } = useChatStore();
  if (open || boltActive) return null;
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Open AI chat"
      data-testid="chat-launcher"
      data-bolt-ignore
      className="panel fixed right-4 bottom-4 z-50 flex items-center gap-3 rounded-full py-2 pr-4 pl-2 shadow-float transition-[transform,border-color] hover:-translate-y-0.5 hover:border-primary sm:right-6 sm:bottom-6 max-sm:pr-2"
    >
      <BoltFace status={status} className="size-9" />
      <span className="max-sm:hidden">
        <span className="block text-sm font-semibold leading-tight">Ask Bolt</span>
        <span className="eyebrow block !text-[0.625rem]">{STATUS_LABEL[status]}</span>
      </span>
    </button>
  );
}

export function ChatPanel() {
  const { open, setOpen, messages, status, error, ask, clear, boltActive } = useChatStore();
  const pathname = usePathname();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = status === "thinking";
  const suggestions = [...contextual(pathname), ...SUGGESTIONS];

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    // Escape closes the chat from anywhere, even before focus has moved into the panel.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  const send = useCallback(
    (text?: string, type: QueryType = "CHAT") => {
      const q = (text ?? input).trim();
      if (!q || busy) return;
      setInput("");
      void ask(q, type);
    },
    [input, busy, ask]
  );

  return (
    <>
      <Launcher />
      {open && (
        <section
          role="dialog"
          aria-label="Chat with Bolt"
          aria-modal="false"
          data-bolt-ignore
          className={cn(
            "panel bracket fixed z-50 flex flex-col overflow-hidden shadow-float animate-in fade-in slide-in-from-bottom-4 duration-300",
            "right-4 bottom-4 w-[min(24rem,calc(100vw-2rem))] sm:right-6 sm:bottom-6",
            "max-sm:inset-x-2 max-sm:bottom-2 max-sm:h-[78dvh] max-sm:w-auto",
            boltActive ? "h-[min(29rem,calc(100dvh-20.5rem))] min-h-[21rem]" : "h-[min(36rem,calc(100dvh-6rem))]"
          )}
        >
          <header className="flex items-center gap-3 border-b border-border px-4 py-3">
            <BoltFace status={status} className="size-9 shrink-0" />
            <div className="min-w-0 flex-1 leading-tight">
              <h2 className="font-heading text-[1.0625rem] font-semibold">Bolt</h2>
              <p data-testid="chat-status" data-status={status} className="eyebrow mt-0.5 flex items-center gap-1.5 !text-[0.625rem] !text-[var(--good)]">
                <span className={cn("size-1.5 rounded-full bg-[var(--good)]", status !== "idle" && "animate-pulse")} />
                {STATUS_LABEL[status]} · Fayaz Labs AI
              </p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clear}
                aria-label="Clear chat"
                className="inline-flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                <RotateCcw className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="inline-flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col justify-center">
                <p className="font-heading text-xl font-semibold">Hi, I&apos;m Bolt.</p>
                <p className="mt-1 text-[0.9375rem] text-muted-foreground">
                  I&apos;m the Fayaz Labs assistant. Ask about the projects, the tech stack, or how to test AI products.
                </p>
                <div className="mt-4 grid gap-2">
                  {suggestions.slice(0, 4).map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => send(s.label, s.queryType)}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5 text-left text-[0.9375rem] font-medium transition-colors hover:border-primary"
                    >
                      {s.label}
                      <Sparkles className="size-4 shrink-0 text-primary" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => <ChatMessageBubble key={m.id} message={m} />)
            )}

            {busy && (
              <div className="flex items-center gap-3" data-testid="chat-thinking">
                <BoltFace status="thinking" className="size-6" />
                <span className="flex items-center gap-1" aria-label="Thinking">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="size-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
              </div>
            )}
            {error && !busy && <p role="status" className="note !text-xs">{error}</p>}
          </div>

          <div className="shrink-0 border-t border-border p-3">
            <div className="flex items-end gap-2 rounded-lg border border-border bg-card p-1.5 transition-colors focus-within:border-primary">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask Bolt…"
                aria-label="Message"
                rows={1}
                className="max-h-28 flex-1 resize-none bg-transparent px-2.5 py-2 text-base outline-none field-sizing-content placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={!input.trim() || busy}
                aria-label="Send message"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                <ArrowUp className="size-5" />
              </button>
            </div>
            <p className="eyebrow mt-2 text-center !text-[0.625rem]">Enter to send · Answers may be inaccurate</p>
          </div>
        </section>
      )}
    </>
  );
}
