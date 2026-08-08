"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  det,
  transpose,
  inv,
  identity,
  type Matrix,
} from "mathjs";

// ── Types ───────────────────────────────────────────────────────────────

type CellHighlight = "none" | "pivot" | "changed" | "zero" | "diagonal";

interface MatrixDisplayProps {
  readonly matrix: number[][];
  readonly label?: string;
  readonly showDeterminant?: boolean;
  readonly showTranspose?: boolean;
  readonly showInverse?: boolean;
  readonly showIdentity?: boolean;
  readonly highlightDiagonal?: boolean;
  readonly highlightCells?: Array<{ row: number; col: number; type: CellHighlight }>;
  readonly operations?: MatrixOperation[];
  readonly precision?: number;
  readonly compact?: boolean;
}

interface MatrixOperation {
  label: string;
  matrix: number[][];
}

// ── Cell highlight colors ───────────────────────────────────────────────

const highlightStyles: Record<CellHighlight, string> = {
  none: "",
  pivot: "bg-primary/20 text-primary font-bold",
  changed: "bg-amber-500/20 text-amber-300",
  zero: "text-muted-foreground/40",
  diagonal: "bg-blue-500/15 text-blue-400",
};

// ── Matrix Bracket ──────────────────────────────────────────────────────

function MatrixBracket({ side, rows }: { readonly side: "left" | "right"; readonly rows: number }) {
  const h = rows * 32 + (rows - 1) * 4 + 16;
  return (
    <svg
      width="8"
      height={h}
      viewBox={`0 0 8 ${h}`}
      className="shrink-0 text-foreground/60"
      aria-hidden
    >
      {side === "left" ? (
        <path
          d={`M 7 1 L 2 1 L 2 ${h - 1} L 7 ${h - 1}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ) : (
        <path
          d={`M 1 1 L 6 1 L 6 ${h - 1} L 1 ${h - 1}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      )}
    </svg>
  );
}

// ── Single Matrix Renderer ──────────────────────────────────────────────

function MatrixGrid({
  data,
  title,
  highlightCells,
  highlightDiagonal,
  precision,
  compact,
}: {
  readonly data: number[][];
  readonly title?: string;
  readonly highlightCells?: MatrixDisplayProps["highlightCells"];
  readonly highlightDiagonal?: boolean;
  readonly precision: number;
  readonly compact: boolean;
}) {
  const rows = data.length;
  const cols = data[0]?.length ?? 0;

  const getCellClass = (r: number, c: number): string => {
    const custom = highlightCells?.find((h) => h.row === r && h.col === c);
    if (custom) return highlightStyles[custom.type];
    if (highlightDiagonal && r === c) return highlightStyles.diagonal;
    const val = data[r]?.[c];
    if (val === 0) return highlightStyles.zero;
    return "";
  };

  const fmt = (v: number) => {
    if (Number.isInteger(v)) return String(v);
    return v.toFixed(precision);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {title && (
        <span className="text-xs font-medium text-muted-foreground mb-1">{title}</span>
      )}
      <div className="flex items-center gap-0.5">
        <MatrixBracket side="left" rows={rows} />
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {data.flatMap((row, r) =>
            row.map((val, c) => (
              <div
                key={`${r}-${c}`}
                className={cn(
                  "flex items-center justify-center font-mono tabular-nums rounded-sm transition-colors",
                  compact ? "h-7 min-w-[28px] px-1 text-xs" : "h-8 min-w-[36px] px-1.5 text-sm",
                  getCellClass(r, c),
                )}
              >
                {fmt(val)}
              </div>
            )),
          )}
        </div>
        <MatrixBracket side="right" rows={rows} />
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

export default function MatrixDisplay({
  matrix,
  label,
  showDeterminant = false,
  showTranspose = false,
  showInverse = false,
  showIdentity = false,
  highlightDiagonal = false,
  highlightCells,
  operations,
  precision = 2,
  compact = false,
}: MatrixDisplayProps) {
  const [activeOp, setActiveOp] = useState<number>(-1);

  const isSquare = matrix.length === (matrix[0]?.length ?? 0);

  const detValue = useMemo(() => {
    if (!showDeterminant || !isSquare) return null;
    try {
      return det(matrix) as number;
    } catch {
      return null;
    }
  }, [matrix, showDeterminant, isSquare]);

  const transposedMatrix = useMemo(() => {
    if (!showTranspose) return null;
    try {
      const result = transpose(matrix);
      return (result as unknown as Matrix).toArray() as number[][];
    } catch {
      return null;
    }
  }, [matrix, showTranspose]);

  const inverseMatrix = useMemo(() => {
    if (!showInverse || !isSquare) return null;
    try {
      const result = inv(matrix);
      return (result as unknown as Matrix).toArray() as number[][];
    } catch {
      return null;
    }
  }, [matrix, showInverse, isSquare]);

  const identityMatrix = useMemo(() => {
    if (!showIdentity || !isSquare) return null;
    try {
      const result = identity(matrix.length);
      return (result as unknown as Matrix).toArray() as number[][];
    } catch {
      return null;
    }
  }, [matrix.length, showIdentity, isSquare]);

  const displayMatrix =
    activeOp >= 0 && operations?.[activeOp]
      ? operations[activeOp].matrix
      : matrix;

  return (
    <div className="flex flex-col gap-4">
      {/* Main matrix + computed matrices */}
      <div className="flex flex-wrap items-start justify-center gap-8">
        <MatrixGrid
          data={displayMatrix}
          title={
            label ??
            (activeOp >= 0 && operations?.[activeOp]
              ? operations[activeOp].label
              : undefined)
          }
          highlightCells={highlightCells}
          highlightDiagonal={highlightDiagonal}
          precision={precision}
          compact={compact}
        />

        {transposedMatrix && (
          <>
            <span className="self-center text-muted-foreground text-lg">&rarr;</span>
            <MatrixGrid data={transposedMatrix} title="Transpose" precision={precision} compact={compact} />
          </>
        )}

        {inverseMatrix && (
          <>
            <span className="self-center text-muted-foreground text-lg">&rarr;</span>
            <MatrixGrid data={inverseMatrix} title="Inverse" precision={precision} compact={compact} />
          </>
        )}

        {identityMatrix && (
          <>
            <span className="self-center text-muted-foreground text-lg">=</span>
            <MatrixGrid data={identityMatrix} title="Identity" highlightDiagonal precision={precision} compact={compact} />
          </>
        )}
      </div>

      {/* Determinant */}
      {detValue !== null && (
        <div className="text-center text-sm text-muted-foreground">
          det(A) = <span className="font-mono font-medium text-foreground">{Number.isInteger(detValue) ? detValue : detValue.toFixed(precision)}</span>
        </div>
      )}

      {/* Operation steps */}
      {operations && operations.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setActiveOp(-1)}
            className={cn(
              "rounded-md border px-3 py-1 text-xs transition-colors",
              activeOp === -1
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/50 text-muted-foreground hover:bg-white/[0.04]",
            )}
          >
            Original
          </button>
          {operations.map((op, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setActiveOp(i)}
              className={cn(
                "rounded-md border px-3 py-1 text-xs transition-colors",
                activeOp === i
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:bg-white/[0.04]",
              )}
            >
              {op.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
