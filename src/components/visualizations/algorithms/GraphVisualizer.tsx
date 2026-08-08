"use client";

import { useState, useMemo, useCallback } from "react";
import SVGCanvas from "../common/SVGCanvas";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  label?: string;
  x: number;
  y: number;
  highlight?: boolean;
  color?: string;
}

interface GraphEdge {
  from: string;
  to: string;
  weight?: number;
  directed?: boolean;
  highlight?: boolean;
  label?: string;
}

interface GraphVisualizerProps {
  readonly nodes: GraphNode[];
  readonly edges: GraphEdge[];
  readonly directed?: boolean;
  readonly weighted?: boolean;
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly nodeRadius?: number;
  readonly highlightPath?: string[];
  readonly interactive?: boolean;
}

// ── Component ───────────────────────────────────────────────────────────

export default function GraphVisualizer({
  nodes,
  edges,
  directed = false,
  weighted = false,
  width = 600,
  height = 400,
  title,
  nodeRadius = 20,
  highlightPath = [],
  interactive = false,
}: GraphVisualizerProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const handleNodeClick = useCallback(
    (id: string) => {
      if (!interactive) return;
      setSelectedNode((prev) => (prev === id ? null : id));
    },
    [interactive],
  );

  const nodeMap = useMemo(() => {
    const map: Record<string, GraphNode> = {};
    for (const n of nodes) map[n.id] = n;
    return map;
  }, [nodes]);

  const highlightSet = useMemo(() => new Set(highlightPath), [highlightPath]);

  const highlightEdgeSet = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < highlightPath.length - 1; i++) {
      set.add(`${highlightPath[i]}-${highlightPath[i + 1]}`);
      if (!directed) set.add(`${highlightPath[i + 1]}-${highlightPath[i]}`);
    }
    return set;
  }, [highlightPath, directed]);

  return (
    <div className="flex flex-col gap-2">
      {title && (
        <div className="text-center text-sm font-medium text-muted-foreground">{title}</div>
      )}

      <SVGCanvas width={width} height={height} padding={30}>
        <defs>
          <marker id="graph-arrow" markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto">
            <polygon points="0,0 10,4 0,8" className="fill-foreground/40" />
          </marker>
          <marker id="graph-arrow-hl" markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto">
            <polygon points="0,0 10,4 0,8" fill="#3b82f6" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((edge) => {
          const a = nodeMap[edge.from];
          const b = nodeMap[edge.to];
          if (!a || !b) return null;

          const isHl = edge.highlight || highlightEdgeSet.has(`${edge.from}-${edge.to}`);
          const isDir = edge.directed ?? directed;

          // Shorten line to not overlap nodes
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy);
          const ux = dx / dist;
          const uy = dy / dist;
          const x1 = a.x + ux * nodeRadius;
          const y1 = a.y + uy * nodeRadius;
          const x2 = b.x - ux * (nodeRadius + (isDir ? 6 : 0));
          const y2 = b.y - uy * (nodeRadius + (isDir ? 6 : 0));

          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;

          return (
            <g key={`${edge.from}-${edge.to}`}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                className={cn(
                  "stroke-[1.8]",
                  isHl ? "stroke-blue-400" : "stroke-foreground/30",
                )}
                markerEnd={isDir ? (isHl ? "url(#graph-arrow-hl)" : "url(#graph-arrow)") : undefined}
              />
              {weighted && edge.weight !== undefined && (
                <text
                  x={midX}
                  y={midY - 8}
                  textAnchor="middle"
                  className={cn(
                    "text-[9px] font-mono",
                    isHl ? "fill-blue-400" : "fill-foreground/40",
                  )}
                >
                  {edge.label ?? edge.weight}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const isHl = node.highlight || highlightSet.has(node.id);
          const isSel = selectedNode === node.id;

          return (
            <g
              key={node.id}
              onClick={() => handleNodeClick(node.id)}
              className={interactive ? "cursor-pointer" : undefined}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeRadius}
                className={cn(
                  "stroke-[2] transition-colors",
                  isHl
                    ? "fill-blue-500/20 stroke-blue-400"
                    : isSel
                      ? "fill-primary/10 stroke-primary"
                      : "fill-background stroke-foreground/40",
                )}
              />
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="central"
                className={cn(
                  "text-[11px] font-mono font-medium",
                  isHl ? "fill-blue-400" : "fill-foreground/70",
                )}
              >
                {node.label ?? node.id}
              </text>
            </g>
          );
        })}
      </SVGCanvas>
    </div>
  );
}
