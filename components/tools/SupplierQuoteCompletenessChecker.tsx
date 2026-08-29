"use client";

import { useState, useRef } from "react";
import { checkQuote, buildQuestions, type QuoteCheckResult, type FieldStatus } from "@/lib/quote-checker/engine";
import { compareQuotes, type ComparisonSummary } from "@/lib/quote-checker/comparison";
import { demoQuote } from "@/lib/quote-checker/demo-data";
import { parseQuoteFile, type ParseResult } from "@/lib/quote-parser";
import EmptyState from "@/components/EmptyState";

// ─── Types ─────────────────────────────────────────────────

interface QuoteEntry {
  id: string;
  name: string;
  text: string;
  parseInfo?: ParseResult;
  result?: QuoteCheckResult;
}

// ─── Status Badge ──────────────────────────────────────────

function StatusBadge({ status }: { status: FieldStatus }) {
  const styles: Record<FieldStatus, string> = {
    PRESENT: "bg-green-50 text-green-700 border-green-200",
    MISSING: "bg-red-50 text-red-700 border-red-200",
    UNCLEAR: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold tracking-wide border px-2 py-0.5 rounded ${styles[status]}`}>
      {status}
    </span>
  );
}


// ── Comparison Summary Component ─────────────────────────

function ComparisonSummaryView({ summary, quotes }: { summary: ComparisonSummary; quotes: QuoteEntry[] }) {
  return (
    <div className="space-y-6">
      {/* One-line conclusion */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <h3 className="text-sm font-semibold text-primary mb-2">Comparison Conclusion</h3>
        <p className="text-base text-foreground leading-relaxed">{summary.conclusion}</p>
      </div>

      {/* Comparability Assessment */}
      {!summary.assessment.comparable && summary.assessment.reasons.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">⚠ Not Directly Comparable</h3>
          <ul className="list-disc list-inside text-sm text-amber-900 space-y-1">
            {summary.assessment.reasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Price Difference Highlight */}
      {summary.priceDifference && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs text-muted mb-1">Price Difference</p>
            <p className="text-2xl font-bold text-foreground">{summary.priceDifference.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted mt-1">{summary.priceDifference.percentage.toFixed(1)}% difference</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs text-muted mb-1">Lower Price</p>
            <p className="text-lg font-semibold text-green-700">{summary.priceDifference.lower}</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs text-muted mb-1">Raw Prices</p>
            <div className="space-y-1">
              {quotes.filter((q) => q.result).map((q, i) => {
                const price = summary.priceDifference!.rawValues[i];
                return (
                  <p key={q.id} className="text-sm">
                    <span className="font-medium">{q.name}:</span>{" "}
                    <span className="tabular-nums">{price?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || "N/A"}</span>
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Key Differences Table */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Key Differences</h3>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground min-w-[140px]">Field</th>
                {quotes.filter((q) => q.result).map((q) => (
                  <th key={q.id} className="text-center py-3 px-4 font-semibold text-foreground min-w-[120px]">
                    {q.name}
                  </th>
                ))}
                <th className="text-left py-3 px-4 font-semibold text-foreground min-w-[160px]">Note</th>
              </tr>
            </thead>
            <tbody>
              {summary.rows.map((row) => (
                <tr key={row.fieldId} className={`border-b border-border last:border-b-0 ${row.warning ? "bg-amber-50/50" : ""}`}>
                  <td className="py-2.5 px-4">
                    <span className="font-medium text-foreground">{row.label}</span>
                  </td>
                  {row.values.map((val, i) => (
                    <td key={i} className="py-2.5 px-4 text-center">
                      {val ? (
                        <div className="flex flex-col items-center gap-1">
                          <StatusBadge status={row.statuses[i] as FieldStatus} />
                          <span className="text-xs text-muted tabular-nums max-w-[160px] truncate" title={val}>{val}</span>
                        </div>
                      ) : (
                        <StatusBadge status="MISSING" />
                      )}
                    </td>
                  ))}
                  <td className="py-2.5 px-4">
                    {row.difference ? (
                      <span className={`text-xs ${row.warning ? "text-amber-700 font-medium" : "text-muted"}`}>
                        {row.warning && "⚠ "}{row.difference}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Single Quote Card ─────────────────────────────────────

function QuoteCard({
  quote,
  onTextChange,
  onCheck,
  onRemove,
}: {
  quote: QuoteEntry;
  onTextChange: (text: string) => void;
  onCheck: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
        >
          <svg className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {quote.name}
        </button>
        <div className="flex items-center gap-2">
          {quote.result && (
            <span className={`text-sm font-bold ${quote.result.score >= 80 ? "text-green-700" : quote.result.score >= 50 ? "text-blue-700" : "text-red-700"}`}>
              {quote.result.score}%
            </span>
          )}
          <button
            type="button"
            onClick={onCheck}
            className="text-xs px-3 py-1 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
          >
            Check
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Remove
          </button>
        </div>
      </div>

      {quote.parseInfo && (
        <p className="px-4 py-1.5 text-xs font-medium text-green-700 bg-green-50/50 border-b border-border">
          ✓ {quote.parseInfo.format.toUpperCase()}
          {quote.parseInfo.pageCount ? ` · ${quote.parseInfo.pageCount} page${quote.parseInfo.pageCount > 1 ? "s" : ""}` : ""}
          {quote.parseInfo.rowCount ? ` · ${quote.parseInfo.rowCount} rows` : ""}
          {quote.parseInfo.sheetName ? ` · "${quote.parseInfo.sheetName}"` : ""}
        </p>
      )}

      {open && (
        <div className="p-4">
          <textarea
            value={quote.text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Paste supplier quotation text here..."
            className="w-full h-40 text-sm font-mono px-3 py-2 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:border-primary resize-y"
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────

export default function SupplierQuoteCompletenessChecker() {
  const [quotes, setQuotes] = useState<QuoteEntry[]>([]);
  const [parseError, setParseError] = useState("");
  const [parsing, setParsing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const addQuote = (name: string, text: string, parseInfo?: ParseResult) => {
    const id = `quote-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const result = text.trim() ? checkQuote(text) : undefined;
    setQuotes((prev) => [...prev, { id, name, text, parseInfo, result }]);
  };

  const processFiles = async (files: File[]) => {
    const valid = files.filter((f) => {
      const name = f.name.toLowerCase();
      return name.endsWith(".pdf") || name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv");
    });
    if (valid.length === 0) {
      setParseError("No supported files. Please upload PDF or Excel files.");
      return;
    }
    if (quotes.length + valid.length > 3) {
      setParseError("Maximum 3 suppliers. Only processing first files.");
    }
    const toProcess = valid.slice(0, 3 - quotes.length);
    setParsing(true);
    setParseError("");
    try {
      for (const file of toProcess) {
        const parsed = await parseQuoteFile(file);
        const name = file.name.replace(/\.[^.]+$/, "");
        addQuote(name, parsed.text, parsed);
      }
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setParsing(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processFiles(Array.from(files));
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    await processFiles(Array.from(files));
  };

  const handleExample = () => {
    addQuote("Example Quote", demoQuote);
  };

  const handleCheckAll = () => {
    setQuotes((prev) =>
      prev.map((q) => ({
        ...q,
        result: q.text.trim() ? checkQuote(q.text) : undefined,
      }))
    );
    if (quotes.length >= 2) {
      setTimeout(() => {
        summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  const handleClearAll = () => {
    setQuotes([]);
    setParseError("");
  };

  const handleCopyQuestions = () => {
    const allQuestions: string[] = [];
    quotes.forEach((q) => {
      if (q.result) {
        const qs = buildQuestions(q.result);
        if (qs.length > 0) {
          allQuestions.push(`— ${q.name} —`);
          qs.forEach((qq, i) => allQuestions.push(`${i + 1}. ${qq}`));
        }
      }
    });
    const text = allQuestions.join("\n");
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const updateQuoteText = (id: string, text: string) => {
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, text, result: undefined } : q)));
  };

  const removeQuote = (id: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  };

  const hasResults = quotes.some((q) => q.result);
  const checkedQuotes = quotes.filter((q) => q.result);
  const comparisonSummary = checkedQuotes.length >= 2
    ? compareQuotes(checkedQuotes.map((q) => ({ id: q.id, name: q.name, result: q.result! })))
    : null;
  const allQuestions = hasResults
    ? quotes.flatMap((q) => (q.result ? buildQuestions(q.result).map((qq) => ({ supplier: q.name, question: qq })) : []))
    : [];

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); }}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed transition-colors p-4 ${
          dragging ? "border-primary bg-primary/5" : "border-transparent"
        }`}
      >
        <label className="field-label">Supplier Quotations</label>
        <p className="text-[13px] text-muted mb-3">
          Drag & drop quotation files here, or paste text manually. Add 2+ suppliers to compare.
        </p>

        <div className="flex flex-col items-center justify-center gap-1 px-4 py-5 rounded-lg bg-surface/50 border border-border mb-3">
          <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          <p className="text-sm text-muted">
            Drop PDF / Excel files here, or{" "}
            <label className="cursor-pointer font-medium text-primary hover:underline">
              browse
              <input ref={inputRef} type="file" multiple accept=".pdf,.xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" disabled={parsing} />
            </label>
          </p>
          <p className="text-xs text-muted">PDF, Excel (.xlsx, .xls, .csv) — 1 to 3 files</p>
        </div>

        {parseError && <p className="text-xs text-red-600 mb-2">{parseError}</p>}
        {parsing && <p className="text-xs text-primary mb-2">Parsing...</p>}
      </div>

      {/* Quote Cards */}
      {quotes.length > 0 && (
        <div className="space-y-4">
          {quotes.map((q) => (
            <QuoteCard
              key={q.id}
              quote={q}
              onTextChange={(text) => updateQuoteText(q.id, text)}
              onCheck={() => {
                setQuotes((prev) => prev.map((qq) => (qq.id === q.id ? { ...qq, result: checkQuote(qq.text) } : qq)));
              }}
              onRemove={() => removeQuote(q.id)}
            />
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={handleCheckAll} disabled={quotes.length === 0} className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          {quotes.length >= 2 ? "Check & Compare All" : "Check Quote"}
        </button>
        <button onClick={handleExample} className="btn btn-secondary">
          Try Example
        </button>
        {quotes.length > 0 && (
          <button onClick={handleClearAll} className="btn btn-danger">
            Clear All
          </button>
        )}
      </div>

      {/* Empty state */}
      {!hasResults && quotes.length === 0 && (
        <EmptyState
          title="No quotes yet"
          hint="Drop supplier quotation files or try the example to get started."
          action={
            <button onClick={handleExample} className="btn btn-secondary btn-sm">
              Try Example
            </button>
          }
        />
      )}

      {/* Comparison Summary (FIRST SCREEN when 2+ quotes) */}
      {comparisonSummary && (
        <div ref={summaryRef} className="space-y-6">
          <ComparisonSummaryView summary={comparisonSummary} quotes={checkedQuotes} />
        </div>
      )}

      {/* Per-quote Details (folded below) */}
      {hasResults && (
        <details className="group">
          <summary className="cursor-pointer text-lg font-semibold text-foreground mb-4 hover:text-primary transition-colors">
            Completeness Details (click to expand)
          </summary>
          <div className="mt-4 space-y-6">
            {checkedQuotes.map((q) => {
              const r = q.result!;
              const itemsToReview = r.checks.filter((c) => c.status !== "PRESENT");
              return (
                <div key={q.id} className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">{q.name} — Details</h3>

                  <div className="result-card">
                    <h4 className="result-label">Completeness</h4>
                    <div className="flex items-baseline gap-3">
                      <span className="result-number">{r.score}%</span>
                      <span className="text-sm font-medium text-primary">{r.level}</span>
                    </div>
                    <div className="mt-3 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${r.score}%` }} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                      <span className="text-muted"><span className="font-medium text-green-700">{r.present}</span> Present</span>
                      <span className="text-muted"><span className="font-medium text-red-700">{r.missing}</span> Missing</span>
                      <span className="text-muted"><span className="font-medium text-amber-700">{r.unclear}</span> Unclear</span>
                    </div>
                  </div>

                  {r.criticalMissing.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Critical Missing</h4>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {r.criticalMissing.map((item) => (
                          <div key={item.id} className="rounded-lg border border-red-200 bg-red-50/50 p-3 flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-foreground">{item.label}</span>
                            <StatusBadge status={item.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {itemsToReview.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Items to Review</h4>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {itemsToReview.map((item) => (
                          <div key={item.id} className="rounded-lg border border-border bg-background p-3 flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-foreground">{item.label}</span>
                            <StatusBadge status={item.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Questions */}
            {allQuestions.length > 0 && (
              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Questions to Ask Suppliers</h3>
                    <p className="text-sm text-muted mt-1">Generated from missing and unclear items, sorted by priority.</p>
                  </div>
                  <button onClick={handleCopyQuestions} className="btn btn-secondary btn-sm">
                    {copied ? "Copied ✓" : "Copy Questions"}
                  </button>
                </div>
                <ol className="rounded-xl border border-border bg-background divide-y divide-border">
                  {allQuestions.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 px-4 py-3">
                      <span className="text-xs font-semibold text-primary mt-0.5 shrink-0">{i + 1}.</span>
                      <div>
                        <span className="text-xs text-muted">{item.supplier}: </span>
                        <span className="text-sm text-foreground">{item.question}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </details>
      )}

      {/* Disclaimer */}
      {hasResults && (
        <div className="text-xs text-muted border-t border-border pt-4">
          This tool checks for common quotation fields using rule-based text matching. It does not verify whether the commercial terms are correct, favorable, or legally sufficient.
        </div>
      )}
    </div>
  );
}
