import type { Metadata } from "next";
import { TaxChatClient } from "@/components/tax/tax-chat-client";

export const metadata: Metadata = { title: "AI Advisor — Tax Intelligence" };

export default function ChatPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold font-heading">AI Tax Advisor</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ask anything about your taxes, deductions, or financial profile
        </p>
      </div>
      <TaxChatClient />
    </div>
  );
}
