"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/api";
import { Bot, User, ExternalLink } from "lucide-react";

export function ChatMessageBubble({ message }: Readonly<{ message: ChatMessage }>) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-[2px] border text-xs",
          isUser
            ? "border-primary/30 bg-primary/10 text-primary"
            : "border-lab-green/30 bg-lab-green/10 text-lab-green",
        )}
      >
        {isUser ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
      </div>

      <div className={cn("flex flex-col gap-1.5 max-w-[85%]", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-[2px] px-3.5 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-primary/10 border border-primary/20 text-foreground"
              : "bg-surface-2 border border-white/[0.06] text-foreground/90",
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {message.sources.filter((s) => s.slug).map((source) => (
              <a
                key={source.slug}
                href={source.slug.startsWith("/") ? source.slug : `/${source.slug}`}
                className="inline-flex items-center gap-1 rounded-[2px] border border-white/[0.06] bg-surface-1 px-2 py-0.5 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:border-white/10 transition-colors"
              >
                <ExternalLink className="size-2.5" />
                {source.title}
              </a>
            ))}
          </div>
        )}

        {message.metadata && (
          <span className="text-[10px] font-mono text-muted-foreground/60 tabular-nums">
            {message.metadata.model} &middot; {message.metadata.latencyMs}ms
          </span>
        )}
      </div>
    </div>
  );
}
