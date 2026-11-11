import Link from "next/link";
import { ArrowRight, Briefcase, Code } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-12 pb-8 sm:px-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel bracket flex flex-col p-7 sm:p-8">
          <span className="mb-5 inline-flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Briefcase className="size-5" />
          </span>
          <h3 className="text-heading-md mb-2">Looking for AI Engineering Talent?</h3>
          <p className="mb-6 text-base text-muted-foreground">
            I&apos;m open to remote AI engineering, backend engineering, and SDET
            roles. Let&apos;s build something impactful together.
          </p>
          <Link
            href="/contact"
            className={cn(buttonVariants({ size: "lg" }), "mt-auto w-fit")}
          >
            Get in touch
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="panel bracket flex flex-col p-7 sm:p-8">
          <span className="mb-5 inline-flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Code className="size-5" />
          </span>
          <h3 className="text-heading-md mb-2">Need AI/Automation Consulting?</h3>
          <p className="mb-6 text-base text-muted-foreground">
            I help teams build AI agents, automate workflows, and integrate LLM
            capabilities into existing products.
          </p>
          <Link
            href="/services"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "mt-auto w-fit"
            )}
          >
            View services
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
