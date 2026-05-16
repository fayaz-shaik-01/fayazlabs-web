"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Calendar } from "lucide-react";
import { getPublishedPosts, getAllTags, getAllCategories } from "@/lib/velite";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

function WritingContent() {
  const allPosts = getPublishedPosts();
  const allTags = getAllTags();
  const allCategories = getAllCategories();
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    return allPosts.filter((post) => {
      const matchesSearch =
        !search ||
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.description.toLowerCase().includes(search.toLowerCase());
      const matchesTag =
        !selectedTag ||
        post.tags.map((t: string) => t.toLowerCase()).includes(selectedTag.toLowerCase());
      const matchesCategory =
        !selectedCategory ||
        post.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesTag && matchesCategory;
    });
  }, [allPosts, search, selectedTag, selectedCategory]);

  const isFiltering = search || selectedTag || selectedCategory;
  const featuredPost = isFiltering ? null : allPosts.find((p) => p.featured);

  return (
    <div className="mx-auto max-w-6xl px-6 pt-32 pb-20 sm:pt-40 sm:pb-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mb-14"
      >
        <span className="mono-tag text-lab-green mb-4 inline-block">
          [ Writing ]
        </span>
        <h1 className="text-heading-xl text-foreground text-glow mb-3">
          Thoughts & Technical Writing
        </h1>
        <p className="text-body-lg text-muted-foreground max-w-2xl">
          Articles on AI engineering, agentic systems, backend architecture, and lessons from building.
        </p>
      </motion.div>

      {featuredPost && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <Link
            href={`/writing/${featuredPost.slugAsParams}`}
            className="group relative block rounded-[2px] glass-card p-8 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent" />
            <div className="relative z-10">
            <Badge className="mb-3 bg-primary/15 text-primary border-primary/20">Featured</Badge>
            <h2 className="text-heading-lg mb-3 group-hover:text-primary transition-colors duration-300">
              {featuredPost.title}
            </h2>
            <p className="text-body-sm text-muted-foreground mb-3">
              {featuredPost.description}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(featuredPost.date), "MMMM d, yyyy")}
            </div>
            </div>
          </Link>
        </motion.div>
      )}

      <div className="mb-10 space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-[2px] border-white/10 bg-white/[0.03] focus:border-primary/30 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "rounded-[2px] px-3 py-1 text-xs font-medium transition-colors",
              !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-white/[0.04] text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setSelectedCategory(selectedCategory === cat ? null : cat)
              }
              className={cn(
                "rounded-[2px] px-3 py-1 text-xs font-medium transition-colors",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/[0.04] text-muted-foreground hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() =>
                setSelectedTag(selectedTag === tag ? null : tag)
              }
              className={cn(
                "rounded-[2px] px-2.5 py-0.5 text-[11px] font-medium font-mono transition-colors",
                selectedTag === tag
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredPosts.map((post, i) => (
          <motion.div
            key={post.slug}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Link
              href={`/writing/${post.slugAsParams}`}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-[2px] glass-card p-5"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-[0.9375rem] font-semibold tracking-[-0.01em] group-hover:text-primary transition-colors truncate">
                  {post.title}
                </h3>
                <p className="text-body-sm text-muted-foreground mt-1 line-clamp-1">
                  {post.description}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge variant="secondary" className="text-[10px]">
                  {post.category}
                </Badge>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(post.date), "MMM d, yyyy")}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}

        {filteredPosts.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            No articles found matching your filters.
          </p>
        )}
      </div>
    </div>
  );
}

export default function WritingPage() {
  return <WritingContent />;
}
