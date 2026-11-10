"use client";

import { Fragment, useEffect, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/api";

// Replies that have already typed out; remounting (reopening the panel) shows them in full.
const revealed = new Set<string>();

/** **bold**, `code`, [text](/path) and bare links, as React elements (never raw HTML). */
function inline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\((?:https?:\/\/|\/)[^)\s]+\)|https?:\/\/[^\s)]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = m.index;
    if (tok.startsWith("**")) out.push(<strong key={key} className="font-semibold text-foreground">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) out.push(<code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{tok.slice(1, -1)}</code>);
    else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok);
      const href = link ? link[2] : tok;
      out.push(
        <a key={key} href={href} target={href.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-2">
          {link ? link[1] : tok}
        </a>
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Paragraphs and bullet/numbered lists. */
function Rich({ text }: Readonly<{ text: string }>) {
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <div className="space-y-2.5">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const bullets = lines.every((l) => /^\s*[-*•]\s+/.test(l));
        const numbered = lines.every((l) => /^\s*\d+[.)]\s+/.test(l));
        if (bullets || numbered) {
          const Tag = numbered ? "ol" : "ul";
          return (
            <Tag key={i} className={cn("space-y-1 pl-5", numbered ? "list-decimal" : "list-disc")}>
              {lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, ""))}</li>)}
            </Tag>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l)}</Fragment>)}
          </p>
        );
      })}
    </div>
  );
}

/** Reveals `text` word by word over `ms`, then settles on the full text. */
function useTyped(text: string, ms: number, enabled: boolean): { shown: string; done: boolean } {
  const [shown, setShown] = useState(enabled ? "" : text);
  const [done, setDone] = useState(!enabled);
  useEffect(() => {
    if (!enabled) {
      setShown(text);
      setDone(true);
      return;
    }
    setDone(false);
    const words = text.split(/(\s+)/);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const f = Math.min(1, (now - start) / ms);
      setShown(words.slice(0, Math.ceil(words.length * f)).join(""));
      if (f < 1) raf = requestAnimationFrame(tick);
      else setDone(true);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, ms, enabled]);
  return { shown, done };
}

export function ChatMessageBubble({ message }: Readonly<{ message: ChatMessage }>) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animate = !isUser && !!message.revealMs && !reduce && !revealed.has(message.id);
  const { shown: text, done } = useTyped(message.content, message.revealMs ?? 0, animate);
  useEffect(() => {
    if (animate) {
      const t = setTimeout(() => revealed.add(message.id), message.revealMs);
      return () => clearTimeout(t);
    }
  }, [animate, message.id, message.revealMs]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard unavailable
    }
  };

  const sources = (message.sources ?? []).filter((s) => s.slug);

  if (isUser) {
    return (
      <div className="flex justify-end">
        <p data-testid="chat-user-message" className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[0.9375rem] leading-relaxed text-primary-foreground">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className="group flex gap-3" data-testid="chat-assistant-message">
      <span aria-hidden="true" className="orb-css mt-1 size-6 shrink-0 !animate-none" />
      <div className="min-w-0 flex-1">
        <div className="text-[0.9375rem] leading-relaxed text-foreground">
          <Rich text={text || " "} />
        </div>

        {sources.length > 0 && done && (
          <ul className="mt-3 grid gap-1.5" aria-label="Sources">
            {sources.map((s) => (
              <li key={s.slug}>
                <a
                  href={s.slug.startsWith("/") ? s.slug : `/${s.slug}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:border-primary/50"
                >
                  <span className="min-w-0">
                    <span className="eyebrow block">{s.sourceType || "Source"}</span>
                    <span className="block truncate font-semibold">{s.title}</span>
                  </span>
                  <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={copy}
            aria-label="Copy answer"
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          {message.metadata && (
            <span className="eyebrow tabular-nums">{message.metadata.model} · {message.metadata.latencyMs} ms</span>
          )}
        </div>
      </div>
    </div>
  );
}
