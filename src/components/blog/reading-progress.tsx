"use client";

import { useEffect, useState } from "react";
import { motion, useScroll } from "framer-motion";

export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      setIsVisible(v > 0.02);
    });
    return unsubscribe;
  }, [scrollYProgress]);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left bg-primary shadow-[0_0_8px_oklch(from_var(--primary)_l_c_h/50%),0_0_24px_oklch(from_var(--primary)_l_c_h/20%)]"
      style={{ scaleX: scrollYProgress }}
    />
  );
}
