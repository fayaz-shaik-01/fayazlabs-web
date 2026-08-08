"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────

interface CodePlaygroundProps {
  readonly initialCode?: string;
  readonly language?: "python" | "javascript";
  readonly title?: string;
  readonly readOnly?: boolean;
  readonly expectedOutput?: string;
  readonly height?: number;
}

// ── Component ───────────────────────────────────────────────────────────

export default function CodePlayground({
  initialCode = 'print("Hello, World!")',
  language = "python",
  title,
  readOnly = false,
  expectedOutput,
  height = 200,
}: CodePlaygroundProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pyodideRef = useRef<unknown>(null);
  const loadingRef = useRef(false);

  const loadPyodide = useCallback(async () => {
    if (pyodideRef.current) return pyodideRef.current;
    if (loadingRef.current) return null;
    loadingRef.current = true;

    try {
      // Dynamically load Pyodide from CDN
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
      document.head.appendChild(script);

      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Pyodide"));
      });

      const win = window as unknown as { loadPyodide: () => Promise<unknown> };
      const py = await win.loadPyodide();
      pyodideRef.current = py;
      return py;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Pyodide");
      return null;
    } finally {
      loadingRef.current = false;
    }
  }, []);

  const runPython = useCallback(async () => {
    setRunning(true);
    setError(null);
    setOutput("");

    try {
      const py = await loadPyodide() as { runPythonAsync: (code: string) => Promise<unknown>; runPython: (code: string) => unknown } | null;
      if (!py) {
        setError("Pyodide not available");
        return;
      }

      // Capture stdout
      py.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
`);
      await py.runPythonAsync(code);
      const stdout = py.runPython("sys.stdout.getvalue()") as string;
      setOutput(stdout || "(no output)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Runtime error");
    } finally {
      setRunning(false);
    }
  }, [code, loadPyodide]);

  const runJavaScript = useCallback(() => {
    setRunning(true);
    setError(null);
    setOutput("");

    try {
      const logs: string[] = [];
      const mockConsole = {
        log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
        error: (...args: unknown[]) => logs.push(`Error: ${args.map(String).join(" ")}`),
        warn: (...args: unknown[]) => logs.push(`Warning: ${args.map(String).join(" ")}`),
      };

      // eslint-disable-next-line no-new-func
      const fn = new Function("console", code);
      fn(mockConsole);
      setOutput(logs.join("\n") || "(no output)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Runtime error");
    } finally {
      setRunning(false);
    }
  }, [code]);

  const handleRun = useCallback(() => {
    if (language === "python") {
      runPython();
    } else {
      runJavaScript();
    }
  }, [language, runPython, runJavaScript]);

  const isCorrect = expectedOutput !== undefined && output.trim() === expectedOutput.trim();

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-foreground/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-foreground/[0.03] border-b border-foreground/10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">
            {language === "python" ? "Python" : "JavaScript"}
          </span>
          {title && <span className="text-sm text-muted-foreground">{title}</span>}
        </div>
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className={cn(
            "px-3 py-1 text-xs font-mono rounded transition-colors",
            running
              ? "bg-amber-500/10 text-amber-400"
              : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
          )}
        >
          {running ? "Running..." : "▶ Run"}
        </button>
      </div>

      {/* Code editor */}
      <div className="relative">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          readOnly={readOnly}
          spellCheck={false}
          className={cn(
            "w-full font-mono text-sm p-3 bg-transparent text-foreground resize-none focus:outline-none",
            "border-none",
            readOnly && "opacity-70",
          )}
          style={{ height, tabSize: 4 }}
        />
      </div>

      {/* Output */}
      {(output || error) && (
        <div className="border-t border-foreground/10">
          <div className="px-3 py-1.5 text-[10px] font-mono text-muted-foreground bg-foreground/[0.02]">
            OUTPUT
          </div>
          <pre
            className={cn(
              "px-3 py-2 text-sm font-mono whitespace-pre-wrap max-h-40 overflow-auto",
              error ? "text-red-400" : "text-foreground/80",
            )}
          >
            {error ?? output}
          </pre>
          {expectedOutput !== undefined && output && !error && (
            <div className={cn(
              "px-3 py-1 text-xs font-mono",
              isCorrect ? "text-emerald-400" : "text-amber-400",
            )}>
              {isCorrect ? "✓ Correct!" : `Expected: ${expectedOutput}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
