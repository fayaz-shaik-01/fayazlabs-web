"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  readonly label?: string;
  readonly title: string;
  readonly description?: string;
  readonly align?: "left" | "center";
  readonly className?: string;
}

export function SectionHeader({
  label,
  title,
  description,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "mb-14",
        align === "center" && "text-center",
        className
      )}
    >
      {label && (
        <span className="mono-tag text-lab-green mb-4 inline-block">
          [ {label} ]
        </span>
      )}
      <h2 className="text-heading-xl text-foreground text-balance text-glow">
        {title}
      </h2>
      {description && (
        <p className={cn("mt-5 text-body-lg text-muted-foreground max-w-2xl", align === "center" && "mx-auto")}>
          {description}
        </p>
      )}
    </motion.div>
  );
}
