import { create } from "zustand";
import { AuthRequiredError, sendChatQuery } from "@/lib/api";
import type { ChatMessage, QueryType } from "@/lib/api";

/** What the assistant is doing. Drives Bolt's pose and the status label. */
export type OrbStatus = "idle" | "thinking" | "speaking";

interface ChatState {
  open: boolean;
  /** True while the 3D Bolt is on screen, so the chat launcher can leave it to Bolt's own pill. */
  boltActive: boolean;
  messages: ChatMessage[];
  status: OrbStatus;
  error: string | null;
  /** True when the last question was refused for lack of a sign-in; the panel shows a sign-in prompt. */
  authRequired: boolean;
  setAuthRequired: (v: boolean) => void;
  setOpen: (open: boolean) => void;
  setBoltActive: (on: boolean) => void;
  /** Send a question. Opens the panel so the answer is visible. */
  ask: (text: string, queryType?: QueryType) => Promise<void>;
  clear: () => void;
}

let speakTimer: ReturnType<typeof setTimeout> | undefined;

/** Roughly how long a reply takes to type out: quick for short answers, capped for long ones. */
export const revealDuration = (text: string) => Math.min(4500, Math.max(600, text.split(/\s+/).length * 28));

export const useChatStore = create<ChatState>((set, get) => ({
  open: false,
  boltActive: false,
  messages: [],
  status: "idle",
  error: null,
  authRequired: false,
  setAuthRequired: (authRequired) => set({ authRequired }),

  setOpen: (open) => set({ open }),
  setBoltActive: (boltActive) => set({ boltActive }),

  clear: () => {
    clearTimeout(speakTimer);
    set({ messages: [], error: null, status: "idle", authRequired: false });
  },

  ask: async (text, queryType = "CHAT") => {
    const query = text.trim();
    if (!query || get().status === "thinking") return;
    clearTimeout(speakTimer);

    const user: ChatMessage = { id: crypto.randomUUID(), role: "user", content: query, timestamp: Date.now() };
    set((s) => ({ open: true, error: null, authRequired: false, status: "thinking", messages: [...s.messages, user] }));

    try {
      const res = await sendChatQuery(query, queryType);
      const revealMs = revealDuration(res.answer);
      const reply: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.answer,
        sources: res.sources,
        metadata: res.metadata,
        timestamp: Date.now(),
        revealMs,
      };
      set((s) => ({ status: "speaking", messages: [...s.messages, reply] }));
      speakTimer = setTimeout(() => set({ status: "idle" }), revealMs);
    } catch (err) {
      if (err instanceof AuthRequiredError) {
        // Drop the unanswered question; the panel asks the visitor to sign in instead.
        set((s) => ({ status: "idle", authRequired: true, error: null, messages: s.messages.filter((m) => m.id !== user.id) }));
        return;
      }
      const reply: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I couldn’t answer that just now. Please try again in a moment.",
        timestamp: Date.now(),
      };
      set((s) => ({
        status: "idle",
        error: err instanceof Error ? err.message : "Something went wrong",
        messages: [...s.messages, reply],
      }));
    }
  },
}));
