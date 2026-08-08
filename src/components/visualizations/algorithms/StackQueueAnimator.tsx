"use client";

import { useState, useCallback } from "react";
import SVGCanvas from "../common/SVGCanvas";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────

interface StackQueueAnimatorProps {
  readonly mode?: "stack" | "queue";
  readonly initialItems?: (string | number)[];
  readonly maxSize?: number;
  readonly title?: string;
  readonly width?: number;
  readonly height?: number;
  readonly cellWidth?: number;
  readonly cellHeight?: number;
}

// ── Component ───────────────────────────────────────────────────────────

export default function StackQueueAnimator({
  mode = "stack",
  initialItems = [],
  maxSize = 8,
  title,
  width = 400,
  height = 380,
  cellWidth = 80,
  cellHeight = 36,
}: StackQueueAnimatorProps) {
  const [items, setItems] = useState<(string | number)[]>(initialItems);
  const [inputVal, setInputVal] = useState("");
  const [lastAction, setLastAction] = useState<string>("");

  const push = useCallback(() => {
    if (items.length >= maxSize || !inputVal.trim()) return;
    setItems((prev) => [...prev, inputVal.trim()]);
    setLastAction(`${mode === "stack" ? "Push" : "Enqueue"}: ${inputVal.trim()}`);
    setInputVal("");
  }, [items.length, maxSize, inputVal, mode]);

  const pop = useCallback(() => {
    if (items.length === 0) return;
    if (mode === "stack") {
      const removed = items.at(-1);
      setItems((prev) => prev.slice(0, -1));
      setLastAction(`Pop: ${removed}`);
    } else {
      const removed = items[0];
      setItems((prev) => prev.slice(1));
      setLastAction(`Dequeue: ${removed}`);
    }
  }, [items, mode]);

  const isStack = mode === "stack";
  const label = isStack ? "Stack" : "Queue";

  // For stack: bottom of visual is index 0, top is last
  // For queue: left is front (index 0), right is rear (last)
  const svgItems = isStack ? [...items].reverse() : items;

  return (
    <div className="flex flex-col gap-3 items-center">
      {title && (
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
      )}

      <SVGCanvas width={width} height={height} padding={10}>
        {isStack ? (
          // Vertical stack
          <g>
            {svgItems.map((item, i) => {
              const x = (width - cellWidth) / 2;
              const y = 20 + i * (cellHeight + 4);
              const isTop = i === 0;
              return (
                <g key={`cell-${i}`}>
                  <rect
                    x={x} y={y}
                    width={cellWidth} height={cellHeight}
                    rx={4}
                    className={cn(
                      "stroke-[1.5] transition-colors",
                      isTop
                        ? "fill-blue-500/10 stroke-blue-400"
                        : "fill-transparent stroke-foreground/30",
                    )}
                  />
                  <text
                    x={x + cellWidth / 2}
                    y={y + cellHeight / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-foreground/80 text-[12px] font-mono"
                  >
                    {item}
                  </text>
                  {isTop && (
                    <text
                      x={x + cellWidth + 10}
                      y={y + cellHeight / 2}
                      dominantBaseline="central"
                      className="fill-blue-400 text-[9px] font-mono"
                    >
                      ← TOP
                    </text>
                  )}
                </g>
              );
            })}
            {/* Empty slots */}
            {Array.from({ length: maxSize - items.length }, (_, i) => {
              const x = (width - cellWidth) / 2;
              const adjustedY = 20 + (i + items.length) * (cellHeight + 4);
              return (
                <rect
                  key={`empty-${i}`}
                  x={x} y={adjustedY}
                  width={cellWidth} height={cellHeight}
                  rx={4}
                  className="fill-transparent stroke-foreground/10 stroke-[1] stroke-dasharray-[4]"
                />
              );
            })}
          </g>
        ) : (
          // Horizontal queue
          <g>
            {svgItems.map((item, i) => {
              const x = 20 + i * (cellWidth + 4);
              const y = (height - cellHeight) / 2 - 20;
              const isFront = i === 0;
              const isRear = i === svgItems.length - 1;
              return (
                <g key={`cell-${i}`}>
                  <rect
                    x={x} y={y}
                    width={cellWidth} height={cellHeight}
                    rx={4}
                    className={cn(
                      "stroke-[1.5]",
                      isFront
                        ? "fill-emerald-500/10 stroke-emerald-400"
                        : isRear
                          ? "fill-blue-500/10 stroke-blue-400"
                          : "fill-transparent stroke-foreground/30",
                    )}
                  />
                  <text
                    x={x + cellWidth / 2}
                    y={y + cellHeight / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-foreground/80 text-[12px] font-mono"
                  >
                    {item}
                  </text>
                  {isFront && (
                    <text x={x + cellWidth / 2} y={y - 8} textAnchor="middle" className="fill-emerald-400 text-[8px] font-mono">
                      FRONT
                    </text>
                  )}
                  {isRear && (
                    <text x={x + cellWidth / 2} y={y - 8} textAnchor="middle" className="fill-blue-400 text-[8px] font-mono">
                      REAR
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}
      </SVGCanvas>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && push()}
          placeholder="Value"
          className="w-20 px-2 py-1 text-sm font-mono rounded border border-foreground/20 bg-transparent text-foreground"
        />
        <button
          type="button"
          onClick={push}
          disabled={items.length >= maxSize || !inputVal.trim()}
          className="px-3 py-1 text-sm font-mono rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 disabled:opacity-30 transition-colors"
        >
          {isStack ? "Push" : "Enqueue"}
        </button>
        <button
          type="button"
          onClick={pop}
          disabled={items.length === 0}
          className="px-3 py-1 text-sm font-mono rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-30 transition-colors"
        >
          {isStack ? "Pop" : "Dequeue"}
        </button>
      </div>

      <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
        <span>{label} · Size: {items.length}/{maxSize}</span>
        {lastAction && <span className="text-primary">{lastAction}</span>}
      </div>
    </div>
  );
}
