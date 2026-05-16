import { defineConfig, defineCollection, s } from "velite";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkGfm from "remark-gfm";

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

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: { posts, projects, notebooks },
  mdx: {
    rehypePlugins: [
      rehypeSlug,
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
    remarkPlugins: [remarkGfm],
  },
});
