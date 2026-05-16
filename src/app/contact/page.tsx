"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Briefcase, Code, Send } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { SectionHeader } from "@/components/shared/section-header";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const body = "Hi Fayaz,\n\nName: " + formData.name + "\nEmail: " + formData.email + "\n\n" + formData.message;
    const subject = formData.subject || "Contact from Website";
    const mailtoUrl = "mailto:" + siteConfig.author.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    window.open(mailtoUrl, "_blank");
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-4xl px-6 pt-32 pb-20 sm:pt-40 sm:pb-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <SectionHeader
          label="Contact"
          title="Let's Connect"
          description="Open to conversations about AI engineering roles, consulting projects, or interesting collaboration opportunities."
          align="left"
        />
      </motion.div>

      <div className="grid gap-5 sm:grid-cols-2 mb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="group relative rounded-[2px] glass-card p-8 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent" />
          <div className="relative z-10">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-[2px] bg-primary/[0.08] text-primary mb-5 ring-1 ring-primary/10 group-hover:ring-primary/25 transition-all duration-500">
              <Briefcase className="h-5 w-5" />
            </div>
            <h3 className="text-heading-md mb-3">
              Looking to Hire
            </h3>
            <p className="text-body-sm text-muted-foreground mb-5">
              I&apos;m open to remote AI engineering, backend engineering, and SDET
              opportunities. I bring experience in LLM-powered automation, API
              testing, and backend systems.
            </p>
            <Link
              href={`mailto:${siteConfig.author.email}?subject=Job Opportunity`}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Mail className="h-4 w-4" />
              {siteConfig.author.email}
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="group relative rounded-[2px] glass-card p-8 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-glow-accent/[0.03] via-transparent to-transparent" />
          <div className="relative z-10">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-[2px] bg-accent/[0.08] text-accent mb-5 ring-1 ring-accent/10 group-hover:ring-accent/25 transition-all duration-500">
              <Code className="h-5 w-5" />
            </div>
            <h3 className="text-heading-md mb-3">
              Consulting & Freelance
            </h3>
            <p className="text-body-sm text-muted-foreground mb-5">
              Need help building AI agents, automating workflows, or integrating
              LLMs into your product? I&apos;m available for consulting and freelance
              engagements.
            </p>
            <Link
              href={`mailto:${siteConfig.author.email}?subject=Consulting Inquiry`}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Mail className="h-4 w-4" />
              {siteConfig.author.email}
            </Link>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-[2px] glass-card p-8 mb-14"
      >
        <h3 className="text-heading-md mb-6">Send a Message</h3>
        {submitted ? (
          <div className="text-center py-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[2px] bg-primary/10 text-primary mb-4">
              <Send className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">Your email client should have opened. Looking forward to hearing from you!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="text-sm font-medium text-foreground mb-1.5 block">Name</label>
                <Input id="name" required placeholder="Your name" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="rounded-[2px] border-white/10 bg-white/[0.03] focus:border-primary/30" />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <Input id="email" type="email" required placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} className="rounded-[2px] border-white/10 bg-white/[0.03] focus:border-primary/30" />
              </div>
            </div>
            <div>
              <label htmlFor="subject" className="text-sm font-medium text-foreground mb-1.5 block">Subject</label>
              <Input id="subject" placeholder="What's this about?" value={formData.subject} onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))} className="rounded-[2px] border-white/10 bg-white/[0.03] focus:border-primary/30" />
            </div>
            <div>
              <label htmlFor="message" className="text-sm font-medium text-foreground mb-1.5 block">Message</label>
              <textarea id="message" required rows={5} placeholder="Tell me about your project or opportunity..." value={formData.message} onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))} className="flex w-full rounded-[2px] border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus:border-primary/30 resize-none" />
            </div>
            <button
              type="submit"
              className={cn(
                buttonVariants({ size: "lg" }),
                "gap-2 rounded-[2px] bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-400"
              )}
            >
              <Send className="h-4 w-4" />
              Send Message
            </button>
          </form>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-[2px] glass-card p-8"
      >
        <h3 className="text-heading-md mb-6">Other Ways to Reach Me</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 p-3 rounded-[2px] hover:bg-white/[0.04] transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-[2px] bg-white/[0.04]">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">Email</p>
              <Link
                href={siteConfig.links.email}
                className="text-sm hover:text-primary transition-colors"
              >
                {siteConfig.author.email}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4 p-3 rounded-[2px] hover:bg-white/[0.04] transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-[2px] bg-white/[0.04]">
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">Location</p>
              <p className="text-sm">India (Open to Remote)</p>
            </div>
          </div>
          <Link
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-3 rounded-[2px] group hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[2px] bg-white/[0.04] group-hover:bg-primary/[0.08] transition-colors">
              <GithubIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">GitHub</p>
              <p className="text-sm group-hover:text-primary transition-colors">
                fayaz-shaik-01
              </p>
            </div>
          </Link>
          <Link
            href={siteConfig.links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-3 rounded-[2px] group hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[2px] bg-white/[0.04] group-hover:bg-primary/[0.08] transition-colors">
              <LinkedinIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">LinkedIn</p>
              <p className="text-sm group-hover:text-primary transition-colors">
                shaik-fayaz
              </p>
            </div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
