"use client";

import { motion } from "framer-motion";
import { GraduationCap, Briefcase, Code, Brain, Award } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

const timeline = [
  {
    year: "2019–2023",
    title: "B.Tech at NIT Calicut",
    description:
      "Electrical and Electronics Engineering with GPA 8.55/10. Coursework in Data Structures, AI, and Digital Electronics. Secured 98.60 percentile in JEE Mains.",
    icon: GraduationCap,
  },
  {
    year: "2023–2025",
    title: "Associate Software Engineer (SDET) — Enphase Energy",
    description:
      "Built scalable automation frameworks for UI and API testing. Contributed to end-to-end API test suites validating 50+ REST endpoints across microservices. Reduced manual regression effort by 60%.",
    icon: Code,
  },
  {
    year: "2025–Present",
    title: "Software Engineer II (SDET) — Enphase Energy",
    description:
      "Led the development of an AI-powered UI test automation tool using LLM-based DOM intelligence. Leading in-sprint automation for a team of 5, increasing regression coverage significantly.",
    icon: Brain,
  },
  {
    year: "Ongoing",
    title: "AI Engineering & Independent Exploration",
    description:
      "Building browser agents, MCP experiments, agent orchestration systems, and evaluation frameworks. Exploring the intersection of AI and software engineering.",
    icon: Briefcase,
  },
];

const achievements = [
  "98.60 percentile in JEE Mains (1.2M+ candidates)",
  "All India Rank 61 in AP EAMCET 2019",
  "First prize at zonal level in SIMO Olympiad",
  "60% reduction in test script creation time with AI tool",
  "Led automation for team of 5 at Enphase Energy",
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 pt-32 pb-20 sm:pt-40 sm:pb-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <SectionHeader
          label="About"
          title="The Journey"
          description="From electrical engineering roots to building intelligent AI systems."
          align="left"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="mb-20 space-y-5"
      >
        <p className="text-body-lg text-foreground/85">
          I&apos;m Shaik Fayaz — a software engineer at Enphase Energy focused on the
          intersection of AI, automation, and quality engineering.
        </p>
        <p className="text-body-lg text-foreground/75">
          My journey started with electrical engineering at NIT Calicut, where I
          discovered my passion for software through DSA, AI coursework, and
          personal projects. After graduating, I joined Enphase Energy as an SDET,
          where I built scalable automation frameworks and eventually led the
          development of an AI-powered test automation tool.
        </p>
        <p className="text-body-lg text-foreground/75">
          Now, I&apos;m deepening my work in AI engineering — building browser agents,
          experimenting with agent orchestration, and exploring how LLMs can
          transform software development workflows. I write about what I learn and
          share architecture notes from my engineering notebook.
        </p>
      </motion.div>

      <div className="mb-20">
        <h2 className="text-heading-lg mb-8">Timeline</h2>
        <div className="relative space-y-10 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-primary/40 before:via-white/[0.06] before:to-white/[0.03]">
          {timeline.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="relative pl-14"
            >
              <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-[2px] bg-primary/[0.08] ring-1 ring-primary/10">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/70">
                {item.year}
              </span>
              <h3 className="text-[0.9375rem] font-semibold tracking-[-0.01em] mt-1">{item.title}</h3>
              <p className="text-body-sm text-muted-foreground mt-1.5">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mb-20">
        <h2 className="text-heading-lg mb-6">Achievements</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {achievements.map((achievement, i) => (
            <motion.div
              key={achievement}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-start gap-3 rounded-[2px] glass-card p-5"
            >
              <Award className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-body-sm text-muted-foreground">{achievement}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-heading-lg mb-5">Connect</h2>
        <div className="flex gap-3">
          <Link
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-[2px] bg-white/[0.03] border border-white/10 hover:bg-primary/[0.06] hover:border-primary/20 hover:text-primary transition-all duration-300"
          >
            <GithubIcon className="h-4 w-4" />
            GitHub
          </Link>
          <Link
            href={siteConfig.links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-[2px] bg-white/[0.03] border border-white/10 hover:bg-primary/[0.06] hover:border-primary/20 hover:text-primary transition-all duration-300"
          >
            <LinkedinIcon className="h-4 w-4" />
            LinkedIn
          </Link>
          <Link
            href={siteConfig.links.email}
            className="inline-flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-[2px] bg-white/[0.03] border border-white/10 hover:bg-primary/[0.06] hover:border-primary/20 hover:text-primary transition-all duration-300"
          >
            Email
          </Link>
        </div>
      </div>
    </div>
  );
}
