import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/tax/dashboard", label: "Dashboard" },
  { href: "/tax/documents", label: "Documents" },
  { href: "/tax/insights", label: "Insights" },
  { href: "/tax/chat", label: "AI Advisor" },
];

export async function TaxAuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("tax-token")?.value;

  if (!token) {
    redirect("/tax/login");
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border px-4 py-6 gap-1">
        <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tax Intelligence
        </p>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[2px] px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
        <div className="mt-auto pt-4 border-t border-border">
          <form action="/api/tax/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full rounded-[2px] px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 min-w-0 px-6 py-8">{children}</main>
    </div>
  );
}
