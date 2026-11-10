"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, RotateCcw, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChatMessageBubble } from "@/components/chat/chat-message";
import { AiOrb, OrbCss } from "@/components/chat/ai-orb";
import { useChatStore, type OrbStatus } from "@/stores/chat-store";
import type { QueryType } from "@/lib/api";
import { cn } from "@/lib/utils";

export const SUGGESTIONS: { label: string; queryType: QueryType }[] = [
  { label: "What do you build?", queryType: "CHAT" },
  { label: "Tell me about your projects", queryType: "PROJECT_QUERY" },
  { label: "Explain your tech stack", queryType: "ARCHITECTURE_EXPLAIN" },
  { label: "How do you test AI products?", queryType: "CHAT" },
];

const STATUS_LABEL: Record<OrbStatus, string> = { idle: "Online", thinking: "Thinking", speaking: "Answering" };

/** The floating launcher: a small live orb plus a label. */
function Launcher() {
  const { open, setOpen, status } = useChatStore();
  if (open) return null;
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Open AI chat"
      data-testid="chat-launcher"
      className="fixed right-4 bottom-4 z-50 flex items-center gap-3 rounded-full border border-border bg-card py-2 pr-4 pl-2 shadow-float transition-[transform,border-color] hover:-translate-y-0.5 hover:border-primary/60 sm:right-6 sm:bottom-6 max-sm:pr-2"
    >
      <OrbCss status={status} className="size-9" />
      <span className="max-sm:hidden">
        <span className="block text-sm font-semibold leading-tight">Ask my AI</span>
        <span className="eyebrow block !text-[0.625rem]">{STATUS_LABEL[status]}</span>
      </span>
    </button>
  );
}

export function ChatPanel() {
  const { open, setOpen, messages, status, error, ask, clear } = useChatStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = status === "thinking";

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250);
  }, [open]);

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
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" showCloseButton className="flex w-full flex-col gap-0 border-border bg-background p-0 sm:max-w-[480px]">
          <SheetHeader className="relative h-[196px] shrink-0 gap-0 overflow-hidden border-b border-border p-0">
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,var(--accent)_0%,transparent_70%)]" />
            <AiOrb status={status} className="absolute inset-y-0 right-0 left-[24%]" />
            <div className="relative flex items-start justify-between p-4">
              <div>
                <SheetTitle className="font-heading text-lg font-bold">Fayaz Labs AI</SheetTitle>
                <SheetDescription data-testid="chat-status" data-status={status} className="eyebrow mt-0.5 flex items-center gap-1.5 !text-primary">
                  <span className={cn("size-1.5 rounded-full bg-primary", status !== "idle" && "animate-pulse")} />
                  {STATUS_LABEL[status]}
                </SheetDescription>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clear}
                aria-label="Clear chat"
                className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-card/90 px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="size-3" />
                New chat
              </button>
            )}
          </SheetHeader>

          <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-4 py-5" aria-live="polite">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-2 text-center">
                <p className="font-heading text-2xl font-bold">Ask me anything</p>
                <p className="mt-1.5 max-w-[30ch] text-base text-muted-foreground">
                  About my projects, tech stack, experience, or how to test AI products.
                </p>
                <div className="mt-6 grid w-full gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => send(s.label, s.queryType)}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-[0.9375rem] font-medium transition-colors hover:border-primary/60"
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
                <OrbCss status="thinking" className="size-6" />
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
            <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-1.5 transition-colors focus-within:border-primary/60">
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
                placeholder="Ask about my work…"
                aria-label="Message"
                rows={1}
                className="max-h-28 flex-1 resize-none bg-transparent px-3 py-2 text-base outline-none field-sizing-content placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={!input.trim() || busy}
                aria-label="Send message"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                <ArrowUp className="size-5" />
              </button>
            </div>
            <p className="eyebrow mt-2 text-center !text-[0.625rem]">Enter to send · Shift+Enter for a new line · Answers may be inaccurate</p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
