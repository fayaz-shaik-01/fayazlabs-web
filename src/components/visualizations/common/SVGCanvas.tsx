"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface SVGCanvasProps {
  readonly width?: number;
  readonly height?: number;
  readonly viewBox?: string;
  readonly preserveAspectRatio?: string;
  readonly className?: string;
  readonly children: React.ReactNode;
  readonly padding?: number;
}

export default function SVGCanvas({
  width = 800,
  height = 500,
  viewBox,
  preserveAspectRatio = "xMidYMid meet",
  className,
  children,
  padding = 0,
}: SVGCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(width);

  const updateWidth = useCallback(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth);
    }
  }, []);

  useEffect(() => {
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [updateWidth]);

  const computedViewBox =
    viewBox ??
    `${-padding} ${-padding} ${width + padding * 2} ${height + padding * 2}`;

  const aspectRatio = height / width;
  const computedHeight = containerWidth * aspectRatio;

  return (
    <div ref={containerRef} className={cn("w-full", className)}>
      <svg
        width={containerWidth}
        height={computedHeight}
        viewBox={computedViewBox}
        preserveAspectRatio={preserveAspectRatio}
        className="overflow-visible"
        role="graphics-document"
      >
        {children}
      </svg>
    </div>
  );
}
