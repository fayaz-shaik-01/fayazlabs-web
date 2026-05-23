import { posts, projects, notebooks, lessons } from "#site/content";

export type Post = (typeof posts)[number];
export type Project = (typeof projects)[number];
export type Notebook = (typeof notebooks)[number];
export type Lesson = (typeof lessons)[number];

export function getPublishedPosts() {
  return posts
    .filter((post) => post.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getFeaturedPosts() {
  return getPublishedPosts().filter((post) => post.featured);
}

export function getPostsByTag(tag: string) {
  return getPublishedPosts().filter((post) =>
    post.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
  );
}

export function getPostsByCategory(category: string) {
  return getPublishedPosts().filter(
    (post) => post.category.toLowerCase() === category.toLowerCase()
  );
}

export function getAllTags() {
  const tags = new Set<string>();
  getPublishedPosts().forEach((post) => post.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags).sort();
}

export function getAllCategories() {
  const categories = new Set<string>();
  getPublishedPosts().forEach((post) => categories.add(post.category));
  return Array.from(categories).sort();
}

export function getPublishedProjects() {
  return projects
    .filter((project) => project.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getFeaturedProjects() {
  return getPublishedProjects().filter((project) => project.featured);
}

export function getPublishedNotebooks() {
  return notebooks
    .filter((notebook) => notebook.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPublishedLessons() {
  return lessons
    .filter((lesson) => lesson.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getLessonBySlug(slug: string) {
  return lessons.find(
    (lesson) => lesson.lessonSlug === slug && lesson.published
  );
}
