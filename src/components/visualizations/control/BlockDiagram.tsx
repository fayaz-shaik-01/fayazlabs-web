"use client";

import { useState, useCallback } from "react";
import SVGCanvas from "../common/SVGCanvas";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────

type BlockType = "transfer" | "summing" | "pickoff" | "input" | "output";

interface BlockDef {
  id: string;
  type: BlockType;
  label: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  highlight?: boolean;
}

interface ConnectionDef {
  from: string;
  to: string;
  label?: string;
  sign?: "+" | "-";
  path?: "direct" | "feedback-below" | "feedback-above";
}

interface BlockDiagramProps {
  readonly blocks: BlockDef[];
  readonly connections: ConnectionDef[];
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly showLabels?: boolean;
}

// ── Block renderers ─────────────────────────────────────────────────────

function TransferBlock({
  block,
  showLabels,
}: {
  readonly block: BlockDef;
  readonly showLabels: boolean;
}) {
  const w = block.width ?? 80;
  const h = block.height ?? 50;
  return (
    <g>
      <rect
        x={block.x - w / 2}
        y={block.y - h / 2}
        width={w}
        height={h}
        rx={4}
        className={cn(
          "fill-transparent stroke-current",
          block.highlight ? "stroke-primary stroke-[2.5]" : "stroke-foreground/60 stroke-[1.5]",
        )}
      />
      {showLabels && (
        <text
          x={block.x}
          y={block.y}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground text-[13px] font-mono"
        >
          {block.label}
        </text>
      )}
    </g>
  );
}

function SummingJunction({
  block,
}: {
  readonly block: BlockDef;
}) {
  const r = 16;
  return (
    <g>
      <circle
        cx={block.x}
        cy={block.y}
        r={r}
        className={cn(
          "fill-transparent stroke-current",
          block.highlight ? "stroke-primary stroke-[2.5]" : "stroke-foreground/60 stroke-[1.5]",
        )}
      />
      {/* Cross inside */}
      <line
        x1={block.x - r * 0.5}
        y1={block.y}
        x2={block.x + r * 0.5}
        y2={block.y}
        className="stroke-foreground/40 stroke-[1]"
      />
      <line
        x1={block.x}
        y1={block.y - r * 0.5}
        x2={block.x}
        y2={block.y + r * 0.5}
        className="stroke-foreground/40 stroke-[1]"
      />
    </g>
  );
}

function PickoffPoint({
  block,
}: {
  readonly block: BlockDef;
}) {
  return (
    <circle
      cx={block.x}
      cy={block.y}
      r={4}
      className="fill-foreground/70"
    />
  );
}

function IOBlock({
  block,
  showLabels,
}: {
  readonly block: BlockDef;
  readonly showLabels: boolean;
}) {
  return showLabels ? (
    <text
      x={block.x}
      y={block.y}
      textAnchor="middle"
      dominantBaseline="central"
      className="fill-foreground/80 text-[13px] font-mono"
    >
      {block.label}
    </text>
  ) : null;
}

// ── Arrow marker ────────────────────────────────────────────────────────

function ArrowDefs() {
  return (
    <defs>
      <marker
        id="arrowhead"
        markerWidth="8"
        markerHeight="6"
        refX="8"
        refY="3"
        orient="auto"
      >
        <polygon
          points="0 0, 8 3, 0 6"
          className="fill-foreground/60"
        />
      </marker>
    </defs>
  );
}

// ── Connection renderer ─────────────────────────────────────────────────

function Connection({
  conn,
  blocks,
}: {
  readonly conn: ConnectionDef;
  readonly blocks: BlockDef[];
}) {
  const fromBlock = blocks.find((b) => b.id === conn.from);
  const toBlock = blocks.find((b) => b.id === conn.to);
  if (!fromBlock || !toBlock) return null;

  const fromW = fromBlock.type === "transfer" ? (fromBlock.width ?? 80) / 2 : fromBlock.type === "summing" ? 16 : 4;
  const toW = toBlock.type === "transfer" ? (toBlock.width ?? 80) / 2 : toBlock.type === "summing" ? 16 : 4;

  let x1 = fromBlock.x + fromW;
  let y1 = fromBlock.y;
  let x2 = toBlock.x - toW;
  let y2 = toBlock.y;

  let pathD: string;

  if (conn.path === "feedback-below") {
    const drop = 60;
    const halfH = fromBlock.type === "transfer" ? (fromBlock.height ?? 50) / 2 : fromBlock.type === "summing" ? 16 : 4;
    const toR = toBlock.type === "summing" ? 16 : 4;
    x1 = fromBlock.x;
    y1 = fromBlock.y + halfH;
    x2 = toBlock.x;
    y2 = toBlock.y + toR;
    pathD = `M ${x1} ${y1} L ${x1} ${y1 + drop} L ${x2} ${y2 + drop} L ${x2} ${y2}`;
  } else if (conn.path === "feedback-above") {
    const rise = 60;
    const halfH = fromBlock.type === "transfer" ? (fromBlock.height ?? 50) / 2 : 16;
    const toR = toBlock.type === "summing" ? 16 : 4;
    x1 = fromBlock.x;
    y1 = fromBlock.y - halfH;
    x2 = toBlock.x;
    y2 = toBlock.y - toR;
    pathD = `M ${x1} ${y1} L ${x1} ${y1 - rise} L ${x2} ${y2 - rise} L ${x2} ${y2}`;
  } else {
    pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  return (
    <g>
      <path
        d={pathD}
        className="fill-none stroke-foreground/50 stroke-[1.5]"
        markerEnd="url(#arrowhead)"
      />
      {/* Sign label near summing junction */}
      {conn.sign && (
        <text
          x={x2 - 10}
          y={conn.path?.includes("feedback") ? y2 + (conn.path === "feedback-below" ? 14 : -8) : y2 - 10}
          textAnchor="middle"
          className="fill-foreground/60 text-[12px] font-mono"
        >
          {conn.sign}
        </text>
      )}
      {/* Connection label */}
      {conn.label && (
        <text
          x={(x1 + x2) / 2}
          y={conn.path?.includes("feedback")
            ? (conn.path === "feedback-below" ? Math.max(y1, y2) + 60 + 14 : Math.min(y1, y2) - 60 - 6)
            : Math.min(y1, y2) - 8}
          textAnchor="middle"
          className="fill-foreground/50 text-[11px] font-mono"
        >
          {conn.label}
        </text>
      )}
    </g>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

export default function BlockDiagram({
  blocks: initialBlocks,
  connections,
  width = 700,
  height = 300,
  title,
  showLabels = true,
}: BlockDiagramProps) {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleLabelChange = useCallback((id: string, label: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, label } : b)),
    );
  }, []);

  const selectedBlock = blocks.find((b) => b.id === selectedId && b.type === "transfer");

  return (
    <div className="flex flex-col gap-2">
      {title && (
        <div className="text-center text-sm font-medium text-muted-foreground">{title}</div>
      )}
      <SVGCanvas width={width} height={height} padding={20}>
        <ArrowDefs />

        {/* Connections first (behind blocks) */}
        {connections.map((conn, i) => (
          <Connection key={`${conn.from}-${conn.to}-${i}`} conn={conn} blocks={blocks} />
        ))}

        {/* Blocks */}
        {blocks.map((block) => {
          const highlighted = { ...block, highlight: block.id === selectedId || block.highlight };
          switch (block.type) {
            case "transfer":
              return (
                <g key={block.id} onClick={() => handleSelect(block.id)} className="cursor-pointer">
                  <TransferBlock block={highlighted} showLabels={showLabels} />
                </g>
              );
            case "summing":
              return <SummingJunction key={block.id} block={block} />;
            case "pickoff":
              return <PickoffPoint key={block.id} block={block} />;
            case "input":
            case "output":
              return <IOBlock key={block.id} block={block} showLabels={showLabels} />;
            default:
              return null;
          }
        })}
      </SVGCanvas>

      {/* Edit panel */}
      {selectedBlock && (
        <div className="flex items-center justify-center gap-3 text-xs border-t border-white/[0.06] pt-3">
          <span className="text-muted-foreground">Transfer Function:</span>
          <input
            type="text"
            value={selectedBlock.label}
            onChange={(e) => handleLabelChange(selectedBlock.id, e.target.value)}
            className="w-32 px-2 py-1 text-xs font-mono rounded bg-white/[0.06] border border-white/[0.08] text-foreground focus:outline-none focus:border-primary"
          />
        </div>
      )}
    </div>
  );
}
