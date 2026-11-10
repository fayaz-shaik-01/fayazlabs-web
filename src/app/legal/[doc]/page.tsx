import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LEGAL_SLUGS, getLegalDoc, isLegalSlug } from "@/lib/legal";

interface Props {
  params: Promise<{ doc: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return LEGAL_SLUGS.map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { doc } = await params;
  if (!isLegalSlug(doc)) return {};
  const { title } = await getLegalDoc(doc);
  return { title, robots: { index: false, follow: false } };
}

export default async function LegalPage({ params }: Props) {
  const { doc } = await params;
  if (!isLegalSlug(doc)) notFound();
  const { html, updated } = await getLegalDoc(doc);

  return (
    <div className="mx-auto max-w-3xl px-4 pt-28 pb-24 sm:px-6 sm:pt-32">
      {updated && (
        <p className="eyebrow mb-4" data-testid="legal-updated">
          Last updated {updated}
        </p>
      )}
      <article
        className="prose legal-doc"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
