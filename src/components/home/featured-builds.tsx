"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";

const deployments = [
  {
    title: "AI-Powered Test Automation Tool",
    description:
      "Intelligent test automation assistant that converts natural language test cases into executable Selenium/Playwright scripts using LLM-driven DOM analysis.",
    status: "VERIFIED",
    domain: "AI_TESTING",
    tests: "142/142 PASSED",
    coverage: "96.8%",
    stack: ["Python", "Selenium", "AWS Bedrock", "Streamlit", "LLM"],
    href: "/projects/ai-test-automation",
  },
  {
    title: "RAG Knowledge Assistant",
    description:
      "Retrieval-augmented generation system for intelligent document search and question answering across engineering documentation.",
    status: "VERIFIED",
    domain: "NLP_RETRIEVAL",
    tests: "248/248 PASSED",
    coverage: "98.4%",
    stack: ["Python", "LangChain", "OpenAI", "Pinecone", "FastAPI"],
    href: "/projects",
  },
  {
    title: "Resume Screening Agent",
    description:
      "AI agent that analyzes resumes against job descriptions using structured LLM evaluation with scoring rubrics.",
    status: "VERIFIED",
    domain: "AGENT_SYSTEMS",
    tests: "86/86 PASSED",
    coverage: "94.2%",
    stack: ["Python", "OpenAI", "FastAPI", "React"],
    href: "/projects",
  },
  {
    title: "LLM Workflow Automation Platform",
    description:
      "End-to-end platform for building, testing, and deploying LLM-powered automation workflows with visual pipeline editor.",
    status: "VERIFIED",
    domain: "ORCHESTRATION",
    tests: "192/192 PASSED",
    coverage: "97.1%",
    stack: ["TypeScript", "Next.js", "LangGraph", "PostgreSQL"],
    href: "/projects",
  },
];

export function FeaturedBuilds() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 ambient-glow opacity-50" />
      <div className="mx-auto max-w-6xl px-6 relative">
        <SectionHeader
          label="System Deployments"
          title="Active Deployment Registry"
          description="Production-grade systems verified through automated testing and continuous integration."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          {deployments.map((d, i) => (
            <motion.div
              key={d.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={d.href}
                className="group relative flex flex-col h-full hw-module p-6"
              >
                {/* Status & domain tags */}
                <div className="flex items-center justify-between mb-4">
                  <span className="mono-tag text-lab-green text-[10px]">[Status: {d.status}]</span>
                  <span className="mono-tag text-lab-amber text-[10px]">[Domain: {d.domain}]</span>
                </div>

                {/* Title — terminal prompt style */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-heading-md group-hover:text-lab-green transition-colors duration-300">
                    <span className="text-lab-green/60 font-mono mr-1.5 text-sm">&gt;</span>
                    {d.title}
                  </h3>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-y-1 translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 group-hover:text-lab-green flex-shrink-0 mt-0.5" />
                </div>

                {/* Description */}
                <p className="text-body-sm text-muted-foreground mb-5 flex-1">
                  {d.description}
                </p>

                {/* Test & coverage readout */}
                <div className="hw-module !bg-surface-0 px-3 py-2 mb-4 flex items-center justify-between">
                  <span className="mono-tag text-lab-green text-[10px]">[Tests: {d.tests}]</span>
                  <span className="mono-tag text-foreground/50 text-[10px]">[Coverage: {d.coverage}]</span>
                </div>

                {/* Tech stack — raw mono */}
                <div className="text-code-sm text-muted-foreground">
                  Tech: {d.stack.join(" / ")}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
