import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Writing",
    template: "%s | Fayaz Labs",
  },
  description:
    "Technical articles on AI engineering, agentic systems, automation, and backend architecture by Shaik Fayaz.",
};

export default function WritingLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return <>{children}</>;
}
