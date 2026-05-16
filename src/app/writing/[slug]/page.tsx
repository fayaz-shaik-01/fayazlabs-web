import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react";
import { posts } from "#site/content";
import { Badge } from "@/components/ui/badge";
import { MDXContent } from "@/components/mdx-content";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { format } from "date-fns";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { TableOfContents } from "@/components/blog/table-of-contents";

interface PostPageProps {
  readonly params: Promise<{ slug: string }>;
}

function getPostBySlug(slug: string) {
  return posts.find((post) => post.slugAsParams === slug && post.published);
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `/writing/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export async function generateStaticParams() {
  return posts
    .filter((p) => p.published)
    .map((post) => ({ slug: post.slugAsParams }));
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const stringLiterals = post.body.match(/"([^"]{2,})"/g) || [];
  const contentText = stringLiterals
    .map((s) => s.slice(1, -1))
    .filter((s) => !s.startsWith("use ") && !s.includes("jsx") && !s.includes("\\") && !/^[a-z-]+$/.test(s))
    .join(" ");
  const wordCount = contentText.split(/\s+/).filter((w) => w.length > 1).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <>
      <ReadingProgress />
      <div className="mx-auto max-w-6xl px-6 pt-32 pb-16 sm:pt-40 sm:pb-24">
        <div className="xl:grid xl:grid-cols-[1fr_220px] xl:gap-12">
          <article className="max-w-3xl">
            <Link
              href="/writing"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "mb-8 gap-1.5"
              )}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All Writing
            </Link>

            <header className="mb-12">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(post.date), "MMMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {readingTime} min read
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {post.category}
                </Badge>
              </div>

              <h1 className="text-display-lg mb-5 text-glow">
                {post.title}
              </h1>
              <p className="text-body-lg text-muted-foreground">
                {post.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mt-4">
                {post.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {tag}
                  </span>
                ))}
              </div>
            </header>

            <div className="prose prose-invert max-w-none">
              <MDXContent code={post.body} />
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
