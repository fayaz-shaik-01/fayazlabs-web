import Link from "next/link";
import { ArrowRight } from "lucide-react";

const paths = [
  {
    chip: "Courses",
    title: "Learn AI product testing",
    description: "Start the AI Product Testing course, free to start.",
    meta: "Free to start",
    href: "/learning",
    cta: "Open",
  },
  {
    chip: "Projects",
    title: "Things I have built",
    description: "AI tooling, automation and backends, with the story behind each.",
    meta: "Case studies",
    href: "/projects",
    cta: "Browse",
  },
  {
    chip: "Writing",
    title: "Notes and essays",
    description: "Articles and deep dives on AI engineering and testing.",
    meta: "Blog + notebook",
    href: "/writing",
    cta: "Read",
  },
  {
    chip: "Contact",
    title: "Work together",
    description: "Ask a question, discuss a role, or just say hi.",
    meta: "Get in touch",
    href: "/contact",
    cta: "Write",
  },
];

export function QuickAccess() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-2">
        <span className="eyebrow">Start here</span>
        <h2 className="text-heading-xl text-foreground">Pick a path</h2>
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {paths.map((p) => (
          <li key={p.href}>
            <Link
              href={p.href}
              className="panel panel-interactive group flex h-full flex-col p-5"
            >
              <span className="chip w-fit">{p.chip}</span>
              <h3 className="mt-3 text-lg font-bold leading-snug text-foreground">
                {p.title}
              </h3>
              <p className="mt-2 text-[0.9375rem] text-muted-foreground">
                {p.description}
              </p>
              <div className="mt-auto flex items-center justify-between pt-5">
                <span className="eyebrow">{p.meta}</span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {p.cta}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
