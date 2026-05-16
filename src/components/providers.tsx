"use client";

import { LazyMotion, domAnimation, MotionConfig } from "framer-motion";

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
