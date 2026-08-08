"use client";

import { useState, useCallback } from "react";
import SVGCanvas from "../common/SVGCanvas";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────

interface LinkedListAnimatorProps {
  readonly initialItems?: (string | number)[];
  readonly mode?: "singly" | "doubly" | "circular";
  readonly title?: string;
  readonly width?: number;
  readonly height?: number;
  readonly nodeWidth?: number;
  readonly nodeHeight?: number;
}

// ── Component ───────────────────────────────────────────────────────────

export default function LinkedListAnimator({
  initialItems = ["A", "B", "C"],
  mode = "singly",
  title,
  width = 700,
  height = 180,
  nodeWidth = 70,
  nodeHeight = 36,
}: LinkedListAnimatorProps) {
  const [items, setItems] = useState<(string | number)[]>(initialItems);
  const [inputVal, setInputVal] = useState("");
  const [lastAction, setLastAction] = useState("");

  const gap = 30;
  const startX = 40;

  const insertEnd = useCallback(() => {
    if (!inputVal.trim()) return;
    setItems((prev) => [...prev, inputVal.trim()]);
    setLastAction(`Insert "${inputVal.trim()}" at end`);
    setInputVal("");
  }, [inputVal]);

  const insertFront = useCallback(() => {
    if (!inputVal.trim()) return;
    setItems((prev) => [inputVal.trim(), ...prev]);
    setLastAction(`Insert "${inputVal.trim()}" at front`);
    setInputVal("");
  }, [inputVal]);

  const deleteFront = useCallback(() => {
    if (items.length === 0) return;
    const removed = items[0];
    setItems((prev) => prev.slice(1));
    setLastAction(`Delete "${removed}" from front`);
  }, [items]);

  const deleteEnd = useCallback(() => {
    if (items.length === 0) return;
    const removed = items.at(-1);
    setItems((prev) => prev.slice(0, -1));
    setLastAction(`Delete "${removed}" from end`);
  }, [items]);

  const dynamicWidth = Math.max(width, items.length * (nodeWidth + gap) + 100);

  return (
    <div className="flex flex-col gap-3 items-center">
      {title && (
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
      )}

      <div className="overflow-x-auto w-full">
        <SVGCanvas width={dynamicWidth} height={height} padding={10}>
          {/* HEAD label */}
          {items.length > 0 && (
            <text x={startX + nodeWidth / 2} y={25} textAnchor="middle" className="fill-emerald-400 text-[9px] font-mono">
              HEAD
            </text>
          )}

          {items.map((item, i) => {
            const x = startX + i * (nodeWidth + gap);
            const y = 40;
            const isHead = i === 0;
            const isTail = i === items.length - 1;

            return (
              <g key={`node-${i}`}>
                {/* Node box: data + pointer */}
                <rect
                  x={x} y={y}
                  width={nodeWidth} height={nodeHeight}
                  rx={4}
                  className={cn(
                    "stroke-[1.5]",
                    isHead ? "fill-emerald-500/10 stroke-emerald-400" : "fill-transparent stroke-foreground/30",
                  )}
                />
                {/* Data section */}
                <text
                  x={x + nodeWidth * 0.4}
                  y={y + nodeHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-foreground/80 text-[11px] font-mono"
                >
                  {item}
                </text>
                {/* Divider */}
                <line
                  x1={x + nodeWidth * 0.7}
                  y1={y}
                  x2={x + nodeWidth * 0.7}
                  y2={y + nodeHeight}
                  className="stroke-foreground/15 stroke-[1]"
                />
                {/* Pointer dot */}
                <circle
                  cx={x + nodeWidth * 0.85}
                  cy={y + nodeHeight / 2}
                  r={3}
                  className={cn(
                    isTail && mode !== "circular" ? "fill-red-400" : "fill-foreground/40",
                  )}
                />

                {/* Arrow to next */}
                {!isTail && (
                  <line
                    x1={x + nodeWidth}
                    y1={y + nodeHeight / 2}
                    x2={x + nodeWidth + gap}
                    y2={y + nodeHeight / 2}
                    className="stroke-foreground/30 stroke-[1.5]"
                    markerEnd="url(#ll-arrow)"
                  />
                )}

                {/* Backward arrow for doubly linked */}
                {mode === "doubly" && i > 0 && (
                  <line
                    x1={x}
                    y1={y + nodeHeight - 6}
                    x2={x - gap}
                    y2={y + nodeHeight - 6}
                    className="stroke-purple-400/40 stroke-[1]"
                    markerEnd="url(#ll-arrow-back)"
                  />
                )}

                {/* NULL for tail (singly/doubly) */}
                {isTail && mode !== "circular" && (
                  <text
                    x={x + nodeWidth + 15}
                    y={y + nodeHeight / 2}
                    dominantBaseline="central"
                    className="fill-red-400 text-[9px] font-mono"
                  >
                    NULL
                  </text>
                )}

                {/* Tail label */}
                {isTail && (
                  <text x={x + nodeWidth / 2} y={y + nodeHeight + 16} textAnchor="middle" className="fill-blue-400 text-[9px] font-mono">
                    TAIL
                  </text>
                )}
              </g>
            );
          })}

          {/* Circular arrow back to head */}
          {mode === "circular" && items.length > 1 && (() => {
            const lastX = startX + (items.length - 1) * (nodeWidth + gap) + nodeWidth;
            const firstX = startX;
            const y = 40 + nodeHeight + 20;
            return (
              <path
                d={`M ${lastX + 5} ${40 + nodeHeight / 2} L ${lastX + 15} ${40 + nodeHeight / 2} L ${lastX + 15} ${y} L ${firstX - 15} ${y} L ${firstX - 15} ${40 + nodeHeight / 2} L ${firstX} ${40 + nodeHeight / 2}`}
                className="fill-none stroke-amber-400/50 stroke-[1.5]"
                markerEnd="url(#ll-arrow-circ)"
              />
            );
          })()}

          <defs>
            <marker id="ll-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0,0 8,3 0,6" className="fill-foreground/40" />
            </marker>
            <marker id="ll-arrow-back" markerWidth="8" markerHeight="6" refX="0" refY="3" orient="auto">
              <polygon points="8,0 0,3 8,6" fill="#a78bfa" fillOpacity={0.5} />
            </marker>
            <marker id="ll-arrow-circ" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0,0 8,3 0,6" fill="#f59e0b" fillOpacity={0.6} />
            </marker>
          </defs>
        </SVGCanvas>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 justify-center">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && insertEnd()}
          placeholder="Value"
          className="w-20 px-2 py-1 text-sm font-mono rounded border border-foreground/20 bg-transparent text-foreground"
        />
        <button type="button" onClick={insertFront} disabled={!inputVal.trim()}
          className="px-2 py-1 text-xs font-mono rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-30 transition-colors">
          +Front
        </button>
        <button type="button" onClick={insertEnd} disabled={!inputVal.trim()}
          className="px-2 py-1 text-xs font-mono rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 disabled:opacity-30 transition-colors">
          +End
        </button>
        <button type="button" onClick={deleteFront} disabled={items.length === 0}
          className="px-2 py-1 text-xs font-mono rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-30 transition-colors">
          −Front
        </button>
        <button type="button" onClick={deleteEnd} disabled={items.length === 0}
          className="px-2 py-1 text-xs font-mono rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-30 transition-colors">
          −End
        </button>
      </div>

      <div className="text-xs font-mono text-muted-foreground">
        {mode === "singly" ? "Singly" : mode === "doubly" ? "Doubly" : "Circular"} Linked List · {items.length} nodes
        {lastAction && <span className="ml-2 text-primary">{lastAction}</span>}
      </div>
    </div>
  );
}
