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
  const { html } = await getLegalDoc(doc);

  return (
    <div className="mx-auto max-w-3xl px-6 pt-32 pb-24">
      <div
        role="note"
        data-testid="legal-draft-banner"
        className="mb-8 rounded-md border-2 border-amber-500/60 bg-amber-500/10 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-foreground"
      >
        DRAFT, pending review
      </div>
      <article
        className="space-y-4 text-sm leading-relaxed text-muted-foreground [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-foreground [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-foreground [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
