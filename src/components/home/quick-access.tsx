"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, FolderGit2, Mail, PenLine } from "lucide-react";

const quickLinks = [
  {
    title: "Courses",
    description: "Start the AI Product Testing course, free to start",
    href: "/learning",
    icon: <BookOpen className="h-5 w-5" />,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Projects",
    description: "Things I have built: AI tooling, automation and backends",
    href: "/projects",
    icon: <FolderGit2 className="h-5 w-5" />,
    color: "text-lab-green",
    bgColor: "bg-lab-green/10",
  },
  {
    title: "Writing",
    description: "Articles and deep dives on AI engineering and testing",
    href: "/writing",
    icon: <PenLine className="h-5 w-5" />,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
  {
    title: "Contact",
    description: "Work together, ask a question, or just say hi",
    href: "/contact",
    icon: <Mail className="h-5 w-5" />,
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
              className="group flex flex-col rounded-xl border border-border bg-card p-5 h-full transition-all duration-300 hover:border-primary/50 hover:bg-muted"
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
