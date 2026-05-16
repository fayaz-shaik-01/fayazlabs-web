"use client";

import { motion } from "framer-motion";
import { SectionHeader } from "@/components/shared/section-header";

const items = [
  {
    title: "Browser Agents",
    description: "AI-powered browser automation agents using Playwright and LLM reasoning",
    status: "active" as const,
  },
  {
    title: "MCP Experiments",
    description: "Exploring Model Context Protocol for tool-use and agent communication",
    status: "active" as const,
  },
  {
    title: "Eval Frameworks",
    description: "Building evaluation harnesses for LLM output quality and reliability",
    status: "exploring" as const,
  },
  {
    title: "Agent Orchestration",
    description: "Multi-agent coordination patterns using LangGraph and custom frameworks",
    status: "exploring" as const,
  },
];

const statusColors = {
  active: "bg-green-500",
  exploring: "bg-amber-500",
};

const statusLabels = {
  active: "Building",
  exploring: "Exploring",
};

export function CurrentlyBuilding() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="absolute inset-0 ambient-glow opacity-30" />
      <div className="mx-auto max-w-6xl px-6 relative">
        <SectionHeader
          label="Now"
          title="Currently Building"
          description="What I'm actively working on and exploring."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="group flex items-start gap-4 rounded-[2px] glass-card p-6"
            >
              <div className="mt-1 flex-shrink-0">
                <span className="relative flex h-3 w-3">
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full ${statusColors[item.status]} opacity-40`}
                  />
                  <span
                    className={`relative inline-flex h-3 w-3 rounded-full ${statusColors[item.status]}`}
                    style={{ boxShadow: `0 0 10px ${item.status === "active" ? "rgb(34 197 94 / 0.5)" : "rgb(245 158 11 / 0.5)"}` }}
                  />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h3 className="text-[0.9375rem] font-semibold tracking-[-0.01em] group-hover:text-foreground transition-colors">{item.title}</h3>
                  <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[2px] ${
                    item.status === "active"
                      ? "text-green-400 bg-green-500/10"
                      : "text-amber-400 bg-amber-500/10"
                  }`}>
                    {statusLabels[item.status]}
                  </span>
                </div>
                <p className="text-body-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
