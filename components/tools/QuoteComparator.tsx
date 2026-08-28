"use client";

import { useState, useMemo } from "react";
import {
  comparisonCategories,
  compareSuppliers,
  convertDraftToSuppliers,
  type ItemStatus,
  type ComparisonResult,
  type DraftSupplier,
} from "@/lib/quote-comparator/schema";
import { demoSuppliers } from "@/lib/quote-comparator/demo-data";
import { assessSupplierRisks } from "@/lib/quote-comparator/risk-assessment";

// ============================================================
// Helpers
// ============================================================

let _supplierCounter = 3;
function nextSupplierId() {
  return `supplier-${String.fromCharCode(64 + ++_supplierCounter)}`;
}

function createEmptyDraft(id: string, name: string): DraftSupplier {
  const items: DraftSupplier["items"] = {};
  for (const cat of comparisonCategories) {
    for (const item of cat.items) {
      items[item.id] = {};
    }
  }
  return { id, name, items };
}

function createInitialDrafts(): DraftSupplier[] {
  return [createEmptyDraft("supplier-a", "Supplier A"), createEmptyDraft("supplier-b", "Supplier B")];
}

// ============================================================
// Status Badge (existing)
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
// Supplier Form — Single Supplier Card
// ============================================================

function SupplierCard({
  draft,
  total,
  openSections,
  onToggleSection,
  onNameChange,
  onItemStatusChange,
  onItemValueChange,
  onDelete,
}: {
  draft: DraftSupplier;
  total: number;
  openSections: Record<string, boolean>;
  onToggleSection: (key: string) => void;
  onNameChange: (name: string) => void;
  onItemStatusChange: (itemId: string, status: ItemStatus) => void;
  onItemValueChange: (itemId: string, value: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-surface border-b border-border">
        <input
          type="text"
          value={draft.name}
          onChange={(e) => onNameChange(e.target.value)}
          className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-foreground border-0 border-b border-transparent focus:border-border-strong focus:outline-none px-0 py-0.5"
          placeholder="Supplier name"
        />
        {total > 2 && (
          <button type="button" onClick={onDelete} className="text-xs text-red-600 hover:text-red-800 shrink-0">
            Remove
          </button>
        )}
      </div>

      {/* Accordion Categories */}
      {comparisonCategories.map((cat) => {
        const key = `${draft.id}-${cat.id}`;
        const isOpen = openSections[key] || false;

        // Summary counts
        let summary = "";
        const inc = cat.items.filter((i) => draft.items[i.id]?.status === "Included").length;
        const mis = cat.items.filter((i) => draft.items[i.id]?.status === "Missing").length;
        const unc = cat.items.filter((i) => draft.items[i.id]?.status === "Unclear").length;
        if (cat.items.every((i) => i.type === "status")) {
          const parts: string[] = [];
          if (inc) parts.push(`${inc} included`);
          if (mis) parts.push(`${mis} missing`);
          if (unc) parts.push(`${unc} unclear`);
          summary = parts.join(" · ") || "Not filled";
        } else {
          const filled = cat.items.filter((i) => {
            const d = draft.items[i.id];
            return (d?.value?.trim() ?? "") !== "" || d?.status !== undefined;
          }).length;
          summary = filled > 0 ? `${filled} of ${cat.items.length} filled` : "Not filled";
        }

        return (
          <div key={cat.id} className="border-b border-border last:border-b-0">
            <button
              type="button"
              onClick={() => onToggleSection(key)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-surface-hover transition-colors"
            >
              <span className="text-sm font-medium text-foreground">{cat.name}</span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted">{summary}</span>
                <svg
                  className={`w-4 h-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>

            {isOpen && (
              <div className="px-4 pb-3 space-y-3">
                {cat.items.map((item) => {
                  const data = draft.items[item.id] || {};
                  return (
                    <div key={item.id}>
                      <p className="text-xs font-medium text-foreground mb-1">{item.name}</p>
                      {item.type === "status" ? (
                        <div className="flex gap-1.5">
                          {(["Included", "Missing", "Unclear"] as ItemStatus[]).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => onItemStatusChange(item.id, data.status === s ? ("Included" as ItemStatus) : s)}
                              className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                                data.status === s
                                  ? s === "Included"
                                    ? "bg-green-50 border-green-300 text-green-700"
                                    : s === "Missing"
                                      ? "bg-red-50 border-red-300 text-red-700"
                                      : "bg-amber-50 border-amber-300 text-amber-700"
                                  : "bg-white border-border text-muted hover:border-border-strong"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={data.value || ""}
                            onChange={(e) => onItemValueChange(item.id, e.target.value)}
                            placeholder={`Enter ${item.name.toLowerCase()}`}
                            className="w-full text-sm px-3 py-1.5 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:border-primary"
                          />
                          <div className="flex gap-1.5">
                            {(["Included", "Missing", "Unclear"] as ItemStatus[]).map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => onItemStatusChange(item.id, data.status === s ? ("Included" as ItemStatus) : s)}
                                className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                                  data.status === s
                                    ? s === "Included"
                                      ? "bg-green-50 border-green-300 text-green-700"
                                      : s === "Missing"
                                        ? "bg-red-50 border-red-300 text-red-700"
                                        : "bg-amber-50 border-amber-300 text-amber-700"
                                    : "bg-white border-border text-muted hover:border-border-strong"
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Supplier Form Section (all suppliers)
// ============================================================

function SupplierFormSection({
  drafts,
  onDraftsChange,
}: {
  drafts: DraftSupplier[];
  onDraftsChange: (d: DraftSupplier[]) => void;
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateName = (index: number, name: string) => {
    const next = [...drafts];
    next[index] = { ...next[index], name };
    onDraftsChange(next);
  };

  const updateStatus = (sIdx: number, itemId: string, status: ItemStatus) => {
    const next = [...drafts];
    next[sIdx] = {
      ...next[sIdx],
      items: { ...next[sIdx].items, [itemId]: { ...next[sIdx].items[itemId], status } },
    };
    onDraftsChange(next);
  };

  const updateValue = (sIdx: number, itemId: string, value: string) => {
    const next = [...drafts];
    next[sIdx] = {
      ...next[sIdx],
      items: { ...next[sIdx].items, [itemId]: { ...next[sIdx].items[itemId], value } },
    };
    onDraftsChange(next);
  };

  const addSupplier = () => {
    if (drafts.length >= 3) return;
    const id = nextSupplierId();
    const letters = ["A", "B", "C", "D"];
    onDraftsChange([...drafts, createEmptyDraft(id, `Supplier ${letters[drafts.length]}`)]);
  };

  const removeSupplier = (index: number) => {
    if (drafts.length <= 2) return;
    onDraftsChange(drafts.filter((_, i) => i !== index));
  };

  return (
    <section className="print-hidden">
      <h2 className="text-lg font-semibold text-foreground mb-4">Enter Your Quotations</h2>
      <div className="space-y-6">
        {drafts.map((draft, i) => (
          <SupplierCard
            key={draft.id}
            draft={draft}

            total={drafts.length}
            openSections={openSections}
            onToggleSection={toggleSection}
            onNameChange={(name) => updateName(i, name)}
            onItemStatusChange={(itemId, status) => updateStatus(i, itemId, status)}
            onItemValueChange={(itemId, value) => updateValue(i, itemId, value)}
            onDelete={() => removeSupplier(i)}
          />
        ))}
      </div>

      {drafts.length < 3 && (
        <button
          type="button"
          onClick={addSupplier}
          className="mt-4 text-sm text-primary hover:text-primary-hover font-medium"
        >
          + Add Supplier ({drafts.length}/3)
        </button>
      )}

      <p className="mt-3 text-xs text-muted">PDF/XLSX import is planned for a future version.</p>
    </section>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function QuoteComparator() {
  const [drafts, setDrafts] = useState<DraftSupplier[]>(createInitialDrafts);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const handleDemo = () => {
    const r = compareSuppliers(demoSuppliers);
    setResult(r);
    setIsDemo(true);
  };

  const handleCompare = () => {
    const suppliers = convertDraftToSuppliers(drafts);
    const r = compareSuppliers(suppliers);
    setResult(r);
    setIsDemo(false);
  };

  const handleReset = () => {
    setResult(null);
    setIsDemo(false);
    setDrafts(createInitialDrafts());
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-8">
      {/* Input Form */}
      {!result && (
        <>
          <SupplierFormSection drafts={drafts} onDraftsChange={setDrafts} />

          <div className="flex flex-wrap gap-3 print-hidden">
            <button type="button" onClick={handleCompare} className="btn btn-primary">
              Compare Quotations
            </button>
            <button type="button" onClick={handleDemo} className="btn btn-secondary">
              Try Example
            </button>
          </div>
        </>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Print Header (hidden on screen) */}
          <div className="hidden print:block mb-6">
            <h1 className="text-2xl font-bold">Production Line Quote Comparison</h1>
            <p className="text-sm text-muted mt-1">
              Suppliers: {result.suppliers.map((s) => s.name).join(", ")}
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap gap-3 print-hidden">
            <button type="button" onClick={handleReset} className="btn btn-secondary">
              &larr; Start Over
            </button>
            <button type="button" onClick={handlePrint} className="btn btn-secondary">
              Print Comparison Report
            </button>
          </div>

          {/* Demo Notice */}
          {isDemo && (
            <div className="rounded-xl border border-primary-100 bg-primary-50 p-4 print-hidden">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Demo Mode</span> — Showing 3 fictional suppliers.
                Supplier B has the lowest price ($72,000) but is missing key items.
                This demonstrates why apples-to-apples comparison matters.
              </p>
            </div>
          )}

          <ComparisonResults result={result} />
        </>
      )}


    </div>
  );
}

// ============================================================
// Comparison Results
// ============================================================

function ComparisonResults({ result }: { result: ComparisonResult }) {
  const risks = useMemo(() => assessSupplierRisks(result), [result]);

  return (
    <div className="space-y-10">
      <ComparisonMatrix result={result} />
      <RiskSummarySection risks={risks} />
      <MissingItemsSection result={result} />
      <MajorDifferencesSection result={result} />
      <QuestionsSection result={result} />

      {/* Print footer */}
      <div className="hidden print:block mt-12 pt-4 border-t border-border">
        <p className="text-xs text-muted text-center">Generated with UtilRivet</p>
      </div>
    </div>
  );
}

// ============================================================
// Comparison Matrix Table (existing, unchanged)
// ============================================================

function ComparisonMatrix({ result }: { result: ComparisonResult }) {
  const { suppliers } = result;

  const differentItemIds = useMemo(() => {
    const ids = new Set<string>();
    for (const diff of result.different) {
      ids.add(diff.itemId);
    }
    return ids;
  }, [result.different]);

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground">Apples-to-Apples Comparison</h2>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface border-b border-border">
              <th className="text-left py-3 px-4 font-semibold text-foreground min-w-[180px]">Item</th>
              {suppliers.map((s) => (
                <th key={s.id} className="text-right py-3 px-4 font-semibold text-foreground min-w-[120px]">
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
        <tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-gray-50/70 transition-colors">
          <td className="py-2.5 px-4 text-foreground">{item.name}</td>
          {suppliers.map((s) => {
            const data = s.items[item.id] || { status: "Missing" as ItemStatus };
            const isDiff = item.type === "value" && differentItemIds.has(item.id);
            return (
              <td
                key={s.id}
                className={`py-2.5 px-4 ${item.type === "status" ? "text-center" : "text-right"} ${isDiff ? "bg-primary-50/60" : ""}`}
              >
                {item.type === "status" ? (
                  <StatusBadge status={data.status} />
                ) : (
                  <span className="text-sm tabular-nums text-foreground">{data.value || "—"}</span>
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
// Commercial Risk Summary (P1 — new)
// ============================================================

function RiskSummarySection({ risks }: { risks: ReturnType<typeof assessSupplierRisks> }) {
  const riskColors: Record<string, { bg: string; text: string; border: string }> = {
    Low: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    Medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    High: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  };

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground">Commercial Risk Summary</h2>
      <p className="mt-1 text-sm text-muted">
        Quick risk overview based on missing items, unclear entries, and critical-category gaps.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {risks.map((r) => {
          const c = riskColors[r.riskLevel];
          return (
            <div key={r.supplierId} className={`rounded-xl border p-4 ${c.border} ${c.bg}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">{r.supplierName}</h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${c.text} ${c.bg}`}>
                  {r.riskLevel}
                </span>
              </div>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Missing items</dt>
                  <dd className="font-medium text-foreground">{r.missingCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Unclear items</dt>
                  <dd className="font-medium text-foreground">{r.unclearCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Major differences</dt>
                  <dd className="font-medium text-foreground">{r.majorDifferenceCount}</dd>
                </div>
              </dl>
              {r.criticalGaps.length > 0 && (
                <div className="mt-3 pt-2 border-t border-border/50">
                  <p className="text-xs text-muted">Critical gaps:</p>
                  <p className="text-xs font-medium text-foreground">{r.criticalGaps.join(", ")}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================
// Missing Items Section (existing, unchanged)
// ============================================================

function MissingItemsSection({ result }: { result: ComparisonResult }) {
  const hasAny = result.suppliers.some((s) => result.missing[s.id].length > 0);
  if (!hasAny) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground">Missing Items</h2>
      <p className="mt-1 text-sm text-muted">
        Items not found in the quotation. This does not mean the supplier excludes them — they may simply not be listed.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.suppliers.map((s) => {
          const items = result.missing[s.id];
          if (items.length === 0) return null;
          return (
            <div key={s.id} className="rounded-xl border border-border p-4">
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
// Major Differences Section (existing, unchanged)
// ============================================================

function MajorDifferencesSection({ result }: { result: ComparisonResult }) {
  if (result.different.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground">Major Differences</h2>
      <p className="mt-1 text-sm text-muted">
        Items where suppliers provide different values or specifications.
      </p>
      <div className="mt-4 space-y-4">
        {result.different.map((diff) => (
          <div key={diff.itemId} className="rounded-xl border border-border p-4">
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
// Questions to Ask Suppliers (existing, unchanged)
// ============================================================

function QuestionsSection({ result }: { result: ComparisonResult }) {
  const hasAny = result.suppliers.some((s) => result.questions[s.id].length > 0);
  if (!hasAny) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground">Questions to Ask Suppliers</h2>
      <p className="mt-1 text-sm text-muted">
        Auto-generated questions based on missing, unclear, or different items in each quotation.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.suppliers.map((s) => {
          const qs = result.questions[s.id];
          if (qs.length === 0) return null;
          return (
            <div key={s.id} className="rounded-xl border border-border p-4">
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
