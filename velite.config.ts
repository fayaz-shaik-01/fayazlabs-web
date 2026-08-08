import { defineConfig, defineCollection, s } from "velite";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

const computedFields = <T extends { slug: string }>(data: T) => ({
  ...data,
  slugAsParams: data.slug.split("/").slice(1).join("/"),
});

const posts = defineCollection({
  name: "Post",
  pattern: "blog/**/*.mdx",
  schema: s
    .object({
      slug: s.path(),
      title: s.string().max(200),
      description: s.string().max(500),
      date: s.isodate(),
      published: s.boolean().default(true),
      featured: s.boolean().default(false),
      image: s.string().optional(),
      tags: s.array(s.string()).default([]),
      category: s.string().default("General"),
      body: s.mdx(),
    })
    .transform(computedFields),
});

const projects = defineCollection({
  name: "Project",
  pattern: "projects/**/*.mdx",
  schema: s
    .object({
      slug: s.path(),
      title: s.string().max(200),
      description: s.string().max(500),
      date: s.isodate(),
      published: s.boolean().default(true),
      featured: s.boolean().default(false),
      image: s.string().optional(),
      tags: s.array(s.string()).default([]),
      stack: s.array(s.string()).default([]),
      github: s.string().optional(),
      demo: s.string().optional(),
      body: s.mdx(),
    })
    .transform(computedFields),
});

const notebooks = defineCollection({
  name: "Notebook",
  pattern: "notebook/**/*.mdx",
  schema: s
    .object({
      slug: s.path(),
      title: s.string().max(200),
      description: s.string().max(500),
      date: s.isodate(),
      published: s.boolean().default(true),
      images: s.array(s.string()).default([]),
      tags: s.array(s.string()).default([]),
      body: s.mdx(),
    })
    .transform(computedFields),
});

const lessons = defineCollection({
  name: "Lesson",
  pattern: "learning/lessons/**/*.mdx",
  schema: s
    .object({
      slug: s.path(),
      title: s.string().max(200),
      description: s.string().max(500),
      date: s.isodate(),
      published: s.boolean().default(true),
      lessonSlug: s.string(),
      phaseId: s.number(),
      difficulty: s.enum(["beginner", "intermediate", "advanced"]),
      estimatedMinutes: s.number().default(30),
      prerequisites: s.array(s.string()).default([]),
      tags: s.array(s.string()).default([]),
      body: s.mdx(),
    })
    .transform(computedFields),
});

const knowledgeObjectSchema = s.object({
  id: s.string(),
  type: s.enum(["concept", "definition", "formula", "algorithm", "theorem", "example", "problem", "flashcard", "application", "project"]),
  title: s.string().optional(),
  latex: s.string().optional(),
  plainEnglish: s.string().optional(),
  prerequisites: s.array(s.string()).default([]),
  usedIn: s.array(s.string()).default([]),
  difficulty: s.enum(["beginner", "intermediate", "advanced"]).optional(),
  tags: s.array(s.string()).default([]),
  examRelevance: s.object({
    gate: s.enum(["high", "medium", "low", "none"]).optional(),
    sebi: s.enum(["high", "medium", "low", "none"]).optional(),
  }).optional(),
});

const trackLessons = defineCollection({
  name: "TrackLesson",
  pattern: "learning/tracks/**/*.mdx",
  schema: s
    .object({
      slug: s.path(),
      title: s.string().max(200),
      description: s.string().max(500),
      summary: s.string().max(300).optional(),
      date: s.isodate(),
      published: s.boolean().default(true),
      track: s.string(),
      module: s.string(),
      lesson: s.string(),
      difficulty: s.enum(["beginner", "intermediate", "advanced"]),
      estimatedMinutes: s.number().default(30),
      prerequisites: s.array(s.string()).default([]),
      tags: s.array(s.string()).default([]),
      learningObjectives: s.array(s.string()).default([]),
      concepts: s.array(s.string()).default([]),
      relatedLessons: s.array(s.string()).default([]),
      lessonType: s
        .enum(["build", "learn", "lab", "reference"])
        .default("learn"),
      order: s.number().default(0),
      premium: s.boolean().default(false),
      status: s
        .enum(["published", "draft", "planned", "experimental", "archived"])
        .default("published"),
      canonicalPath: s.string().optional(),
      references: s
        .array(s.object({ title: s.string(), url: s.string() }))
        .default([]),
      recommendedBackground: s.array(s.string()).default([]),
      estimatedDifficultyScore: s.number().optional(),
      mentorPriority: s.enum(["high", "medium", "low"]).optional(),
      knowledgeObjects: s.array(knowledgeObjectSchema).default([]),
      visualizations: s
        .array(
          s.object({
            id: s.string(),
            config: s.record(s.string(), s.unknown()).default({}),
          })
        )
        .default([]),
      body: s.mdx(),
    })
    .transform(computedFields),
});

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: { posts, projects, notebooks, lessons, trackLessons },
  mdx: {
    rehypePlugins: [
      rehypeSlug,
      [rehypeKatex, { strict: false }],
      [rehypePrettyCode, { theme: { dark: "one-dark-pro", light: "min-light" }, defaultLang: "plaintext", keepBackground: false }],
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
          properties: {
            className: ["subheading-anchor"],
          },
        },
      ],
    ],
    remarkPlugins: [remarkGfm, remarkMath],
  },
});
