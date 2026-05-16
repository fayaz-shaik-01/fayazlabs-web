"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bot,
  Workflow,
  Globe,
  Plug,
  MessageSquare,
  Brain,
  Users,
} from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const services = [
  {
    title: "AI Agents",
    description: "Custom AI agents for task automation and decision-making",
    icon: Bot,
  },
  {
    title: "Workflow Automation",
    description: "End-to-end automated pipelines for repetitive processes",
    icon: Workflow,
  },
  {
    title: "Browser Automation",
    description: "Intelligent web scraping, testing, and browser-based workflows",
    icon: Globe,
  },
  {
    title: "API Integrations",
    description: "Seamless connections between services and platforms",
    icon: Plug,
  },
  {
    title: "Internal Copilots",
    description: "AI assistants tailored to your team's workflows and data",
    icon: MessageSquare,
  },
  {
    title: "LLM Applications",
    description: "Production-ready applications powered by large language models",
    icon: Brain,
  },
  {
    title: "Engineering Consulting",
    description: "Architecture reviews, technical strategy, and team guidance",
    icon: Users,
  },
];

export function ServicesPreview() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-1/30 to-transparent" />
      <div className="mx-auto max-w-6xl px-6 relative">
        <SectionHeader
          label="Services"
          title="How I Can Help"
          description="Available for freelance projects, consulting engagements, and technical partnerships."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="group rounded-[2px] glass-card p-6"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-[2px] bg-primary/[0.08] text-primary mb-4 ring-1 ring-primary/10 group-hover:ring-primary/25 group-hover:bg-primary/[0.12] transition-all duration-500">
                <service.icon className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-[0.9375rem] font-semibold mb-2 tracking-[-0.01em] group-hover:text-primary transition-colors duration-300">{service.title}</h3>
              <p className="text-body-sm text-muted-foreground">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Link
            href="/services"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "rounded-[2px] border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all duration-400"
            )}
          >
            View All Services
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
