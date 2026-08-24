"use client";

import { useState, useMemo } from "react";
import {
  comparisonCategories,
  compareSuppliers,
  type ItemStatus,
  type ComparisonResult,
} from "@/lib/quote-comparator/schema";
import { demoSuppliers } from "@/lib/quote-comparator/demo-data";

// ============================================================
// Status Badge Component
// ============================================================

function StatusBadge({ status }: { status: ItemStatus }) {
  const config: Record<ItemStatus, { bg: string; text: string; symbol: string; label: string }> = {
    Included: { bg: "bg-green-50", text: "text-green-700", symbol: "✓", label: "Included" },
    Missing: { bg: "bg-red-50", text: "text-red-700", symbol: "✕", label: "Missing" },
    Unclear: { bg: "bg-amber-50", text: "text-amber-700", symbol: "?", label: "Unclear" },
    Different: { bg: "bg-blue-50", text: "text-blue-700", symbol: "≠", label: "Different" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${c.bg} ${c.text}`}>
      <span>{c.symbol}</span>
      <span>{c.label}</span>
    </span>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function QuoteComparator() {
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const handleDemo = () => {
    const r = compareSuppliers(demoSuppliers);
    setResult(r);
    setIsDemo(true);
  };

  const handleReset = () => {
    setResult(null);
    setIsDemo(false);
  };

  return (
    <div className="space-y-8">
      {/* Upload Area */}
      {!result && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Upload Quotations</h2>
          <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
            <svg className="mx-auto h-10 w-10 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="mt-3 text-sm text-muted">
              Drag and drop PDF or XLSX files here (2–3 quotations)
            </p>
            <p className="mt-1 text-xs text-muted">
              File analysis is currently in preview / demo mode.
            </p>
          </div>

          <div className="mt-4 rounded-lg border border-border p-4">
            <p className="text-xs text-muted mb-2">Or paste quotation text:</p>
            <textarea
              className="w-full rounded-md border border-border px-3 py-2 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              rows={3}
              placeholder="Paste quotation content here..."
              disabled
            />
            <p className="mt-1 text-xs text-muted">
              Text parsing is currently in preview / demo mode.
            </p>
          </div>
        </section>
      )}

      {/* Try Demo / Reset */}
      <div className="flex gap-3">
        {!result ? (
          <button
            type="button"
            onClick={handleDemo}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
          >
            Try Demo
          </button>
        ) : (
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            &larr; Start Over
          </button>
        )}
      </div>

      {/* Demo Notice */}
      {result && isDemo && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Demo Mode</span> — Showing 3 fictional suppliers.
            Supplier B has the lowest price ($72,000) but is missing key items.
            This demonstrates why apples-to-apples comparison matters.
          </p>
        </div>
      )}

      {/* Comparison Results */}
      {result && <ComparisonResults result={result} />}
    </div>
  );
}

// ============================================================
// Comparison Results (extracted for clarity)
// ============================================================

function ComparisonResults({ result }: { result: ComparisonResult }) {
  return (
    <div className="space-y-10">
      <ComparisonMatrix result={result} />
      <MissingItemsSection result={result} />
      <MajorDifferencesSection result={result} />
      <QuestionsSection result={result} />
    </div>
  );
}

// ============================================================
// Comparison Matrix Table
// ============================================================

function ComparisonMatrix({ result }: { result: ComparisonResult }) {
  const { suppliers } = result;

  // Find which value items have different values across suppliers
  const differentItemIds = useMemo(() => {
    const ids = new Set<string>();
    for (const diff of result.different) {
      ids.add(diff.itemId);
    }
    return ids;
  }, [result.different]);

  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground">Apples-to-Apples Comparison</h2>
      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface border-b border-border">
              <th className="text-left py-3 px-4 font-semibold text-foreground min-w-[180px]">Item</th>
              {suppliers.map((s) => (
                <th key={s.id} className="text-center py-3 px-4 font-semibold text-foreground min-w-[120px]">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonCategories.map((cat) => (
              <CategoryRows
                key={cat.id}
                categoryId={cat.id}
                categoryName={cat.name}
                items={cat.items}
                suppliers={suppliers}
                differentItemIds={differentItemIds}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CategoryRows({
  categoryName,
  items,
  suppliers,
  differentItemIds,
}: {
  categoryId: string;
  categoryName: string;
  items: { id: string; name: string; type: "status" | "value" }[];
  suppliers: { id: string; name: string; items: Record<string, { status: ItemStatus; value?: string }> }[];
  differentItemIds: Set<string>;
}) {
  return (
    <>
      <tr className="bg-surface/60">
        <td
          colSpan={suppliers.length + 1}
          className="py-2 px-4 text-xs font-semibold text-muted uppercase tracking-wider border-b border-border"
        >
          {categoryName}
        </td>
      </tr>
      {items.map((item) => (
        <tr key={item.id} className="border-b border-border last:border-b-0">
          <td className="py-2.5 px-4 text-foreground">{item.name}</td>
          {suppliers.map((s) => {
            const data = s.items[item.id] || { status: "Missing" as ItemStatus };
            const isDiff = item.type === "value" && differentItemIds.has(item.id);
            return (
              <td key={s.id} className={`py-2.5 px-4 text-center ${isDiff ? "bg-blue-50/50" : ""}`}>
                {item.type === "status" ? (
                  <StatusBadge status={data.status} />
                ) : (
                  <span className="text-sm text-foreground">{data.value || "—"}</span>
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

// ============================================================
// Missing Items Section
// ============================================================

function MissingItemsSection({ result }: { result: ComparisonResult }) {
  const hasAny = result.suppliers.some((s) => result.missing[s.id].length > 0);
  if (!hasAny) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground">Missing Items</h2>
      <p className="mt-1 text-sm text-muted">
        Items not found in the quotation. This does not mean the supplier excludes them — they may simply not be listed.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.suppliers.map((s) => {
          const items = result.missing[s.id];
          if (items.length === 0) return null;
          return (
            <div key={s.id} className="rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
              <p className="text-xs text-muted mt-0.5">{items.length} item{items.length !== 1 ? "s" : ""} not found in quotation</p>
              <ul className="mt-3 space-y-1.5">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="text-red-600 mt-0.5 shrink-0">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================
// Major Differences Section
// ============================================================

function MajorDifferencesSection({ result }: { result: ComparisonResult }) {
  if (result.different.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground">Major Differences</h2>
      <p className="mt-1 text-sm text-muted">
        Items where suppliers provide different values or specifications.
      </p>
      <div className="mt-4 space-y-4">
        {result.different.map((diff) => (
          <div key={diff.itemId} className="rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground">{diff.itemName}</h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {diff.values.map((v) => (
                <div key={v.supplierName} className="flex items-center justify-between rounded bg-surface px-3 py-2">
                  <span className="text-xs text-muted">{v.supplierName}</span>
                  <span className="text-sm font-medium text-foreground">{v.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// Questions to Ask Suppliers
// ============================================================

function QuestionsSection({ result }: { result: ComparisonResult }) {
  const hasAny = result.suppliers.some((s) => result.questions[s.id].length > 0);
  if (!hasAny) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground">Questions to Ask Suppliers</h2>
      <p className="mt-1 text-sm text-muted">
        Auto-generated questions based on missing, unclear, or different items in each quotation.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.suppliers.map((s) => {
          const qs = result.questions[s.id];
          if (qs.length === 0) return null;
          return (
            <div key={s.id} className="rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
              <p className="text-xs text-muted mt-0.5">{qs.length} question{qs.length !== 1 ? "s" : ""}</p>
              <ol className="mt-3 space-y-2">
                {qs.map((q, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground">
                    <span className="text-muted shrink-0">{i + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
    </section>
  );
}

