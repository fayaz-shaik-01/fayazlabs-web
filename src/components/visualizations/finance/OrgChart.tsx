"use client";

import { useState } from "react";
import SVGCanvas from "../common/SVGCanvas";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────

interface OrgNode {
  id: string;
  label: string;
  description?: string;
  children?: OrgNode[];
  highlight?: boolean;
  color?: string;
}

interface OrgChartProps {
  readonly root: OrgNode;
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly interactive?: boolean;
  readonly nodeWidth?: number;
  readonly nodeHeight?: number;
  readonly levelGap?: number;
}

// ── Layout ──────────────────────────────────────────────────────────────

interface LayoutNode {
  node: OrgNode;
  x: number;
  y: number;
  width: number;
  children: LayoutNode[];
}

function countLeaves(node: OrgNode): number {
  if (!node.children || node.children.length === 0) return 1;
  return node.children.reduce((sum, c) => sum + countLeaves(c), 0);
}

function layoutOrg(
  node: OrgNode,
  depth: number,
  xStart: number,
  nodeW: number,
  nodeH: number,
  levelGap: number,
  gap: number,
): LayoutNode {
  const leaves = countLeaves(node);
  const totalWidth = leaves * (nodeW + gap) - gap;
  const y = 30 + depth * (nodeH + levelGap);

  if (!node.children || node.children.length === 0) {
    return {
      node,
      x: xStart + totalWidth / 2,
      y,
      width: totalWidth,
      children: [],
    };
  }

  let currentX = xStart;
  const children: LayoutNode[] = [];

  for (const child of node.children) {
    const childLeaves = countLeaves(child);
    const childWidth = childLeaves * (nodeW + gap) - gap;
    children.push(layoutOrg(child, depth + 1, currentX, nodeW, nodeH, levelGap, gap));
    currentX += childWidth + gap;
  }

  return {
    node,
    x: xStart + totalWidth / 2,
    y,
    width: totalWidth,
    children,
  };
}

// ── Render ───────────────────────────────────────────────────────────────

function RenderOrgNode({
  layout,
  nodeW,
  nodeH,
  interactive,
  hovered,
  setHovered,
}: {
  readonly layout: LayoutNode;
  readonly nodeW: number;
  readonly nodeH: number;
  readonly interactive: boolean;
  readonly hovered: string | null;
  readonly setHovered: (id: string | null) => void;
}) {
  const isHl = layout.node.highlight || hovered === layout.node.id;
  const color = layout.node.color ?? "#3b82f6";

  return (
    <g>
      {/* Edges to children */}
      {layout.children.map((child) => (
        <path
          key={`edge-${child.node.id}`}
          d={`M ${layout.x} ${layout.y + nodeH} L ${layout.x} ${layout.y + nodeH + 15} L ${child.x} ${child.y - 15} L ${child.x} ${child.y}`}
          className="fill-none stroke-foreground/15 stroke-[1.5]"
        />
      ))}

      {/* Node box */}
      <g
        onMouseEnter={() => interactive && setHovered(layout.node.id)}
        onMouseLeave={() => interactive && setHovered(null)}
        className={interactive ? "cursor-pointer" : undefined}
      >
        <rect
          x={layout.x - nodeW / 2}
          y={layout.y}
          width={nodeW}
          height={nodeH}
          rx={6}
          stroke={isHl ? color : "currentColor"}
          strokeWidth={isHl ? 2 : 1}
          strokeOpacity={isHl ? 0.7 : 0.15}
          fill={isHl ? color : "transparent"}
          fillOpacity={isHl ? 0.1 : 0}
          className="transition-colors"
        />
        <text
          x={layout.x}
          y={layout.y + nodeH / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={isHl ? color : "currentColor"}
          className={cn(
            "text-[10px] font-mono font-medium",
            !isHl && "text-foreground/60",
          )}
        >
          {layout.node.label}
        </text>
      </g>

      {/* Recurse */}
      {layout.children.map((child) => (
        <RenderOrgNode
          key={child.node.id}
          layout={child}
          nodeW={nodeW}
          nodeH={nodeH}
          interactive={interactive}
          hovered={hovered}
          setHovered={setHovered}
        />
      ))}
    </g>
  );
}

// ── Component ───────────────────────────────────────────────────────────

export default function OrgChart({
  root,
  width = 700,
  height = 400,
  title,
  interactive = true,
  nodeWidth = 110,
  nodeHeight = 32,
  levelGap = 50,
}: OrgChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const layout = layoutOrg(root, 0, 20, nodeWidth, nodeHeight, levelGap, 12);
  const dynamicWidth = Math.max(width, layout.width + 60);

  const hoveredNode = hovered
    ? (function find(n: OrgNode): OrgNode | null {
        if (n.id === hovered) return n;
        for (const c of n.children ?? []) {
          const f = find(c);
          if (f) return f;
        }
        return null;
      })(root)
    : null;

  return (
    <div className="flex flex-col gap-2 items-center">
      {title && <div className="text-sm font-medium text-muted-foreground">{title}</div>}

      <div className="overflow-x-auto w-full">
        <SVGCanvas width={dynamicWidth} height={height} padding={10}>
          <RenderOrgNode
            layout={layout}
            nodeW={nodeWidth}
            nodeH={nodeHeight}
            interactive={interactive}
            hovered={hovered}
            setHovered={setHovered}
          />
        </SVGCanvas>
      </div>

      {interactive && (
        <div className="h-8 flex items-center justify-center">
          {hoveredNode?.description ? (
            <span className="text-xs text-muted-foreground">{hoveredNode.description}</span>
          ) : (
            <span className="text-xs text-muted-foreground italic">Hover over a node to see its description</span>
          )}
        </div>
      )}
    </div>
  );
}
