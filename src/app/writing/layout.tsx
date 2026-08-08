import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Writing",
    template: "%s | Fayaz Labs",
  },
  description:
    "Technical articles on AI engineering, agentic systems, automation, and backend architecture by Shaik Fayaz.",
  openGraph: {
    title: "Writing | Fayaz Labs",
    description:
      "Technical articles on AI engineering, agentic systems, automation, and backend architecture by Shaik Fayaz.",
    url: "/writing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Writing | Fayaz Labs",
    description:
      "Technical articles on AI engineering, agentic systems, automation, and backend architecture by Shaik Fayaz.",
  },
};

export default function WritingLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return <>{children}</>;
}
