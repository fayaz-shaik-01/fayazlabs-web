import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { ExamSimulator } from "@/components/exam/exam-simulator";

const title = "Exam Simulator";
const description = "GATE-style timed mock exam with marking scheme, score report, and topic-wise analysis.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, url: `${siteConfig.url}/exam`, siteName: siteConfig.name, type: "website" },
  alternates: { canonical: `${siteConfig.url}/exam` },
};

export default function ExamPage() {
  return <ExamSimulator />;
}
