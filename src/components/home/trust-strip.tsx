"use client";

import { motion } from "framer-motion";

const technologies = [
  "Python", "Java", "Spring Boot", "FastAPI", "LangGraph",
  "Playwright", "OpenAI", "AWS", "Docker",
];

const technologies2 = [
  "PostgreSQL", "Redis", "Selenium", "MongoDB", "React",
  "Next.js", "TypeScript", "LangChain",
];

export function TrustStrip() {
  return (
    <div className="relative py-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-surface-1/50 via-transparent to-transparent" />
      <p className="relative text-center text-[11px] font-medium text-muted-foreground mb-6 tracking-[0.2em] uppercase">
        Technologies I work with
      </p>
      <div className="flex flex-col gap-3">
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
          <motion.div
            className="flex gap-3 w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          >
            {[...technologies, ...technologies].map((tech, i) => (
              <span
                key={`${tech}-${i}`}
                className="whitespace-nowrap rounded-[2px] border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[13px] font-mono font-medium text-foreground/60 hover:text-lab-green hover:border-lab-green/20 hover:bg-lab-green/[0.04] transition-all duration-300"
              >
                {tech}
              </span>
            ))}
          </motion.div>
        </div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
          <motion.div
            className="flex gap-3 w-max"
            animate={{ x: ["-50%", "0%"] }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          >
            {[...technologies2, ...technologies2].map((tech, i) => (
              <span
                key={`${tech}-${i}`}
                className="whitespace-nowrap rounded-[2px] border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[13px] font-mono font-medium text-foreground/60 hover:text-lab-green hover:border-lab-green/20 hover:bg-lab-green/[0.04] transition-all duration-300"
              >
                {tech}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
