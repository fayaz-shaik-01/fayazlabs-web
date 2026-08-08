"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const DOCUMENT_TYPES = [
  "FORM_16",
  "FORM_16A",
  "FORM_26AS",
  "AIS",
  "TIS",
  "SALARY_SLIP",
  "BANK_STATEMENT",
  "INVESTMENT_PROOF",
  "HOME_LOAN_STATEMENT",
  "RENT_RECEIPT",
  "OTHER",
];

type UploadState = "idle" | "initiating" | "uploading" | "confirming" | "done" | "error";

export function DocumentUploadZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [docType, setDocType] = useState("FORM_16");
  const [taxYear, setTaxYear] = useState("2024-25");
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(file: File) {
    setFileName(file.name);
    setError(null);
    setState("initiating");

    try {
      const initRes = await fetch("/api/tax/documents/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: docType,
          contentType: file.type || "application/octet-stream",
          originalFilename: file.name,
          fileSizeBytes: file.size,
          taxYear,
        }),
      });
      const initData = await initRes.json();
      if (!initRes.ok || !initData.success) {
        throw new Error(initData.error?.message ?? "Failed to initiate upload");
      }

      const { documentId, uploadUrl } = initData.data as {
        documentId: string;
        uploadUrl: string;
      };

      setState("uploading");
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!uploadRes.ok) {
        throw new Error("Failed to upload file to storage");
      }

      setState("confirming");
      const confirmRes = await fetch(`/api/tax/documents/${documentId}/confirm`, {
        method: "POST",
      });
      const confirmData = await confirmRes.json();
      if (!confirmRes.ok || !confirmData.success) {
        throw new Error(confirmData.error?.message ?? "Failed to confirm upload");
      }

      setState("done");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setState("error");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const statusLabel: Record<UploadState, string> = {
    idle: "Drop a file or click to browse",
    initiating: "Preparing upload…",
    uploading: `Uploading ${fileName}…`,
    confirming: "Confirming…",
    done: `${fileName} uploaded successfully`,
    error: `Upload failed`,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Document Type</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="rounded-[2px] border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Tax Year</label>
          <input
            type="text"
            value={taxYear}
            onChange={(e) => setTaxYear(e.target.value)}
            placeholder="2024-25"
            className="rounded-[2px] border border-border bg-background px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-[2px] border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
          state === "done"
            ? "border-green-500/40 bg-green-500/5"
            : state === "error"
            ? "border-destructive/40 bg-destructive/5"
            : "border-border hover:border-primary/40 hover:bg-accent/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div className="text-3xl">
          {state === "done" ? "✅" : state === "error" ? "❌" : "📤"}
        </div>
        <p className="text-sm font-medium">{statusLabel[state]}</p>
        {state === "idle" && (
          <p className="text-xs text-muted-foreground">PDF, JPG, PNG up to 20 MB</p>
        )}
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
        {(state === "initiating" || state === "uploading" || state === "confirming") && (
          <div className="w-full max-w-xs h-1 rounded-full bg-border overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
          </div>
        )}
      </div>

      {state === "done" && (
        <button
          onClick={() => { setState("idle"); setFileName(null); }}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Upload another
        </button>
      )}
    </div>
  );
}
