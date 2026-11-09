import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { tryGetCatalog, findItem } from "@/lib/course/catalog";
import { CatalogUnavailable } from "@/components/course/catalog-unavailable";
import { LessonView } from "@/components/course/lesson-view";

interface Props {
  params: Promise<{ itemId: string }>;
}

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const catalog = await tryGetCatalog();
  return catalog ? catalog.levels.flatMap((l) => l.items.map((i) => ({ itemId: i.id }))) : [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { itemId } = await params;
  const catalog = await tryGetCatalog();
  const found = catalog ? findItem(catalog, itemId) : undefined;
  return found ? { title: `${found.item.title} · AI Product Testing`, description: found.item.summary } : {};
}

export default async function LessonPage({ params }: Props) {
  const { itemId } = await params;
  const catalog = await tryGetCatalog();
  if (!catalog) return <CatalogUnavailable />;
  // An id missing from the cached catalog only 404s after a fresh fetch confirms it is absent.
  let found = findItem(catalog, itemId);
  if (!found) {
    const fresh = await tryGetCatalog({ fresh: true });
    if (!fresh) return <CatalogUnavailable />;
    found = findItem(fresh, itemId);
  }
  if (!found) notFound();

  const { level, item, prev, next } = found;
  return (
    <LessonView
      level={{ id: level.id, title: level.title }}
      item={item}
      prev={prev && { id: prev.id, title: prev.title }}
      next={next && { id: next.id, title: next.title }}
    />
  );
}
