import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BookOpen } from "lucide-react";
import { notebooks } from "#site/content";
import { Badge } from "@/components/ui/badge";
import { MDXContent } from "@/components/mdx-content";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { format } from "date-fns";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { TableOfContents } from "@/components/blog/table-of-contents";

interface NotebookPageProps {
  readonly params: Promise<{ slug: string }>;
}

function getNotebookBySlug(slug: string) {
  return notebooks.find(
    (entry) => entry.slugAsParams === slug && entry.published
  );
}

export async function generateMetadata({
  params,
}: NotebookPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getNotebookBySlug(slug);
  if (!entry) return {};
  return {
    title: entry.title,
    description: entry.description,
  };
}

export async function generateStaticParams() {
  return notebooks
    .filter((n) => n.published)
    .map((entry) => ({ slug: entry.slugAsParams }));
}

export default async function NotebookEntryPage({
  params,
}: NotebookPageProps) {
  const { slug } = await params;
  const entry = getNotebookBySlug(slug);
  if (!entry) notFound();

  return (
    <>
      <ReadingProgress />
      <div className="mx-auto max-w-6xl px-6 pt-32 pb-16 sm:pt-40 sm:pb-24">
        <div className="xl:grid xl:grid-cols-[1fr_220px] xl:gap-12">
          <article className="max-w-4xl">
            <Link
              href="/notebook"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "mb-8 gap-1.5"
              )}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All Notes
            </Link>

            <header className="mb-12">
              <div className="inline-flex items-center gap-1.5 rounded-[2px] bg-white/[0.04] border border-white/10 px-3 py-1 text-xs font-mono font-medium text-muted-foreground mb-4">
                <BookOpen className="h-3 w-3" />
                Engineering Notebook
              </div>
              <h1 className="text-display-lg mb-4 text-glow">
                {entry.title}
              </h1>
              <p className="text-body-lg text-muted-foreground mb-4">
                {entry.description}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(entry.date), "MMMM d, yyyy")}
                </span>
                <div className="flex gap-1.5">
                  {entry.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </header>

            {entry.images.length > 0 && (
              <div className="mb-12 space-y-6">
                {entry.images.map((img: string, i: number) => (
                  <div
                    key={img}
                    className="relative rounded-[2px] glass-card p-6 overflow-hidden"
                  >
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1 rounded-[2px] bg-background/70 backdrop-blur-md border border-white/10 px-2.5 py-1 text-[10px] font-mono font-medium text-muted-foreground">
                        <BookOpen className="h-2.5 w-2.5" />
                        Diagram {i + 1}
                      </span>
                    </div>
                    <Image
                      src={img}
                      alt={`${entry.title} - Diagram ${i + 1}`}
                      width={800}
                      height={500}
                      className="rounded-[2px] mx-auto"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="prose prose-invert max-w-none">
              <MDXContent code={entry.body} />
            </div>
          </article>

          <aside className="hidden xl:block">
            <TableOfContents />
          </aside>
        </div>
      </div>
    </>
  );
}
