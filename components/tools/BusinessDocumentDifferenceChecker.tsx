"use client";

import { useState } from "react";
import { compareDocuments, type DiffResult, type DiffItem, type ChangeType } from "@/lib/doc-diff/engine";
import { demoDocA, demoDocB } from "@/lib/doc-diff/demo-data";

// ─── Status Badge ──────────────────────────────────────────

function StatusBadge({ type }: { type: ChangeType }) {
  const styles: Record<ChangeType, string> = {
    CHANGED: "bg-amber-50 text-amber-700 border-amber-200",
    ADDED: "bg-green-50 text-green-700 border-green-200",
    REMOVED: "bg-red-50 text-red-700 border-red-200",
    UNCHANGED: "bg-gray-50 text-gray-500 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold tracking-wide border px-2 py-0.5 rounded ${styles[type]}`}>
      {type}
    </span>
  );
}

// ─── Diff Row ──────────────────────────────────────────────

function DiffRow({ item }: { item: DiffItem }) {
  const isUnchanged = item.type === "UNCHANGED";

  return (
    <div className={`border-b border-border last:border-0 ${isUnchanged ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between py-3 px-4">
        <span className="text-sm font-medium text-foreground">{item.key}</span>
        <StatusBadge type={item.type} />
      </div>

      {!isUnchanged && (
        <div className="px-4 pb-3 space-y-1.5">
          {item.valueA && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted w-6 shrink-0 mt-0.5">A:</span>
              <span className="text-sm text-foreground">{item.valueA}</span>
            </div>
          )}
          {item.valueB && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted w-6 shrink-0 mt-0.5">B:</span>
              <span className="text-sm text-foreground">{item.valueB}</span>
            </div>
          )}
          {item.difference && (
            <div className="mt-1 pl-8">
              <span className="text-xs font-medium text-primary">Difference: {item.difference}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────

export default function BusinessDocumentDifferenceChecker() {
  const [docA, setDocA] = useState("");
  const [docB, setDocB] = useState("");
  const [result, setResult] = useState<DiffResult | null>(null);
  const [showUnchanged, setShowUnchanged] = useState(false);

  const handleCompare = () => {
    if (!docA.trim() || !docB.trim()) return;
    const r = compareDocuments(docA, docB);
    setResult(r);
  };

  const handleDemo = () => {
    setDocA(demoDocA);
    setDocB(demoDocB);
    const r = compareDocuments(demoDocA, demoDocB);
    setResult(r);
  };

  const handleClear = () => {
    setDocA("");
    setDocB("");
    setResult(null);
  };

  const filteredItems = result?.items.filter(
    (i) => showUnchanged || i.type !== "UNCHANGED"
  );

  return (
    <div className="space-y-6">
      {/* Privacy notice */}
      <div className="flex items-start gap-2 text-xs text-muted bg-gray-50 border border-border rounded-lg p-3">
        <svg className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z" />
        </svg>
        <span>Your document text is processed locally in your browser and is not uploaded or stored.</span>
      </div>

      {/* Input area */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Document A */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Document A</label>
          <textarea
            value={docA}
            onChange={(e) => setDocA(e.target.value)}
            placeholder={"Paste document text here...\n\nExample:\nTotal Price: USD 80,000\nDelivery Time: 45 days\nWarranty: 24 months"}
            className="w-full h-56 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y font-mono"
          />
        </div>

        {/* Document B */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Document B</label>
          <textarea
            value={docB}
            onChange={(e) => setDocB(e.target.value)}
            placeholder={"Paste document text here...\n\nExample:\nTotal Price: USD 86,000\nDelivery Time: 60 days\nWarranty: 12 months"}
            className="w-full h-56 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y font-mono"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleCompare}
          disabled={!docA.trim() || !docB.trim()}
          className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Compare Documents
        </button>
        <button
          onClick={handleDemo}
          className="inline-flex items-center rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface transition-colors"
        >
          Try Demo
        </button>
        {(docA || docB) && (
          <button
            onClick={handleClear}
            className="inline-flex items-center text-sm text-muted hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Comparison Summary</h3>
            <div className="flex flex-wrap gap-4">
              <span className="text-sm">
                <span className="font-semibold text-amber-700">{result.summary.changed}</span>
                <span className="text-muted ml-1">Changed</span>
              </span>
              <span className="text-sm">
                <span className="font-semibold text-green-700">{result.summary.added}</span>
                <span className="text-muted ml-1">Added</span>
              </span>
              <span className="text-sm">
                <span className="font-semibold text-red-700">{result.summary.removed}</span>
                <span className="text-muted ml-1">Removed</span>
              </span>
              <span className="text-sm">
                <span className="font-semibold text-gray-500">{result.summary.unchanged}</span>
                <span className="text-muted ml-1">Unchanged</span>
              </span>
            </div>
          </div>

          {/* Important Changes */}
          {result.importantChanges.length > 0 && (
            <div className="rounded-lg border border-l-[3px] border-l-primary border-border bg-accent-bg/30 p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Important Changes</h3>
              <ul className="space-y-2">
                {result.importantChanges.map((change, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <svg className="h-4 w-4 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* All differences */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
              <h3 className="text-sm font-semibold text-foreground">All Items</h3>
              {result.summary.unchanged > 0 && (
                <button
                  onClick={() => setShowUnchanged(!showUnchanged)}
                  className="text-xs text-muted hover:text-foreground transition-colors"
                >
                  {showUnchanged ? "Hide unchanged" : `Show unchanged (${result.summary.unchanged})`}
                </button>
              )}
            </div>
            <div className="divide-y divide-border">
              {filteredItems?.map((item) => (
                <DiffRow key={item.key} item={item} />
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-muted border-t border-border pt-4">
            This tool highlights document differences for review. Always verify important commercial and legal terms against the original documents.
          </div>
        </div>
      )}
    </div>
  );
}
