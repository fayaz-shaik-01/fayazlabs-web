"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  User,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { sendLessonMentorQuery } from "@/lib/api";
import type { ChatMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

interface LessonMentorProps {
  readonly lessonTitle: string;
  readonly lessonSlug: string;
  readonly phase: number;
  readonly phaseTitle: string;
  readonly tags: string[];
  readonly hasAuthoredContent: boolean;
}

const MAX_MESSAGES = 20;

function buildContextPrefix(props: LessonMentorProps): string {
  return `[Context: Lesson "${props.lessonTitle}" in phase "${props.phaseTitle}". Topics: ${props.tags.join(", ")}]\n\n`;
}

export function LessonMentor({
  lessonTitle,
  lessonSlug,
  phase,
  phaseTitle,
  tags,
  hasAuthoredContent,
}: LessonMentorProps) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    if (expanded && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [expanded]);

  const suggestions = [
    `Explain ${lessonTitle} in simple terms`,
    `What are the key takeaways?`,
    `How does this connect to real-world AI systems?`,
  ];

  const handleSend = useCallback(
    async (text?: string) => {
      const raw = (text ?? input).trim();
      if (!raw || isLoading) return;
      if (messages.length >= MAX_MESSAGES) return;

      setInput("");

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: raw,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await sendLessonMentorQuery(raw, {
          lesson_slug: lessonSlug,
          phase,
          tags,
          has_authored_content: hasAuthoredContent,
        });
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.answer,
          sources: response.sources,
          metadata: response.metadata,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Sorry, the AI Mentor is temporarily unavailable. Please try again later.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages.length, lessonTitle, lessonSlug, phase, phaseTitle, tags, hasAuthoredContent],
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
  }, []);

  return (
    <section
      className="mt-16 rounded-xl border border-primary/20 bg-primary/[0.02] overflow-hidden"
      data-premium="lesson-mentor"
    >
      {/* Collapsed header / toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-primary/[0.04]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              AI Mentor
            </h3>
            <p className="text-xs text-muted-foreground/60">
              Ask questions about this lesson
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground/50" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground/50" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-primary/10">
              {/* Messages */}
              <div
                ref={scrollRef}
                className="max-h-80 overflow-y-auto px-5 py-4 space-y-3 scroll-smooth"
              >
                {messages.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground/50 mb-3">
                      Try asking:
                    </p>
                    <div className="flex flex-col gap-1.5 max-w-sm mx-auto">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSend(s)}
                          className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-muted-foreground/70 hover:text-foreground hover:border-white/[0.12] transition-colors text-left"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-2.5",
                          msg.role === "user" && "flex-row-reverse",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[10px]",
                            msg.role === "user"
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-lab-green/30 bg-lab-green/10 text-lab-green",
                          )}
                        >
                          {msg.role === "user" ? (
                            <User className="h-3 w-3" />
                          ) : (
                            <Bot className="h-3 w-3" />
                          )}
                        </div>
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2 text-xs leading-relaxed max-w-[85%]",
                            msg.role === "user"
                              ? "bg-primary/10 border border-primary/20 text-foreground"
                              : "bg-white/[0.03] border border-white/[0.06] text-foreground/90",
                          )}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex gap-2.5">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-lab-green/30 bg-lab-green/10 text-lab-green">
                          <Bot className="h-3 w-3" />
                        </div>
                        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Thinking...
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-primary/10 px-5 py-3">
                <div className="flex gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask about ${lessonTitle}...`}
                    disabled={isLoading || messages.length >= MAX_MESSAGES}
                    rows={1}
                    className="flex-1 resize-none field-sizing-content max-h-20 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-50"
                  />
                  <div className="flex items-end gap-1.5">
                    {messages.length > 0 && (
                      <button
                        onClick={handleClear}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground transition-colors"
                        aria-label="Clear chat"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isLoading}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 transition-colors hover:bg-primary/90"
                      aria-label="Send message"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                {messages.length >= MAX_MESSAGES && (
                  <p className="mt-1.5 text-[10px] text-muted-foreground/40 text-center">
                    Message limit reached. Clear chat to continue.
                  </p>
                )}
                <p className="mt-1.5 text-[10px] font-mono text-muted-foreground/30 text-center">
                  AI Mentor &middot; Responses may be approximate
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
