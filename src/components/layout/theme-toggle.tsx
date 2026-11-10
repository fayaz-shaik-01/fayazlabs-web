"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

const frame =
  "inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="size-9" />;

  // Cycle: system -> light -> dark -> system
  const cycle = () => {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  };

  return (
    <button
      type="button"
      onClick={cycle}
      className={frame}
      aria-label={`Current theme: ${theme}. Click to change.`}
    >
      {theme === "dark" && <Moon className="size-4" />}
      {theme === "light" && <Sun className="size-4" />}
      {theme === "system" && <Monitor className="size-4" />}
    </button>
  );
}
