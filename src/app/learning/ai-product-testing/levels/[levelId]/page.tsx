import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog, findLevel, COURSE_BASE } from "@/lib/course/catalog";
import { LevelList } from "@/components/course/level-list";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ levelId: string }>;
}

export async function generateStaticParams() {
  const catalog = await getCatalog();
  return catalog.levels.map((l) => ({ levelId: l.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { levelId } = await params;
  const level = findLevel(await getCatalog(), levelId);
  return level ? { title: level.title, description: level.summary } : {};
}

export default async function LevelPage({ params }: Props) {
  const { levelId } = await params;
  const level = findLevel(await getCatalog(), levelId);
  if (!level) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 pt-28 pb-24 sm:px-6 sm:pt-32">
      <Link href={COURSE_BASE} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
        <ArrowLeft className="size-4" />
        All levels
      </Link>
      <LevelList levels={[level]} linkLevels={false} />
    </div>
  );
}
