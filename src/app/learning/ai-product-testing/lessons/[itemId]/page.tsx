import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog, findItem } from "@/lib/course/catalog";
import { LessonView } from "@/components/course/lesson-view";

interface Props {
  params: Promise<{ itemId: string }>;
}

export async function generateStaticParams() {
  const catalog = await getCatalog();
  return catalog.levels.flatMap((l) => l.items.map((i) => ({ itemId: i.id })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { itemId } = await params;
  const found = findItem(await getCatalog(), itemId);
  return found ? { title: `${found.item.title} · AI Product Testing`, description: found.item.summary } : {};
}

export default async function LessonPage({ params }: Props) {
  const { itemId } = await params;
  const found = findItem(await getCatalog(), itemId);
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
