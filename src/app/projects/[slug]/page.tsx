import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { projects } from "#site/content";
import { Badge } from "@/components/ui/badge";
import { MDXContent } from "@/components/mdx-content";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface ProjectPageProps {
  readonly params: Promise<{ slug: string }>;
}

function getProjectBySlug(slug: string) {
  return projects.find(
    (project) => project.slugAsParams === slug && project.published
  );
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      type: "article",
    },
  };
}

export async function generateStaticParams() {
  return projects
    .filter((p) => p.published)
    .map((project) => ({ slug: project.slugAsParams }));
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 pt-32 pb-16 sm:pt-40 sm:pb-24">
      <Link
        href="/projects"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "mb-8 gap-1.5"
        )}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All Projects
      </Link>

      <header className="mb-12">
        <h1 className="text-display-lg mb-5 text-glow">
          {project.title}
        </h1>
        <p className="text-body-lg text-muted-foreground mb-6">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {project.stack.map((tech) => (
            <Badge key={tech} variant="secondary">
              {tech}
            </Badge>
          ))}
        </div>

        <div className="flex gap-3">
          {project.github && (
            <Link
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]")}
            >
              GitHub
            </Link>
          )}
          {project.demo && (
            <Link
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Live Demo
            </Link>
          )}
        </div>
      </header>

      <div className="prose prose-invert max-w-none">
        <MDXContent code={project.body} />
      </div>
    </article>
  );
}
