import type { Metadata } from "next";
import Link from "next/link";
import {
  Bot,
  Workflow,
  Globe,
  Plug,
  MessageSquare,
  Brain,
  Users,
  ArrowRight,
} from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";
import { SectionHeader } from "@/components/shared/section-header";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Services",
  description:
    "AI engineering, automation, and consulting services by Shaik Fayaz. Available for freelance and contract work.",
};

const services = [
  {
    title: "AI Agent Development",
    description:
      "Design and build custom AI agents that can reason, use tools, and take actions autonomously. From single-purpose bots to multi-agent orchestration systems.",
    icon: Bot,
    features: [
      "ReAct loop implementations",
      "Tool-augmented agents",
      "Multi-agent orchestration",
      "Custom reasoning chains",
    ],
  },
  {
    title: "Workflow Automation",
    description:
      "End-to-end automated pipelines that eliminate manual processes. From data processing to complex business logic with error handling and monitoring.",
    icon: Workflow,
    features: [
      "Business process automation",
      "Data pipeline orchestration",
      "Event-driven workflows",
      "Monitoring and alerting",
    ],
  },
  {
    title: "Browser Automation",
    description:
      "Intelligent web scraping, automated testing, and browser-based workflows using Playwright and Selenium with AI-powered resilience.",
    icon: Globe,
    features: [
      "AI-powered web scraping",
      "Test automation frameworks",
      "Browser-based RPA",
      "Dynamic page handling",
    ],
  },
  {
    title: "API Integrations",
    description:
      "Seamless connections between services, platforms, and APIs. Build middleware, adapters, and integration layers that scale.",
    icon: Plug,
    features: [
      "REST/GraphQL integrations",
      "Webhook systems",
      "Data synchronization",
      "API gateway design",
    ],
  },
  {
    title: "Internal Copilots",
    description:
      "AI assistants tailored to your team's workflows, documentation, and data. RAG-powered knowledge bases and conversational interfaces.",
    icon: MessageSquare,
    features: [
      "RAG implementations",
      "Custom knowledge bases",
      "Conversational interfaces",
      "Context-aware responses",
    ],
  },
  {
    title: "LLM Applications",
    description:
      "Production-ready applications powered by large language models. From prompt engineering to fine-tuning and deployment.",
    icon: Brain,
    features: [
      "Prompt engineering",
      "Structured output systems",
      "Evaluation frameworks",
      "Cost optimization",
    ],
  },
  {
    title: "Engineering Consulting",
    description:
      "Architecture reviews, technical strategy, and hands-on guidance. Help your team adopt AI/automation best practices.",
    icon: Users,
    features: [
      "Architecture review",
      "Technical strategy",
      "Team mentoring",
      "Best practices",
    ],
  },
];

export default function ServicesPage() {
  return (
    <AnimatedSection>
      <SectionHeader
        label="Services"
        title="How I Can Help"
        description="Available for freelance projects, consulting engagements, and technical partnerships. I bring AI engineering expertise to your team."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <div
            key={service.title}
            className="group rounded-[2px] glass-card p-7"
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-[2px] bg-primary/[0.08] text-primary mb-5 ring-1 ring-primary/10 group-hover:ring-primary/25 group-hover:bg-primary/[0.12] transition-all duration-500">
              <service.icon className="h-5 w-5" />
            </div>
            <h3 className="text-heading-md mb-2 group-hover:text-primary transition-colors">{service.title}</h3>
            <p className="text-body-sm text-muted-foreground mb-5">
              {service.description}
            </p>
            <ul className="space-y-2 pt-4 border-t border-white/[0.06]">
              {service.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2.5 text-body-sm text-muted-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="relative mt-20 rounded-[2px] glass-card p-8 sm:p-14 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent" />
        <div className="relative z-10">
          <h3 className="text-heading-xl mb-4">
            Ready to build something together?
          </h3>
          <p className="text-body-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            Let&apos;s discuss your project requirements. I&apos;m available for
            freelance engagements, consulting, and contract work.
          </p>
          <Link
            href="/contact"
            className={cn(
              buttonVariants({ size: "lg" }),
              "gap-2 rounded-[2px] bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-400"
            )}
          >
            Get In Touch
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </AnimatedSection>
  );
}
