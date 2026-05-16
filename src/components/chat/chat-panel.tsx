"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChatMessageBubble } from "@/components/chat/chat-message";
import { sendChatQuery } from "@/lib/api";
import type { ChatMessage, QueryType } from "@/lib/api";
import { MessageSquare, Send, Loader2, Sparkles, RotateCcw, AlertCircle, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  { label: "What do you build?", queryType: "CHAT" as QueryType },
  { label: "Tell me about your projects", queryType: "PROJECT_QUERY" as QueryType },
  { label: "Explain your tech stack", queryType: "ARCHITECTURE_EXPLAIN" as QueryType },
];

export function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const handleSend = useCallback(
    async (text?: string, queryType: QueryType = "CHAT") => {
      const query = (text ?? input).trim();
      if (!query || isLoading) return;

      setError(null);
      setInput("");

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: query,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await sendChatQuery(query, queryType);
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.answer,
          sources: response.sources,
          metadata: response.metadata,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I couldn\u2019t process that request. Please try again later.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleClear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-6 right-6 z-50 size-12 rounded-full border-primary/30 bg-surface-1/90 backdrop-blur-sm shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 hover:border-primary/50 transition-all duration-300"
            aria-label="Open AI chat"
          />
        }
      >
        <MessageSquare className="size-5 text-primary" />
      </SheetTrigger>

      <SheetContent
        side="right"
        showCloseButton
        className="w-full sm:w-[420px] sm:max-w-[420px] p-0 flex flex-col bg-surface-0/95 backdrop-blur-xl border-white/[0.06]"
      >
        {/* Header */}
        <SheetHeader className="p-4 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-[2px] border border-lab-green/30 bg-lab-green/10">
                <Sparkles className="size-4 text-lab-green" />
              </div>
              <div>
                <SheetTitle className="text-sm">Fayaz Labs AI</SheetTitle>
                <SheetDescription className="text-[11px] font-mono text-lab-green/70">
                  <span className="inline-block size-1.5 rounded-full bg-lab-green animate-glow-pulse mr-1" />{"ONLINE"}
                </SheetDescription>
              </div>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Clear chat"
              >
                <RotateCcw className="size-3" />
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="flex size-14 items-center justify-center rounded-full border border-white/[0.06] bg-surface-2 mb-4">
                <Sparkles className="size-6 text-primary/60" />
              </div>
              <p className="text-sm font-medium text-foreground/80 mb-1">
                Ask me anything
              </p>
              <p className="text-xs text-muted-foreground mb-6 max-w-[260px]">
                About my projects, tech stack, experience, or anything else
              </p>
              <div className="flex flex-col gap-2 w-full max-w-[280px]">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => handleSend(s.label, s.queryType)}
                    className="text-left rounded-[2px] border border-white/[0.06] bg-surface-1 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-white/10 hover:bg-surface-2 transition-all"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChatMessageBubble message={msg} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-[2px] border border-lab-green/30 bg-lab-green/10 text-lab-green">
                <Bot className="size-3.5" />
              </div>
              <div className="rounded-[2px] bg-surface-2 border border-white/[0.06] px-3.5 py-2.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Thinking...
                </div>
              </div>
            </motion.div>
          )}

          {error && !isLoading && (
            <div className="flex items-center gap-2 rounded-[2px] border border-lab-red/20 bg-lab-red/5 px-3 py-2 text-xs text-lab-red">
              <AlertCircle className="size-3 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about my work..."
              disabled={isLoading}
              rows={1}
              className={cn(
                "flex-1 resize-none field-sizing-content max-h-24 rounded-[2px] border border-white/[0.08] bg-surface-1 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-50",
              )}
            />
            <Button
              variant="default"
              size="icon"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="shrink-0 rounded-[2px] size-9"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] font-mono text-muted-foreground/40 text-center">
            Powered by RAG &middot; Responses may be inaccurate
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
