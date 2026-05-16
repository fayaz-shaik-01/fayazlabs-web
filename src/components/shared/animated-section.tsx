"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly delay?: number;
}

export function AnimatedSection({
  children,
  className,
  delay = 0,
}: AnimatedSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn("pt-32 pb-24 sm:pt-40 sm:pb-32", className)}
    >
      <div className="mx-auto max-w-6xl px-6">{children}</div>
    </motion.section>
  );
}
