"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { OrbStatus } from "@/stores/chat-store";

// three.js is large, so it loads on demand and never on the server.
const Scene = dynamic(() => import("./ai-orb-scene"), { ssr: false });

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** A cheap CSS version of the orb. The launcher uses it, and it stands in when 3D is unavailable. */
export function OrbCss({ status = "idle", className }: Readonly<{ status?: OrbStatus; className?: string }>) {
  return <span aria-hidden="true" data-status={status} className={cn("orb-css", className)} />;
}

/**
 * The 3D orb. It only loads three.js once it is on screen, pauses when it leaves
 * the screen or the tab is hidden, and falls back to the CSS orb when WebGL is
 * unavailable or the visitor prefers reduced motion.
 */
export function AiOrb({ status, className }: Readonly<{ status: OrbStatus; className?: string }>) {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"pending" | "3d" | "css">("pending");
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMode(!reduce && webglAvailable() ? "3d" : "css");
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div ref={ref} data-testid="ai-orb" data-mode={mode} data-status={status} className={cn("relative", className)}>
      {mode === "3d" && visible && <Scene status={status} active={tabVisible} />}
      {(mode === "css" || (mode === "3d" && !visible)) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <OrbCss status={status} className="size-[56%] max-h-56 max-w-56" />
        </div>
      )}
    </div>
  );
}
