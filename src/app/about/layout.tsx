import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Shaik Fayaz — AI engineer, automation specialist, and backend developer. From NIT Calicut to Enphase Energy.",
};

export default function AboutLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return <>{children}</>;
}
