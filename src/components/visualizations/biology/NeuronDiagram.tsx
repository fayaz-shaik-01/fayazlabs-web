"use client";

import { useState } from "react";
import SVGCanvas from "../common/SVGCanvas";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────

interface NeuronDiagramProps {
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly highlightPart?: string;
  readonly showLabels?: boolean;
  readonly interactive?: boolean;
}

interface NeuronPart {
  id: string;
  label: string;
  description: string;
  color: string;
}

const PARTS: NeuronPart[] = [
  { id: "dendrites", label: "Dendrites", description: "Receive signals from other neurons", color: "#22c55e" },
  { id: "soma", label: "Cell Body (Soma)", description: "Contains nucleus; integrates incoming signals", color: "#3b82f6" },
  { id: "axon-hillock", label: "Axon Hillock", description: "Trigger zone — initiates action potential", color: "#f59e0b" },
  { id: "axon", label: "Axon", description: "Conducts electrical impulse away from soma", color: "#8b5cf6" },
  { id: "myelin", label: "Myelin Sheath", description: "Insulates axon for faster signal propagation", color: "#06b6d4" },
  { id: "node-ranvier", label: "Node of Ranvier", description: "Gaps in myelin — enable saltatory conduction", color: "#ef4444" },
  { id: "axon-terminal", label: "Axon Terminal", description: "Releases neurotransmitters to next neuron", color: "#ec4899" },
];

// ── Component ───────────────────────────────────────────────────────────

export default function NeuronDiagram({
  width = 700,
  height = 300,
  title,
  highlightPart,
  showLabels = true,
  interactive = true,
}: NeuronDiagramProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const active = hovered ?? highlightPart ?? null;
  const activePart = PARTS.find((p) => p.id === active);

  const handleHover = (id: string | null) => {
    if (interactive) setHovered(id);
  };

  // Layout: left to right: dendrites → soma → axon hillock → axon with myelin → terminal
  const somaX = 140;
  const somaY = height / 2;
  const somaR = 40;

  return (
    <div className="flex flex-col gap-2">
      {title && <div className="text-center text-sm font-medium text-muted-foreground">{title}</div>}

      <SVGCanvas width={width} height={height} padding={10}>
        {/* Dendrites — branching lines on left */}
        <g
          onMouseEnter={() => handleHover("dendrites")}
          onMouseLeave={() => handleHover(null)}
          className={interactive ? "cursor-pointer" : undefined}
        >
          {[
            { x1: 20, y1: somaY - 60, x2: somaX - somaR, y2: somaY - 10 },
            { x1: 10, y1: somaY - 30, x2: somaX - somaR, y2: somaY - 5 },
            { x1: 15, y1: somaY, x2: somaX - somaR, y2: somaY },
            { x1: 10, y1: somaY + 30, x2: somaX - somaR, y2: somaY + 5 },
            { x1: 20, y1: somaY + 60, x2: somaX - somaR, y2: somaY + 10 },
          ].map((d, i) => (
            <line
              key={`dendrite-${i}`}
              x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}
              strokeWidth={3}
              strokeLinecap="round"
              stroke={active === "dendrites" ? "#22c55e" : "currentColor"}
              className={active === "dendrites" ? "" : "text-foreground/30"}
            />
          ))}
          {/* Small end-bumps */}
          {[
            { cx: 18, cy: somaY - 62 },
            { cx: 8, cy: somaY - 32 },
            { cx: 13, cy: somaY },
            { cx: 8, cy: somaY + 32 },
            { cx: 18, cy: somaY + 62 },
          ].map((d, i) => (
            <circle key={`bump-${i}`} cx={d.cx} cy={d.cy} r={3}
              fill={active === "dendrites" ? "#22c55e" : "currentColor"}
              className={active === "dendrites" ? "" : "text-foreground/20"}
            />
          ))}
          {showLabels && (
            <text x={15} y={somaY - 75} className="fill-foreground/50 text-[9px] font-mono">Dendrites</text>
          )}
        </g>

        {/* Cell Body (Soma) */}
        <g
          onMouseEnter={() => handleHover("soma")}
          onMouseLeave={() => handleHover(null)}
          className={interactive ? "cursor-pointer" : undefined}
        >
          <ellipse cx={somaX} cy={somaY} rx={somaR} ry={somaR * 0.85}
            className={cn(
              "stroke-[2] transition-colors",
              active === "soma" ? "fill-blue-500/15 stroke-blue-400" : "fill-transparent stroke-foreground/30",
            )}
          />
          {/* Nucleus */}
          <circle cx={somaX} cy={somaY} r={14}
            className={cn(
              "stroke-[1.5]",
              active === "soma" ? "fill-blue-500/25 stroke-blue-300" : "fill-foreground/5 stroke-foreground/15",
            )}
          />
          {showLabels && (
            <text x={somaX} y={somaY - somaR - 8} textAnchor="middle" className="fill-foreground/50 text-[9px] font-mono">Soma</text>
          )}
        </g>

        {/* Axon Hillock */}
        {(() => {
          const hx = somaX + somaR + 5;
          const hw = 18;
          return (
            <g
              onMouseEnter={() => handleHover("axon-hillock")}
              onMouseLeave={() => handleHover(null)}
              className={interactive ? "cursor-pointer" : undefined}
            >
              <polygon
                points={`${hx},${somaY - 15} ${hx + hw},${somaY - 8} ${hx + hw},${somaY + 8} ${hx},${somaY + 15}`}
                className={cn(
                  "stroke-[1.5]",
                  active === "axon-hillock" ? "fill-amber-500/15 stroke-amber-400" : "fill-transparent stroke-foreground/25",
                )}
              />
              {showLabels && (
                <text x={hx + hw / 2} y={somaY + 28} textAnchor="middle" className="fill-foreground/50 text-[8px] font-mono">Hillock</text>
              )}
            </g>
          );
        })()}

        {/* Axon with Myelin Sheaths */}
        {(() => {
          const axonStart = somaX + somaR + 25;
          const axonEnd = width - 100;
          const axonY = somaY;
          const segments = 4;
          const segLen = (axonEnd - axonStart) / segments;
          const myelinH = 18;
          const gapW = 8;

          return (
            <g>
              {/* Axon line */}
              <line
                x1={axonStart} y1={axonY} x2={axonEnd} y2={axonY}
                strokeWidth={2}
                onMouseEnter={() => handleHover("axon")}
                onMouseLeave={() => handleHover(null)}
                className={cn(
                  interactive ? "cursor-pointer" : undefined,
                  active === "axon" ? "stroke-purple-400" : "stroke-foreground/25",
                )}
              />

              {/* Myelin segments */}
              {Array.from({ length: segments }, (_, i) => {
                const sx = axonStart + i * segLen + gapW / 2;
                const sw = segLen - gapW;
                return (
                  <g key={`myelin-${i}`}>
                    <rect
                      x={sx} y={axonY - myelinH / 2} width={sw} height={myelinH}
                      rx={myelinH / 2}
                      onMouseEnter={() => handleHover("myelin")}
                      onMouseLeave={() => handleHover(null)}
                      className={cn(
                        "stroke-[1.5] transition-colors",
                        interactive ? "cursor-pointer" : undefined,
                        active === "myelin" ? "fill-cyan-500/15 stroke-cyan-400" : "fill-foreground/5 stroke-foreground/15",
                      )}
                    />
                    {/* Node of Ranvier (gap) */}
                    {i < segments - 1 && (
                      <circle
                        cx={sx + sw + gapW / 2} cy={axonY} r={3}
                        onMouseEnter={() => handleHover("node-ranvier")}
                        onMouseLeave={() => handleHover(null)}
                        className={cn(
                          interactive ? "cursor-pointer" : undefined,
                          active === "node-ranvier" ? "fill-red-400" : "fill-foreground/30",
                        )}
                      />
                    )}
                  </g>
                );
              })}

              {showLabels && (
                <>
                  <text x={(axonStart + axonEnd) / 2} y={axonY - myelinH / 2 - 8} textAnchor="middle" className="fill-foreground/50 text-[9px] font-mono">Myelin Sheath</text>
                  <text x={(axonStart + axonEnd) / 2} y={axonY + myelinH / 2 + 14} textAnchor="middle" className="fill-foreground/50 text-[9px] font-mono">Axon</text>
                </>
              )}
            </g>
          );
        })()}

        {/* Axon Terminal */}
        {(() => {
          const tx = width - 90;
          const ty = somaY;
          return (
            <g
              onMouseEnter={() => handleHover("axon-terminal")}
              onMouseLeave={() => handleHover(null)}
              className={interactive ? "cursor-pointer" : undefined}
            >
              {[0, -20, 20, -35, 35].map((dy, i) => (
                <g key={`terminal-${i}`}>
                  <line
                    x1={tx} y1={ty}
                    x2={tx + 40} y2={ty + dy}
                    strokeWidth={2}
                    stroke={active === "axon-terminal" ? "#ec4899" : "currentColor"}
                    className={active === "axon-terminal" ? "" : "text-foreground/25"}
                  />
                  <circle
                    cx={tx + 42} cy={ty + dy} r={5}
                    className={cn(
                      active === "axon-terminal" ? "fill-pink-500/30 stroke-pink-400" : "fill-foreground/10 stroke-foreground/20",
                    )}
                    strokeWidth={1.5}
                  />
                </g>
              ))}
              {showLabels && (
                <text x={tx + 42} y={ty + 52} textAnchor="middle" className="fill-foreground/50 text-[9px] font-mono">Terminal</text>
              )}
            </g>
          );
        })()}

        {/* Signal flow arrow */}
        <defs>
          <marker id="neuron-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0,0 8,3 0,6" className="fill-foreground/20" />
          </marker>
        </defs>
        <line
          x1={somaX - somaR - 20} y1={height - 20}
          x2={width - 60} y2={height - 20}
          className="stroke-foreground/10 stroke-[1]"
          markerEnd="url(#neuron-arrow)"
        />
        <text x={(width) / 2} y={height - 8} textAnchor="middle" className="fill-foreground/20 text-[8px] font-mono italic">
          Signal flow →
        </text>
      </SVGCanvas>

      {/* Info panel */}
      {interactive && (
        <div className="h-12 flex items-center justify-center text-center px-4">
          {activePart ? (
            <div>
              <span className="text-sm font-medium" style={{ color: activePart.color }}>
                {activePart.label}
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                {activePart.description}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">Hover over a part to learn more</span>
          )}
        </div>
      )}
    </div>
  );
}
