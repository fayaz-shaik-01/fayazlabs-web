import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { PracticeHub } from "@/components/practice/practice-hub";

const title = "Practice Problems — Test Your Knowledge";
const description = "MCQ, numerical, and short-answer problems across all learning tracks with instant feedback and detailed solutions.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, url: `${siteConfig.url}/practice`, siteName: siteConfig.name, type: "website" },
  alternates: { canonical: `${siteConfig.url}/practice` },
};

export default function PracticePage() {
  return <PracticeHub />;
}
