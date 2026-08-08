import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { getPublishedPosts, getPublishedProjects } from "@/lib/velite";
import { getAllTracks, getLessonPath } from "@/lib/curriculum";

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

  const tracks = getAllTracks().map((track) => ({
    url: `${siteConfig.url}/learning/${track.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const trackLessons = getAllTracks().flatMap((track) =>
    track.modules.flatMap((mod) =>
      mod.lessons.map((lesson) => ({
        url: `${siteConfig.url}${getLessonPath(track.slug, mod.slug, lesson.slug)}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: lesson.hasContent ? 0.8 : 0.4,
      }))
    )
  );

  const staticPages = [
    "",
    "/learning",
    "/about",
    "/contact",
  ].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  return [...staticPages, ...posts, ...projects, ...tracks, ...trackLessons];
}
