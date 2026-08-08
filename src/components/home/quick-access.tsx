"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Brain, FlaskConical, Search } from "lucide-react";

const quickLinks = [
  {
    title: "Learning Tracks",
    description: "Structured curriculum from math foundations to production AI",
    href: "/learning",
    icon: <BookOpen className="h-5 w-5" />,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Practice Problems",
    description: "MCQs, numericals, and short-answer problems with solutions",
    href: "/practice",
    icon: <FlaskConical className="h-5 w-5" />,
    color: "text-lab-green",
    bgColor: "bg-lab-green/10",
  },
  {
    title: "Flashcards",
    description: "Spaced repetition with Leitner system for exam prep",
    href: "/flashcards",
    icon: <Brain className="h-5 w-5" />,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
  {
    title: "Formula Index",
    description: "Quick-access formula reference with LaTeX rendering",
    href: "/formulas",
    icon: <Search className="h-5 w-5" />,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
];

export function QuickAccess() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link, i) => (
          <motion.div
            key={link.href}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
          >
            <Link
              href={link.href}
              className="group flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 h-full transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] hover:-translate-y-0.5"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${link.bgColor} ${link.color} mb-4`}>
                {link.icon}
              </span>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                {link.title}
              </h3>
              <p className="text-xs text-muted-foreground/60 line-clamp-2">
                {link.description}
              </p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
