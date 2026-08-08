import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      // Legacy notebook → learning
      { source: "/notebook", destination: "/learning", permanent: true },
      { source: "/notebook/:slug", destination: "/learning", permanent: true },
      // Legacy writing → learning (blog content absorbed into curriculum)
      { source: "/writing/agentic-ai-patterns", destination: "/learning/ai-agents/fundamentals/agentic-patterns", permanent: true },
      { source: "/writing/building-ai-test-automation", destination: "/learning/infrastructure/labs/ai-test-automation", permanent: true },
      // Legacy project routes → curriculum
      { source: "/projects/ai-test-automation", destination: "/learning/infrastructure/labs/ai-test-automation", permanent: true },
      // Legacy lesson slugs → new track-based URLs
      { source: "/learning/lesson/tokenization", destination: "/learning/llm-engineering/tokenization/tokenizers", permanent: true },
      { source: "/learning/lesson/attention-mechanism", destination: "/learning/llm-engineering/transformers/attention", permanent: true },
      { source: "/learning/lesson/rag-fundamentals", destination: "/learning/llm-engineering/rag/fundamentals", permanent: true },
      { source: "/learning/lesson/the-agent-loop", destination: "/learning/ai-agents/fundamentals/the-agent-loop", permanent: true },
      { source: "/learning/lesson/linear-algebra-intuition", destination: "/learning/ml-systems/foundations/linear-algebra-intuition", permanent: true },
      // Catch-all: any old /learning/lesson/:slug → /learning
      { source: "/learning/lesson/:slug", destination: "/learning", permanent: true },
      // Legacy phase routes → /learning
      { source: "/learning/phase/:id", destination: "/learning", permanent: true },
    ];
  },
};

export default nextConfig;
