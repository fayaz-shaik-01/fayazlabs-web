"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────

interface KarnaughMapProps {
  readonly variables?: 2 | 3 | 4;
  readonly minterms?: number[];
  readonly dontCares?: number[];
  readonly title?: string;
  readonly interactive?: boolean;
  readonly showSOP?: boolean;
  readonly variableNames?: string[];
}

// ── Gray code orders ────────────────────────────────────────────────────

const GRAY_2 = ["00", "01", "11", "10"];
const GRAY_1 = ["0", "1"];

function getGrayLabels(n: number): string[] {
  if (n <= 1) return GRAY_1;
  return GRAY_2;
}

// ── Minterm to row/col mapping ──────────────────────────────────────────

function getMintermIndex(vars: number, minterm: number): { row: number; col: number } {
  if (vars === 2) {
    return { row: (minterm >> 1) & 1, col: minterm & 1 };
  }
  if (vars === 3) {
    const row = (minterm >> 2) & 1;
    const colBits = minterm & 0b11;
    const grayIdx = GRAY_2.indexOf(colBits.toString(2).padStart(2, "0"));
    return { row, col: grayIdx >= 0 ? grayIdx : 0 };
  }
  // 4 variables
  const rowBits = (minterm >> 2) & 0b11;
  const colBits = minterm & 0b11;
  const rowIdx = GRAY_2.indexOf(rowBits.toString(2).padStart(2, "0"));
  const colIdx = GRAY_2.indexOf(colBits.toString(2).padStart(2, "0"));
  return { row: rowIdx >= 0 ? rowIdx : 0, col: colIdx >= 0 ? colIdx : 0 };
}

// ── Component ───────────────────────────────────────────────────────────

export default function KarnaughMap({
  variables = 4,
  minterms: initialMinterms = [],
  dontCares: initialDontCares = [],
  title,
  interactive = true,
  showSOP = true,
  variableNames = ["A", "B", "C", "D"],
}: KarnaughMapProps) {
  const rows = variables <= 3 ? 2 : 4;
  const cols = variables === 2 ? 2 : 4;
  const totalMinterms = Math.pow(2, variables);

  const [activeMinterms, setActiveMinterms] = useState<Set<number>>(
    () => new Set(initialMinterms),
  );

  const [dcSet] = useState<Set<number>>(() => new Set(initialDontCares));

  const toggleMinterm = useCallback(
    (m: number) => {
      if (!interactive || dcSet.has(m)) return;
      setActiveMinterms((prev) => {
        const next = new Set(prev);
        if (next.has(m)) next.delete(m);
        else next.add(m);
        return next;
      });
    },
    [interactive, dcSet],
  );

  // Build grid
  const grid = useMemo(() => {
    const g: Array<Array<{ minterm: number; value: string }>> = Array.from(
      { length: rows },
      () => Array.from({ length: cols }, () => ({ minterm: 0, value: "0" })),
    );

    for (let m = 0; m < totalMinterms; m++) {
      const { row, col } = getMintermIndex(variables, m);
      const value = activeMinterms.has(m) ? "1" : dcSet.has(m) ? "X" : "0";
      g[row][col] = { minterm: m, value };
    }

    return g;
  }, [rows, cols, totalMinterms, variables, activeMinterms, dcSet]);

  const rowLabels = getGrayLabels(variables <= 3 ? 1 : 2);
  const colLabels = getGrayLabels(variables === 2 ? 1 : 2);

  const rowVarLabel = variableNames.slice(0, variables <= 3 ? 1 : 2).join("");
  const colVarLabel = variableNames.slice(variables <= 3 ? 1 : 2, variables).join("");

  // Simple SOP generation (no grouping/minimization)
  const sopExpr = useMemo(() => {
    if (!showSOP) return "";
    const terms: string[] = [];
    for (const m of activeMinterms) {
      const bits = m.toString(2).padStart(variables, "0");
      const term = bits
        .split("")
        .map((b, i) => (b === "1" ? variableNames[i] : `${variableNames[i]}'`))
        .join("");
      terms.push(term);
    }
    return terms.length > 0 ? terms.join(" + ") : "0";
  }, [activeMinterms, variables, variableNames, showSOP]);

  const cellSize = 48;

  return (
    <div className="flex flex-col gap-3 items-center">
      {title && (
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
      )}

      <div className="relative">
        {/* Column variable label */}
        <div className="text-center text-xs font-mono text-muted-foreground mb-1">
          {colVarLabel} →
        </div>

        <div className="flex">
          {/* Row variable label */}
          <div className="flex flex-col justify-center mr-1">
            <span className="text-xs font-mono text-muted-foreground [writing-mode:vertical-lr] rotate-180">
              {rowVarLabel} →
            </span>
          </div>

          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-10 h-8 text-[10px] font-mono text-muted-foreground">
                  {rowVarLabel}\{colVarLabel}
                </th>
                {colLabels.map((cl) => (
                  <th key={cl} className="text-center text-[11px] font-mono text-muted-foreground px-1" style={{ width: cellSize }}>
                    {cl}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row, ri) => (
                <tr key={ri}>
                  <td className="text-center text-[11px] font-mono text-muted-foreground pr-2">
                    {rowLabels[ri]}
                  </td>
                  {row.map((cell, ci) => (
                    <td
                      key={`${ri}-${ci}`}
                      onClick={() => toggleMinterm(cell.minterm)}
                      className={cn(
                        "border border-foreground/15 text-center font-mono text-sm transition-colors",
                        interactive && !dcSet.has(cell.minterm) && "cursor-pointer hover:bg-primary/10",
                        cell.value === "1" && "bg-emerald-500/15 text-emerald-400 font-medium",
                        cell.value === "X" && "bg-amber-500/10 text-amber-400",
                        cell.value === "0" && "text-foreground/30",
                      )}
                      style={{ width: cellSize, height: cellSize }}
                    >
                      <div>{cell.value}</div>
                      <div className="text-[8px] text-foreground/20">m{cell.minterm}</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showSOP && (
        <div className="text-sm font-mono text-center">
          <span className="text-muted-foreground">F = </span>
          <span className="text-primary">{sopExpr}</span>
        </div>
      )}

      {interactive && (
        <div className="text-xs text-muted-foreground">Click cells to toggle minterms</div>
      )}
    </div>
  );
}
