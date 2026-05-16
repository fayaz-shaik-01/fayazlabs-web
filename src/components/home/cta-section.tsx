"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, Code } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 mesh-gradient opacity-40" />
      <div className="mx-auto max-w-6xl px-6 relative">
        <div className="grid gap-6 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="group relative rounded-[2px] glass-card p-8 sm:p-10 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent" />
            <div className="relative z-10">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-[2px] bg-primary/[0.08] text-primary mb-5 ring-1 ring-primary/15 group-hover:ring-primary/30 transition-all duration-500">
                <Briefcase className="h-5 w-5" />
              </div>
              <h3 className="text-heading-lg mb-3">
                Looking for AI Engineering Talent?
              </h3>
              <p className="text-body-sm text-muted-foreground mb-7">
                I&apos;m open to remote AI engineering, backend engineering, and
                SDET roles. Let&apos;s build something impactful together.
              </p>
              <Link
                href="/contact"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "gap-2 rounded-[2px] bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-400"
                )}
              >
                Get In Touch
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="group relative rounded-[2px] glass-card p-8 sm:p-10 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-glow-accent/[0.03] via-transparent to-transparent" />
            <div className="relative z-10">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-[2px] bg-accent/[0.08] text-accent mb-5 ring-1 ring-accent/15 group-hover:ring-accent/30 transition-all duration-500">
                <Code className="h-5 w-5" />
              </div>
              <h3 className="text-heading-lg mb-3">
                Need AI/Automation Consulting?
              </h3>
              <p className="text-body-sm text-muted-foreground mb-7">
                I help teams build AI agents, automate workflows, and integrate LLM
                capabilities into existing products.
              </p>
              <Link
                href="/services"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "gap-2 rounded-[2px] border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all duration-400"
                )}
              >
                View Services
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
