import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { FlashcardHub } from "@/components/flashcards/flashcard-hub";

const title = "Flashcards — Spaced Repetition for Exam Prep";
const description = "Review key concepts with Leitner-based spaced repetition flashcards across all learning tracks.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, url: `${siteConfig.url}/flashcards`, siteName: siteConfig.name, type: "website" },
  alternates: { canonical: `${siteConfig.url}/flashcards` },
};

export default function FlashcardsPage() {
  return <FlashcardHub />;
}
