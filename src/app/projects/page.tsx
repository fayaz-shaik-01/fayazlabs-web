import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { getPublishedProjects } from "@/lib/velite";
import { Badge } from "@/components/ui/badge";
import { AnimatedSection } from "@/components/shared/animated-section";
import { SectionHeader } from "@/components/shared/section-header";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "AI engineering projects, automation tools, and backend systems built by Shaik Fayaz.",
};

export default function ProjectsPage() {
  const projects = getPublishedProjects();

  return (
    <AnimatedSection>
      <SectionHeader
        label="Projects"
        title="Engineering Projects"
        description="Selected projects showcasing AI engineering, automation, and system design."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        {projects.map((project) => (
          <Link
            key={project.slug}
            href={`/${project.slug}`}
            className="group relative flex flex-col h-full glass-card rounded-[2px] p-7"
          >
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-heading-md group-hover:text-primary transition-colors duration-300 pr-4">
                  {project.title}
                </h3>
                <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-muted-foreground opacity-0 -translate-y-1 translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0" />
              </div>

              <p className="text-body-sm text-muted-foreground mb-5 flex-1">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {project.stack.map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-[11px] rounded-[2px] border-white/10 bg-white/[0.04] font-mono">
                    {tech}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.06]">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] text-primary/60 font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {projects.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          Projects coming soon.
        </p>
      )}
    </AnimatedSection>
  );
}
