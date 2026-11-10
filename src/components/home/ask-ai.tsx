"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { AiOrb } from "@/components/chat/ai-orb";
import { SUGGESTIONS } from "@/components/chat/chat-panel";
import { useChatStore } from "@/stores/chat-store";

/** Home-page showcase for the assistant: a live 3D orb, suggested questions and an input that opens the chat. */
export function AskAi() {
  const { ask, setOpen, status } = useChatStore();
  const [q, setQ] = useState("");

  const submit = (text: string, type?: (typeof SUGGESTIONS)[number]["queryType"]) => {
    const v = text.trim();
    if (!v) return setOpen(true);
    setQ("");
    void ask(v, type);
  };

  return (
    <section aria-labelledby="ask-ai-heading" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="panel relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_50%,var(--accent)_0%,transparent_62%)]" />
        <div className="relative grid items-center gap-2 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="p-6 sm:p-10">
            <p className="eyebrow">Fayaz Labs AI</p>
            <h2 id="ask-ai-heading" className="mt-3 text-display-lg text-foreground">
              Ask my AI anything about my work
            </h2>
            <p className="mt-4 max-w-[48ch] text-body-lg text-muted-foreground">
              It knows my projects, writing and course. Ask how something was built, what I would test first, or where to start.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(q);
              }}
              className="mt-7 flex items-center gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-sm transition-colors focus-within:border-primary/60"
            >
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Ask the AI"
                placeholder="What do you build?"
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                aria-label="Ask"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <ArrowUp className="size-5" />
              </button>
            </form>

            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Suggested questions">
              {SUGGESTIONS.map((s) => (
                <li key={s.label}>
                  <button
                    type="button"
                    onClick={() => submit(s.label, s.queryType)}
                    className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-primary/60 hover:text-primary"
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <AiOrb status={status} className="h-64 sm:h-80 lg:h-[26rem]" />
        </div>
      </div>
    </section>
  );
}
