import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { getPublishedPosts, getPublishedProjects } from "@/lib/velite";
import { getPhases, getAllLessonMetas } from "@/lib/learning";

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

  const phases = getPhases().map((phase) => ({
    url: `${siteConfig.url}/learning/phase/${phase.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const lessons = getAllLessonMetas().map((lesson) => ({
    url: `${siteConfig.url}/learning/lesson/${lesson.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const staticPages = [
    "",
    "/learning",
    "/projects",
    "/writing",
    "/about",
    "/contact",
  ].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  return [...staticPages, ...posts, ...projects, ...phases, ...lessons];
}
