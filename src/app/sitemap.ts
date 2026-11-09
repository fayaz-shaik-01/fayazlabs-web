import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { getPublishedPosts, getPublishedProjects } from "@/lib/velite";
import { getProducts } from "@/lib/products";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPublishedPosts().map((post) => ({
    url: `${siteConfig.url}/writing/${post.slugAsParams}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const projects = getPublishedProjects().map((project) => ({
    url: `${siteConfig.url}/${project.slug}`,
    lastModified: new Date(project.date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const products = getProducts().map((product) => ({
    url: `${siteConfig.url}${product.href}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const staticPages = [
    "",
    "/learning",
    "/about",
    "/contact",
    "/projects",
    "/writing",
    "/pricing",
  ].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  return [...staticPages, ...posts, ...projects, ...products];
}
