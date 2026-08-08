import { cookies } from "next/headers";
import type { Metadata } from "next";
import { listDocuments } from "@/lib/tax/api";
import { DocumentUploadZone } from "@/components/tax/document-upload-zone";
import type { DocumentResponse } from "@/lib/tax/types";

export const metadata: Metadata = { title: "Documents — Tax Intelligence" };

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  PROCESSING: "bg-blue-500/10 text-blue-500",
  PROCESSED: "bg-green-500/10 text-green-500",
  FAILED: "bg-destructive/10 text-destructive",
};

export default async function DocumentsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("tax-token")!.value;

  let documents: DocumentResponse[] = [];
  let fetchError: string | null = null;

  try {
    documents = await listDocuments(token);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Failed to load documents";
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-heading">Documents</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload tax documents to build your financial profile
        </p>
      </div>

      <DocumentUploadZone />

      {fetchError && (
        <p className="rounded-[2px] border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {fetchError}
        </p>
      )}

      {documents.length > 0 && (
        <div className="rounded-[2px] border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-card">
            <h2 className="text-sm font-semibold">Uploaded Documents</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">File</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Year</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Size</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="px-4">
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-sm font-medium">{doc.originalFilename}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{doc.documentType.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{doc.taxYear ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{(doc.fileSizeBytes / 1024).toFixed(1)} KB</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[doc.status] ?? STATUS_STYLES.PENDING}`}>
                        {doc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
