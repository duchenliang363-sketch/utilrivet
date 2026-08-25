"use client";

import { useState, useRef } from "react";
import { compareDocuments, type DiffResult, type DiffItem, type ChangeType } from "@/lib/doc-diff/engine";
import { demoDocA, demoDocB } from "@/lib/doc-diff/demo-data";
import EmptyState from "@/components/EmptyState";

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

// ─── Important Change Card ─────────────────────────────────

function ImportantChangeCard({ item }: { item: DiffItem }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">{item.key}</span>
        <StatusBadge type={item.type} />
      </div>
      <div className="space-y-1">
        {item.valueA && (
          <div className="text-sm text-muted">{item.valueA}</div>
        )}
        {item.valueB && (
          <div className="text-sm text-foreground font-medium">{item.valueB}</div>
        )}
        {item.difference && (
          <div className="text-xs font-medium text-primary mt-1">{item.difference}</div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────

export default function BusinessDocumentDifferenceChecker() {
  const [docA, setDocA] = useState("");
  const [docB, setDocB] = useState("");
  const [result, setResult] = useState<DiffResult | null>(null);
  const [showUnchanged, setShowUnchanged] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleCompare = () => {
    if (!docA.trim() || !docB.trim()) return;
    const r = compareDocuments(docA, docB);
    setResult(r);
    // Scroll to results after a brief delay
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleDemo = () => {
    setDocA(demoDocA);
    setDocB(demoDocB);
    const r = compareDocuments(demoDocA, demoDocB);
    setResult(r);
    // Scroll to results after a brief delay
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleClear = () => {
    setDocA("");
    setDocB("");
    setResult(null);
    setShowAllItems(false);
  };

  const filteredItems = result?.items.filter(
    (i) => showUnchanged || i.type !== "UNCHANGED"
  );

  const changedItems = result?.items.filter((i) => i.type === "CHANGED") || [];

  return (
    <div className="space-y-6">
      {/* Input area */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Document A */}
        <div>
          <label className="field-label">Document A</label>
          <p className="text-[13px] text-muted mb-2">Original or earlier version</p>
          <textarea
            value={docA}
            onChange={(e) => setDocA(e.target.value)}
            placeholder={"Total Price: USD 80,000\nDelivery Time: 45 days\nWarranty: 24 months"}
            className="field-textarea h-44 font-mono"
          />
        </div>

        {/* Document B */}
        <div>
          <label className="field-label">Document B</label>
          <p className="text-[13px] text-muted mb-2">Revised or newer version</p>
          <textarea
            value={docB}
            onChange={(e) => setDocB(e.target.value)}
            placeholder={"Total Price: USD 86,000\nDelivery Time: 60 days\nWarranty: 12 months"}
            className="field-textarea h-44 font-mono"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleCompare}
          disabled={!docA.trim() || !docB.trim()}
          className="btn btn-primary"
        >
          Compare Documents
        </button>
        <button onClick={handleDemo} className="btn btn-secondary">
          Try Demo
        </button>
        {(docA || docB) && (
          <button onClick={handleClear} className="btn btn-danger">
            Clear
          </button>
        )}
      </div>

      {/* Empty state hint */}
      {!result && (
        <EmptyState
          title="No comparison yet"
          hint="Paste two document versions or try the demo to see how it works."
          action={
            <button onClick={handleDemo} className="btn btn-secondary btn-sm">
              Try Demo
            </button>
          }
        />
      )}

      {/* Results */}
      {result && (
        <div ref={resultsRef} className="space-y-6">
          {/* Comparison Summary */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Comparison Summary</h3>
            <div className="flex items-baseline gap-6">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-amber-700">{result.summary.changed}</span>
                <span className="text-sm text-muted">Changed</span>
              </div>
              <div className="flex items-baseline gap-1.5 text-sm">
                <span className="font-medium text-green-700">{result.summary.added}</span>
                <span className="text-muted">Added</span>
              </div>
              <div className="flex items-baseline gap-1.5 text-sm">
                <span className="font-medium text-red-700">{result.summary.removed}</span>
                <span className="text-muted">Removed</span>
              </div>
              <div className="flex items-baseline gap-1.5 text-sm">
                <span className="font-medium text-gray-500">{result.summary.unchanged}</span>
                <span className="text-muted">Unchanged</span>
              </div>
            </div>
          </div>

          {/* Important Changes */}
          {changedItems.length > 0 && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">Important Changes</h3>
                <p className="text-sm text-muted mt-1">Key commercial differences worth reviewing.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {changedItems.map((item) => (
                  <ImportantChangeCard key={item.key} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* All Items Toggle */}
          <button
            onClick={() => setShowAllItems(!showAllItems)}
            className="w-full text-left text-sm font-medium text-primary hover:text-primary-hover transition-colors py-2"
          >
            {showAllItems ? "Hide comparison details" : `View all ${result.items.length} comparison items`}
          </button>

          {/* All differences (collapsible) */}
          {showAllItems && (
            <div className="rounded-xl border border-border overflow-hidden">
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
          )}

          {/* Disclaimer */}
          <div className="text-xs text-muted border-t border-border pt-4">
            This tool highlights document differences for review. Always verify important commercial and legal terms against the original documents.
          </div>
        </div>
      )}
    </div>
  );
}
