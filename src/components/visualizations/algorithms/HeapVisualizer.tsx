"use client";

import { useState, useMemo, useCallback } from "react";
import SVGCanvas from "../common/SVGCanvas";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────

interface HeapVisualizerProps {
  readonly initialArray?: number[];
  readonly mode?: "min" | "max";
  readonly title?: string;
  readonly width?: number;
  readonly height?: number;
  readonly nodeRadius?: number;
}

// ── Heap operations ─────────────────────────────────────────────────────

function heapifyUp(arr: number[], idx: number, isMax: boolean): number[] {
  const result = [...arr];
  let i = idx;
  while (i > 0) {
    const parent = Math.floor((i - 1) / 2);
    const shouldSwap = isMax ? result[i] > result[parent] : result[i] < result[parent];
    if (shouldSwap) {
      [result[i], result[parent]] = [result[parent], result[i]];
      i = parent;
    } else break;
  }
  return result;
}

function heapifyDown(arr: number[], idx: number, isMax: boolean): number[] {
  const result = [...arr];
  const n = result.length;
  let i = idx;
  while (true) {
    let target = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    if (left < n) {
      const cmp = isMax ? result[left] > result[target] : result[left] < result[target];
      if (cmp) target = left;
    }
    if (right < n) {
      const cmp = isMax ? result[right] > result[target] : result[right] < result[target];
      if (cmp) target = right;
    }
    if (target === i) break;
    [result[i], result[target]] = [result[target], result[i]];
    i = target;
  }
  return result;
}

// ── Component ───────────────────────────────────────────────────────────

export default function HeapVisualizer({
  initialArray = [10, 20, 15, 30, 40],
  mode = "min",
  title,
  width = 600,
  height = 380,
  nodeRadius = 20,
}: HeapVisualizerProps) {
  const isMax = mode === "max";
  const [heap, setHeap] = useState<number[]>(() => {
    // Build heap from initial array
    let arr = [...initialArray];
    for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i--) {
      arr = heapifyDown(arr, i, isMax);
    }
    return arr;
  });
  const [inputVal, setInputVal] = useState("");
  const [lastAction, setLastAction] = useState("");

  const insert = useCallback(() => {
    const val = Number(inputVal);
    if (Number.isNaN(val)) return;
    const newHeap = heapifyUp([...heap, val], heap.length, isMax);
    setHeap(newHeap);
    setLastAction(`Insert ${val}`);
    setInputVal("");
  }, [heap, inputVal, isMax]);

  const extractRoot = useCallback(() => {
    if (heap.length === 0) return;
    const root = heap[0];
    if (heap.length === 1) {
      setHeap([]);
    } else {
      const newArr = [heap.at(-1)!, ...heap.slice(1, -1)];
      setHeap(heapifyDown(newArr, 0, isMax));
    }
    setLastAction(`Extract ${isMax ? "max" : "min"}: ${root}`);
  }, [heap, isMax]);

  // Tree layout from array
  const positions = useMemo(() => {
    const levelGap = 60;
    const pos: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < heap.length; i++) {
      const level = Math.floor(Math.log2(i + 1));
      const levelStart = Math.pow(2, level) - 1;
      const posInLevel = i - levelStart;
      const levelSize = Math.pow(2, level);
      const levelWidth = width - 60;
      const spacing = levelWidth / (levelSize + 1);
      const x = 30 + spacing * (posInLevel + 1);
      const y = 30 + level * levelGap;
      pos.push({ x, y });
    }
    return pos;
  }, [heap, width]);

  return (
    <div className="flex flex-col gap-3 items-center">
      {title && (
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
      )}

      <SVGCanvas width={width} height={height} padding={10}>
        {/* Edges */}
        {heap.map((_, i) => {
          if (i === 0) return null;
          const parent = Math.floor((i - 1) / 2);
          return (
            <line
              key={`edge-${i}`}
              x1={positions[parent].x} y1={positions[parent].y + nodeRadius}
              x2={positions[i].x} y2={positions[i].y - nodeRadius}
              className="stroke-foreground/20 stroke-[1.5]"
            />
          );
        })}

        {/* Nodes */}
        {heap.map((val, i) => {
          const isRoot = i === 0;
          return (
            <g key={`node-${i}`}>
              <circle
                cx={positions[i].x}
                cy={positions[i].y}
                r={nodeRadius}
                className={cn(
                  "stroke-[2]",
                  isRoot
                    ? "fill-emerald-500/15 stroke-emerald-400"
                    : "fill-background stroke-foreground/35",
                )}
              />
              <text
                x={positions[i].x}
                y={positions[i].y}
                textAnchor="middle"
                dominantBaseline="central"
                className={cn(
                  "text-[11px] font-mono font-medium",
                  isRoot ? "fill-emerald-400" : "fill-foreground/70",
                )}
              >
                {val}
              </text>
              {/* Index label */}
              <text
                x={positions[i].x}
                y={positions[i].y + nodeRadius + 12}
                textAnchor="middle"
                className="fill-foreground/20 text-[8px] font-mono"
              >
                [{i}]
              </text>
            </g>
          );
        })}
      </SVGCanvas>

      {/* Array view */}
      <div className="flex items-center gap-1 text-xs font-mono">
        <span className="text-muted-foreground mr-1">Array:</span>
        {heap.map((val, i) => (
          <span
            key={`arr-${i}`}
            className={cn(
              "px-1.5 py-0.5 rounded border",
              i === 0 ? "border-emerald-400/40 text-emerald-400" : "border-foreground/15 text-foreground/60",
            )}
          >
            {val}
          </span>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && insert()}
          placeholder="Value"
          className="w-20 px-2 py-1 text-sm font-mono rounded border border-foreground/20 bg-transparent text-foreground"
        />
        <button type="button" onClick={insert} disabled={!inputVal.trim()}
          className="px-3 py-1 text-sm font-mono rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 disabled:opacity-30 transition-colors">
          Insert
        </button>
        <button type="button" onClick={extractRoot} disabled={heap.length === 0}
          className="px-3 py-1 text-sm font-mono rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-30 transition-colors">
          Extract {isMax ? "Max" : "Min"}
        </button>
      </div>

      <div className="text-xs font-mono text-muted-foreground">
        {isMax ? "Max" : "Min"}-Heap · {heap.length} elements
        {lastAction && <span className="ml-2 text-primary">{lastAction}</span>}
      </div>
    </div>
  );
}
