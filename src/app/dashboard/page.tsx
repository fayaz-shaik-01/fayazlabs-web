import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { StudyDashboard } from "@/components/dashboard/study-dashboard";

const title = "Study Dashboard";
const description = "Track your study streak, time spent, progress, and daily goals.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, url: `${siteConfig.url}/dashboard`, siteName: siteConfig.name, type: "website" },
  alternates: { canonical: `${siteConfig.url}/dashboard` },
};

export default function DashboardPage() {
  return <StudyDashboard />;
}
