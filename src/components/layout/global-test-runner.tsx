"use client";

import { usePathname } from "next/navigation";
import { TestRunner } from "@/components/home/test-runner";

export function GlobalTestRunner() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return <TestRunner autoOpen={isHome} />;
}
