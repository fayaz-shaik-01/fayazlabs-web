"use client";

import { useMemo, useState, useCallback } from "react";
import SVGCanvas from "../common/SVGCanvas";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────

interface TreeNode {
  id: string;
  label: string;
  type?: "decision" | "chance" | "outcome";
  value?: string | number;
  highlight?: boolean;
  children?: TreeNode[];
  edgeLabel?: string;
  probability?: number;
}

interface DecisionTreeProps {
  readonly root: TreeNode;
  readonly title?: string;
  readonly width?: number;
  readonly height?: number;
  readonly nodeWidth?: number;
  readonly nodeHeight?: number;
  readonly levelGap?: number;
  readonly siblingGap?: number;
}

// ── Layout computation ──────────────────────────────────────────────────

interface LayoutNode {
  node: TreeNode;
  x: number;
  y: number;
  children: LayoutNode[];
}

function countLeaves(node: TreeNode): number {
  if (!node.children || node.children.length === 0) return 1;
  return node.children.reduce((sum, c) => sum + countLeaves(c), 0);
}

function computeLayout(
  node: TreeNode,
  depth: number,
  xStart: number,
  levelGap: number,
  siblingGap: number,
): LayoutNode {
  const y = depth * levelGap + 40;

  if (!node.children || node.children.length === 0) {
    return { node, x: xStart, y, children: [] };
  }

  const childLayouts: LayoutNode[] = [];
  let cursor = xStart;

  for (const child of node.children) {
    const leafCount = countLeaves(child);
    const childWidth = leafCount * siblingGap;
    const childLayout = computeLayout(child, depth + 1, cursor, levelGap, siblingGap);
    childLayouts.push(childLayout);
    cursor += childWidth;
  }

  const firstChild = childLayouts[0];
  const lastChild = childLayouts.at(-1)!;
  const x = (firstChild.x + lastChild.x) / 2;

  return { node, x, y, children: childLayouts };
}

// ── Node renderers ──────────────────────────────────────────────────────

function DecisionNodeShape({ x, y, w, h, highlight }: {
  readonly x: number; readonly y: number;
  readonly w: number; readonly h: number;
  readonly highlight?: boolean;
}) {
  return (
    <rect
      x={x - w / 2}
      y={y - h / 2}
      width={w}
      height={h}
      rx={4}
      className={cn(
        "fill-transparent stroke-current stroke-[1.5]",
        highlight ? "stroke-primary stroke-[2.5]" : "stroke-foreground/60",
      )}
    />
  );
}

function ChanceNodeShape({ x, y, r, highlight }: {
  readonly x: number; readonly y: number;
  readonly r: number;
  readonly highlight?: boolean;
}) {
  return (
    <circle
      cx={x}
      cy={y}
      r={r}
      className={cn(
        "fill-transparent stroke-current stroke-[1.5]",
        highlight ? "stroke-primary stroke-[2.5]" : "stroke-foreground/60",
      )}
    />
  );
}

function OutcomeNodeShape({ x, y, w, h, highlight }: {
  readonly x: number; readonly y: number;
  readonly w: number; readonly h: number;
  readonly highlight?: boolean;
}) {
  return (
    <polygon
      points={`${x},${y - h / 2} ${x + w / 2},${y} ${x},${y + h / 2} ${x - w / 2},${y}`}
      className={cn(
        "fill-transparent stroke-current stroke-[1.5]",
        highlight ? "stroke-primary stroke-[2.5]" : "stroke-foreground/60",
      )}
    />
  );
}

// ── Recursive renderer ──────────────────────────────────────────────────

function RenderNode({
  layoutNode,
  nodeWidth,
  nodeHeight,
  selectedId,
  onSelect,
}: {
  readonly layoutNode: LayoutNode;
  readonly nodeWidth: number;
  readonly nodeHeight: number;
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
}) {
  const { node, x, y, children } = layoutNode;
  const nodeType = node.type ?? "decision";

  return (
    <g>
      {/* Edges to children */}
      {children.map((child) => (
        <g key={`edge-${node.id}-${child.node.id}`}>
          <line
            x1={x}
            y1={y + nodeHeight / 2}
            x2={child.x}
            y2={child.y - nodeHeight / 2}
            className="stroke-foreground/30 stroke-[1.2]"
          />
          {child.node.edgeLabel && (
            <text
              x={(x + child.x) / 2 - 4}
              y={(y + nodeHeight / 2 + child.y - nodeHeight / 2) / 2}
              className="fill-foreground/50 text-[9px] font-mono"
              textAnchor="end"
            >
              {child.node.edgeLabel}
            </text>
          )}
          {child.node.probability !== undefined && (
            <text
              x={(x + child.x) / 2 + 4}
              y={(y + nodeHeight / 2 + child.y - nodeHeight / 2) / 2}
              className="fill-primary/70 text-[9px] font-mono"
              textAnchor="start"
            >
              p={child.node.probability}
            </text>
          )}
        </g>
      ))}

      {/* Clickable hit area */}
      <rect
        x={x - nodeWidth / 2}
        y={y - nodeHeight / 2}
        width={nodeWidth}
        height={nodeHeight}
        fill="transparent"
        className="cursor-pointer"
        onClick={() => onSelect(node.id)}
      />

      {/* Node shape */}
      {nodeType === "decision" && (
        <DecisionNodeShape x={x} y={y} w={nodeWidth} h={nodeHeight} highlight={node.id === selectedId || node.highlight} />
      )}
      {nodeType === "chance" && (
        <ChanceNodeShape x={x} y={y} r={nodeHeight / 2} highlight={node.id === selectedId || node.highlight} />
      )}
      {nodeType === "outcome" && (
        <OutcomeNodeShape x={x} y={y} w={nodeWidth} h={nodeHeight} highlight={node.id === selectedId || node.highlight} />
      )}

      {/* Label */}
      <text
        x={x}
        y={node.value !== undefined ? y - 4 : y}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground text-[10px] font-mono"
      >
        {node.label}
      </text>

      {/* Value */}
      {node.value !== undefined && (
        <text
          x={x}
          y={y + 8}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-muted-foreground text-[8px] font-mono"
        >
          {node.value}
        </text>
      )}

      {/* Recurse children */}
      {children.map((child) => (
        <RenderNode
          key={child.node.id}
          layoutNode={child}
          nodeWidth={nodeWidth}
          nodeHeight={nodeHeight}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </g>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

function findNode(node: TreeNode, id: string): TreeNode | null {
  if (node.id === id) return node;
  for (const child of node.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

function updateNode(node: TreeNode, id: string, patch: Partial<TreeNode>): TreeNode {
  if (node.id === id) return { ...node, ...patch };
  if (!node.children) return node;
  return {
    ...node,
    children: node.children.map((c) => updateNode(c, id, patch)),
  };
}

export default function DecisionTree({
  root: initialRoot,
  title,
  width = 800,
  height = 500,
  nodeWidth = 80,
  nodeHeight = 36,
  levelGap = 90,
  siblingGap = 100,
}: DecisionTreeProps) {
  const [root, setRoot] = useState(initialRoot);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const selectedNode = selectedId ? findNode(root, selectedId) : null;

  const handleProbChange = useCallback(
    (val: string) => {
      if (!selectedId) return;
      const num = Number.parseFloat(val);
      if (!Number.isNaN(num)) setRoot((r) => updateNode(r, selectedId, { probability: num }));
    },
    [selectedId],
  );

  const handleValueChange = useCallback(
    (val: string) => {
      if (!selectedId) return;
      const num = Number.parseFloat(val);
      setRoot((r) => updateNode(r, selectedId, { value: Number.isNaN(num) ? val : num }));
    },
    [selectedId],
  );

  const layout = useMemo(
    () => computeLayout(root, 0, width / 2, levelGap, siblingGap),
    [root, width, levelGap, siblingGap],
  );

  return (
    <div className="flex flex-col gap-2">
      {title && (
        <div className="text-center text-sm font-medium text-muted-foreground">{title}</div>
      )}
      <SVGCanvas width={width} height={height} padding={30}>
        <RenderNode
          layoutNode={layout}
          nodeWidth={nodeWidth}
          nodeHeight={nodeHeight}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </SVGCanvas>

      {/* Edit panel */}
      {selectedNode && (
        <div className="flex items-center justify-center gap-4 text-xs border-t border-white/[0.06] pt-3">
          <span className="font-mono text-muted-foreground font-medium">{selectedNode.label}</span>
          {selectedNode.probability !== undefined && (
            <label className="flex items-center gap-1">
              <span className="text-muted-foreground">P:</span>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={selectedNode.probability}
                onChange={(e) => handleProbChange(e.target.value)}
                className="w-16 px-1.5 py-0.5 text-xs font-mono rounded bg-white/[0.06] border border-white/[0.08] text-foreground focus:outline-none focus:border-primary"
              />
            </label>
          )}
          {selectedNode.value !== undefined && (
            <label className="flex items-center gap-1">
              <span className="text-muted-foreground">Val:</span>
              <input
                type="text"
                value={String(selectedNode.value)}
                onChange={(e) => handleValueChange(e.target.value)}
                className="w-20 px-1.5 py-0.5 text-xs font-mono rounded bg-white/[0.06] border border-white/[0.08] text-foreground focus:outline-none focus:border-primary"
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}
