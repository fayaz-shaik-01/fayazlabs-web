"use client";

import React, { useMemo, useState, useCallback } from "react";
import SVGCanvas from "../common/SVGCanvas";
import { ParameterSlider } from "../common/ParameterSlider";

// ── Types ───────────────────────────────────────────────────────────────

interface TrussNode {
  id: string;
  x: number;
  y: number;
  fixed?: boolean;
  roller?: boolean;
  label?: string;
}

interface TrussMember {
  from: string;
  to: string;
  force?: number; // positive = tension, negative = compression
  label?: string;
}

interface ExternalForce {
  nodeId: string;
  fx?: number;
  fy?: number;
  label?: string;
}

interface TrussVisualizerProps {
  readonly nodes: TrussNode[];
  readonly members: TrussMember[];
  readonly externalForces?: ExternalForce[];
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly showForceValues?: boolean;
  readonly arrowScale?: number;
}

// ── Component ───────────────────────────────────────────────────────────

export default function TrussVisualizer({
  nodes,
  members,
  externalForces: initialForces = [],
  width = 600,
  height = 350,
  title,
  showForceValues = true,
  arrowScale = 0.5,
}: TrussVisualizerProps) {
  const [externalForces, setExternalForces] = useState(initialForces);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const nodeMap = useMemo(() => {
    const map: Record<string, TrussNode> = {};
    for (const n of nodes) map[n.id] = n;
    return map;
  }, [nodes]);

  const handleSelectForce = useCallback((idx: number) => {
    setSelectedIdx((prev) => (prev === idx ? null : idx));
  }, []);

  const handleFxChange = useCallback(
    (v: number) => {
      if (selectedIdx === null) return;
      setExternalForces((prev) =>
        prev.map((f, i) => (i === selectedIdx ? { ...f, fx: v } : f)),
      );
    },
    [selectedIdx],
  );

  const handleFyChange = useCallback(
    (v: number) => {
      if (selectedIdx === null) return;
      setExternalForces((prev) =>
        prev.map((f, i) => (i === selectedIdx ? { ...f, fy: v } : f)),
      );
    },
    [selectedIdx],
  );

  const handleRemoveForce = useCallback(() => {
    if (selectedIdx === null) return;
    setExternalForces((prev) => prev.filter((_, i) => i !== selectedIdx));
    setSelectedIdx(null);
  }, [selectedIdx]);

  const handleAddForce = useCallback(() => {
    const firstFreeNode = nodes.find(
      (n) => !n.fixed && !n.roller && !externalForces.some((ef) => ef.nodeId === n.id),
    );
    if (!firstFreeNode) return;
    setExternalForces((prev) => [
      ...prev,
      { nodeId: firstFreeNode.id, fy: -50, label: `F${prev.length + 1}` },
    ]);
  }, [nodes, externalForces]);

  const selectedForce = selectedIdx !== null ? externalForces[selectedIdx] : null;

  return (
    <div className="flex flex-col gap-3">
      {title && (
        <div className="text-center text-sm font-medium text-muted-foreground">{title}</div>
      )}

      <SVGCanvas width={width} height={height} padding={30}>
        {/* Members */}
        {members.map((m) => {
          const a = nodeMap[m.from];
          const b = nodeMap[m.to];
          if (!a || !b) return null;

          let color = "stroke-foreground/40";
          if (m.force !== undefined) {
            color = m.force > 0 ? "stroke-blue-400" : m.force < 0 ? "stroke-red-400" : "stroke-foreground/30";
          }

          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;

          return (
            <g key={`${m.from}-${m.to}`}>
              <line
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                className={`${color} stroke-[2.5]`}
              />
              {showForceValues && m.force !== undefined && (
                <text
                  x={midX}
                  y={midY - 8}
                  textAnchor="middle"
                  className="fill-foreground/50 text-[8px] font-mono"
                >
                  {m.label ?? `${Math.abs(m.force).toFixed(1)} ${m.force > 0 ? "T" : "C"}`}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((n) => (
          <g key={n.id}>
            {n.fixed && (
              <g>
                <polygon
                  points={`${n.x},${n.y} ${n.x - 8},${n.y + 14} ${n.x + 8},${n.y + 14}`}
                  className="fill-transparent stroke-foreground/40 stroke-[1.2]"
                />
                <line x1={n.x - 12} y1={n.y + 15} x2={n.x + 12} y2={n.y + 15} className="stroke-foreground/30 stroke-[1]" />
              </g>
            )}
            {n.roller && (
              <g>
                <polygon
                  points={`${n.x},${n.y} ${n.x - 8},${n.y + 12} ${n.x + 8},${n.y + 12}`}
                  className="fill-transparent stroke-foreground/40 stroke-[1.2]"
                />
                <circle cx={n.x} cy={n.y + 16} r={3} className="fill-transparent stroke-foreground/30 stroke-[1]" />
              </g>
            )}
            <circle cx={n.x} cy={n.y} r={4} className="fill-foreground/70" />
            {n.label && (
              <text
                x={n.x}
                y={n.y - 10}
                textAnchor="middle"
                className="fill-foreground/60 text-[10px] font-mono"
              >
                {n.label}
              </text>
            )}
          </g>
        ))}

        {/* External forces */}
        {externalForces.map((ef, efIdx) => {
          const node = nodeMap[ef.nodeId];
          if (!node) return null;
          const arrows: React.ReactNode[] = [];

          if (ef.fx && Math.abs(ef.fx) > 0.01) {
            const len = ef.fx * arrowScale;
            arrows.push(
              <g key={`${ef.nodeId}-fx`}>
                <line
                  x1={node.x} y1={node.y} x2={node.x + len} y2={node.y}
                  className="stroke-amber-400 stroke-[2]"
                  markerEnd="url(#arrowhead)"
                />
                <text x={node.x + len + 8} y={node.y} className="fill-amber-400 text-[9px] font-mono" dominantBaseline="central">
                  {ef.label ?? `${ef.fx}`}
                </text>
              </g>,
            );
          }

          if (ef.fy && Math.abs(ef.fy) > 0.01) {
            const len = -ef.fy * arrowScale; // SVG y inverted
            arrows.push(
              <g key={`${ef.nodeId}-fy`}>
                <line
                  x1={node.x} y1={node.y} x2={node.x} y2={node.y + len}
                  className="stroke-amber-400 stroke-[2]"
                  markerEnd="url(#arrowhead)"
                />
                <text x={node.x + 8} y={node.y + len} className="fill-amber-400 text-[9px] font-mono" dominantBaseline="central">
                  {ef.label ?? `${ef.fy}`}
                </text>
              </g>,
            );
          }

          return (
            <g key={`ef-${ef.nodeId}-${efIdx}`} onClick={() => handleSelectForce(efIdx)} className="cursor-pointer">
              {arrows}
            </g>
          );
        })}

        {/* Arrowhead marker */}
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0,0 8,3 0,6" fill="#f59e0b" />
          </marker>
        </defs>
      </SVGCanvas>

      {/* Edit panel */}
      {selectedForce && (
        <div className="space-y-2 border-t border-white/[0.06] pt-3">
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="font-mono text-muted-foreground font-medium">
              {selectedForce.label ?? `Force @ ${selectedForce.nodeId}`}
            </span>
            <button
              type="button"
              onClick={handleRemoveForce}
              className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <ParameterSlider label="Fx" min={-200} max={200} step={5} value={selectedForce.fx ?? 0} onChange={handleFxChange} />
            <ParameterSlider label="Fy" min={-200} max={200} step={5} value={selectedForce.fy ?? 0} onChange={handleFyChange} />
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs font-mono text-muted-foreground">
        <span className="text-blue-400">— Tension (T)</span>
        <span className="text-red-400">— Compression (C)</span>
        <span className="text-amber-400">→ External Force</span>
        <button
          type="button"
          onClick={handleAddForce}
          className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
        >
          + Force
        </button>
      </div>
    </div>
  );
}
