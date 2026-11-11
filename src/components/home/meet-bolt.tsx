"use client";

import { Bot } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useChatStore } from "@/stores/chat-store";
import { cn } from "@/lib/utils";

/** Hero button that opens the chat with Bolt. */
export function MeetBolt() {
  const setOpen = useChatStore((s) => s.setOpen);
  return (
    <button type="button" onClick={() => setOpen(true)} className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
      <Bot className="size-4" />
      Meet Bolt
    </button>
  );
}
