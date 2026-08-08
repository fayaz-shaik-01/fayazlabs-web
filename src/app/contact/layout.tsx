import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Shaik Fayaz for AI engineering roles, consulting, or freelance projects.",
  openGraph: {
    title: "Contact | Fayaz Labs",
    description:
      "Get in touch with Shaik Fayaz for AI engineering roles, consulting, or freelance projects.",
    url: "/contact",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contact | Fayaz Labs",
    description:
      "Get in touch with Shaik Fayaz for AI engineering roles, consulting, or freelance projects.",
  },
};

export default function ContactLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return <>{children}</>;
}
