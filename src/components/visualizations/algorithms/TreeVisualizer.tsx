"use client";

import { useMemo, useState, useCallback } from "react";
import SVGCanvas from "../common/SVGCanvas";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────

interface TreeNodeData {
  id: string;
  value: string | number;
  left?: TreeNodeData;
  right?: TreeNodeData;
  highlight?: boolean;
  color?: string;
}

interface TreeVisualizerProps {
  readonly root: TreeNodeData;
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly nodeRadius?: number;
  readonly levelGap?: number;
  readonly highlightNodes?: string[];
  readonly showNullLeaves?: boolean;
}

// ── Layout ──────────────────────────────────────────────────────────────

interface LayoutNode {
  node: TreeNodeData;
  x: number;
  y: number;
  left?: LayoutNode;
  right?: LayoutNode;
}

function layoutTree(
  node: TreeNodeData | undefined,
  depth: number,
  xStart: number,
  xEnd: number,
  levelGap: number,
): LayoutNode | undefined {
  if (!node) return undefined;
  const x = (xStart + xEnd) / 2;
  const y = depth * levelGap + 30;
  const left = layoutTree(node.left, depth + 1, xStart, x, levelGap);
  const right = layoutTree(node.right, depth + 1, x, xEnd, levelGap);
  return { node, x, y, left, right };
}

// ── Recursive renderer ──────────────────────────────────────────────────

function RenderTreeNode({
  layout,
  nodeRadius,
  highlightSet,
  showNullLeaves,
  selectedId,
  onSelect,
}: {
  readonly layout: LayoutNode;
  readonly nodeRadius: number;
  readonly highlightSet: Set<string>;
  readonly showNullLeaves: boolean;
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
}) {
  const isHl = layout.node.highlight || highlightSet.has(layout.node.id);
  const isSel = selectedId === layout.node.id;

  return (
    <g>
      {/* Left edge */}
      {layout.left && (
        <line
          x1={layout.x} y1={layout.y + nodeRadius}
          x2={layout.left.x} y2={layout.left.y - nodeRadius}
          className="stroke-foreground/25 stroke-[1.5]"
        />
      )}
      {/* Right edge */}
      {layout.right && (
        <line
          x1={layout.x} y1={layout.y + nodeRadius}
          x2={layout.right.x} y2={layout.right.y - nodeRadius}
          className="stroke-foreground/25 stroke-[1.5]"
        />
      )}

      {/* Null leaves */}
      {showNullLeaves && !layout.left && (layout.right || layout.node.left === undefined) && (
        <g>
          <line
            x1={layout.x} y1={layout.y + nodeRadius}
            x2={layout.x - 25} y2={layout.y + nodeRadius + 25}
            className="stroke-foreground/10 stroke-[1]"
          />
          <text
            x={layout.x - 25} y={layout.y + nodeRadius + 35}
            textAnchor="middle"
            className="fill-foreground/15 text-[8px] font-mono"
          >
            ∅
          </text>
        </g>
      )}
      {showNullLeaves && !layout.right && (layout.left || layout.node.right === undefined) && (
        <g>
          <line
            x1={layout.x} y1={layout.y + nodeRadius}
            x2={layout.x + 25} y2={layout.y + nodeRadius + 25}
            className="stroke-foreground/10 stroke-[1]"
          />
          <text
            x={layout.x + 25} y={layout.y + nodeRadius + 35}
            textAnchor="middle"
            className="fill-foreground/15 text-[8px] font-mono"
          >
            ∅
          </text>
        </g>
      )}

      {/* Node circle */}
      <g onClick={() => onSelect(layout.node.id)} className="cursor-pointer">
        <circle
          cx={layout.x}
          cy={layout.y}
          r={nodeRadius}
          className={cn(
            "stroke-[2] transition-colors",
            isSel
              ? "fill-emerald-500/20 stroke-emerald-400"
              : isHl
                ? "fill-blue-500/20 stroke-blue-400"
                : "fill-background stroke-foreground/40",
          )}
        />
        <text
          x={layout.x}
          y={layout.y}
          textAnchor="middle"
          dominantBaseline="central"
          className={cn(
            "text-[11px] font-mono font-medium pointer-events-none",
            isSel ? "fill-emerald-400" : isHl ? "fill-blue-400" : "fill-foreground/70",
          )}
        >
          {layout.node.value}
        </text>
      </g>

      {/* Recurse */}
      {layout.left && (
        <RenderTreeNode layout={layout.left} nodeRadius={nodeRadius} highlightSet={highlightSet} showNullLeaves={showNullLeaves} selectedId={selectedId} onSelect={onSelect} />
      )}
      {layout.right && (
        <RenderTreeNode layout={layout.right} nodeRadius={nodeRadius} highlightSet={highlightSet} showNullLeaves={showNullLeaves} selectedId={selectedId} onSelect={onSelect} />
      )}
    </g>
  );
}

// ── Component ───────────────────────────────────────────────────────────

// ── Tree helpers ─────────────────────────────────────────────────────

function findTreeNode(node: TreeNodeData | undefined, id: string): TreeNodeData | null {
  if (!node) return null;
  if (node.id === id) return node;
  return findTreeNode(node.left, id) ?? findTreeNode(node.right, id);
}

function updateTreeNode(
  node: TreeNodeData | undefined,
  id: string,
  patch: Partial<TreeNodeData>,
): TreeNodeData | undefined {
  if (!node) return undefined;
  if (node.id === id) return { ...node, ...patch };
  return {
    ...node,
    left: updateTreeNode(node.left, id, patch),
    right: updateTreeNode(node.right, id, patch),
  };
}

function deleteTreeNode(
  node: TreeNodeData | undefined,
  id: string,
): TreeNodeData | undefined {
  if (!node) return undefined;
  if (node.id === id) return undefined;
  return {
    ...node,
    left: deleteTreeNode(node.left, id),
    right: deleteTreeNode(node.right, id),
  };
}

let nextId = 100;

export default function TreeVisualizer({
  root: initialRoot,
  width = 600,
  height = 400,
  title,
  nodeRadius = 18,
  levelGap = 70,
  highlightNodes = [],
  showNullLeaves = false,
}: TreeVisualizerProps) {
  const [root, setRoot] = useState(initialRoot);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const highlightSet = useMemo(() => new Set(highlightNodes), [highlightNodes]);

  const layout = useMemo(
    () => layoutTree(root, 0, 30, width - 30, levelGap),
    [root, width, levelGap],
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const selectedNode = selectedId ? findTreeNode(root, selectedId) : null;

  const handleValueChange = useCallback(
    (val: string) => {
      if (!selectedId) return;
      const num = Number.parseFloat(val);
      setRoot((r) => updateTreeNode(r, selectedId, { value: Number.isNaN(num) ? val : num }) ?? r);
    },
    [selectedId],
  );

  const handleInsertLeft = useCallback(() => {
    if (!selectedId) return;
    const newNode: TreeNodeData = { id: `n${nextId++}`, value: 0 };
    setRoot((r) => {
      const target = findTreeNode(r, selectedId);
      if (target?.left) return r;
      return updateTreeNode(r, selectedId, { left: newNode }) ?? r;
    });
  }, [selectedId]);

  const handleInsertRight = useCallback(() => {
    if (!selectedId) return;
    const newNode: TreeNodeData = { id: `n${nextId++}`, value: 0 };
    setRoot((r) => {
      const target = findTreeNode(r, selectedId);
      if (target?.right) return r;
      return updateTreeNode(r, selectedId, { right: newNode }) ?? r;
    });
  }, [selectedId]);

  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    setRoot((r) => deleteTreeNode(r, selectedId) ?? r);
    setSelectedId(null);
  }, [selectedId]);

  if (!layout) return null;

  return (
    <div className="flex flex-col gap-2">
      {title && (
        <div className="text-center text-sm font-medium text-muted-foreground">{title}</div>
      )}
      <SVGCanvas width={width} height={height} padding={10}>
        <RenderTreeNode
          layout={layout}
          nodeRadius={nodeRadius}
          highlightSet={highlightSet}
          showNullLeaves={showNullLeaves}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </SVGCanvas>

      {/* Edit panel */}
      {selectedNode && (
        <div className="space-y-2 border-t border-white/[0.06] pt-3">
          <div className="flex items-center justify-center gap-3 text-xs">
            <label className="flex items-center gap-1 text-muted-foreground font-mono">
              Value:
              <input
                type="text"
                value={selectedNode.value}
                onChange={(e) => handleValueChange(e.target.value)}
                className="w-16 px-1.5 py-0.5 rounded bg-muted/50 border border-white/10 text-foreground text-center font-mono text-xs"
              />
            </label>
            <button
              type="button"
              onClick={handleInsertLeft}
              disabled={!!selectedNode.left}
              className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              + Left
            </button>
            <button
              type="button"
              onClick={handleInsertRight}
              disabled={!!selectedNode.right}
              className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              + Right
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
