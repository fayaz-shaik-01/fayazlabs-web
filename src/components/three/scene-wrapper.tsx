"use client";

import { Suspense, lazy, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";

const NeuralGraphLazy = lazy(() =>
  import("./neural-graph").then((m) => ({ default: m.NeuralGraph }))
);

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export function HeroScene() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 mesh-gradient opacity-60" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-glow-primary/[0.06] blur-[160px]" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent", pointerEvents: "auto" }}
        performance={{ min: 0.5 }}
        eventSource={typeof document !== "undefined" ? document.documentElement : undefined}
        eventPrefix="client"
      >
        <Suspense fallback={null}>
          <NeuralGraphLazy />
        </Suspense>
      </Canvas>
      {/* Radial vignette for seamless edge blending */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 70% at 60% 45%, transparent 30%, var(--background) 85%)",
        }}
      />
    </div>
  );
}
