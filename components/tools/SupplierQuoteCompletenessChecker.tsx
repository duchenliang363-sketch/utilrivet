"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { checkQuote, buildQuestions, type QuoteCheckResult, type FieldStatus } from "@/lib/quote-checker/engine";
import { demoQuote } from "@/lib/quote-checker/demo-data";
import EmptyState from "@/components/EmptyState";

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

// ─── Main Component ────────────────────────────────────────

export default function SupplierQuoteCompletenessChecker() {
  const [quoteText, setQuoteText] = useState("");
  const [result, setResult] = useState<QuoteCheckResult | null>(null);
  const [copied, setCopied] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const scrollToResults = () => {
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleCheck = () => {
    if (!quoteText.trim()) return;
    setResult(checkQuote(quoteText));
    setCopied(false);
    scrollToResults();
  };

  const handleExample = () => {
    setQuoteText(demoQuote);
    setResult(checkQuote(demoQuote));
    setCopied(false);
    scrollToResults();
  };

  const handleClear = () => {
    setQuoteText("");
    setResult(null);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!result) return;
    const questions = buildQuestions(result);
    const text = "Questions to Ask Supplier:\n\n" + questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const itemsToReview = result?.checks.filter((c) => c.status !== "PRESENT") || [];
  const questions = result ? buildQuestions(result) : [];

  return (
    <div className="space-y-6">
      {/* Input area */}
      <div>
        <label className="field-label">Supplier Quote</label>
        <p className="text-[13px] text-muted mb-2">
          Paste the text from a supplier quotation, proposal, or commercial offer.
        </p>
        <textarea
          value={quoteText}
          onChange={(e) => setQuoteText(e.target.value)}
          placeholder={"Supplier: ABC Machinery\nQuantity: 2 units\nUnit Price: USD 42,000\nTotal Price: USD 84,000\nDelivery: 45 days\nPayment: 30% deposit, 70% before shipment\nWarranty: 12 months\nValidity: 30 days"}
          className="field-textarea h-56 font-mono"
        />
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleCheck}
          disabled={!quoteText.trim()}
          className="btn btn-primary"
        >
          Check Quote
        </button>
        <button onClick={handleExample} className="btn btn-secondary">
          Try Example
        </button>
        {quoteText && (
          <button onClick={handleClear} className="btn btn-danger">
            Clear
          </button>
        )}
      </div>

      {/* Empty state hint */}
      {!result && (
        <EmptyState
          title="No check yet"
          hint="Paste a supplier quotation or try the example to see how it works."
          action={
            <button onClick={handleExample} className="btn btn-secondary btn-sm">
              Try Example
            </button>
          }
        />
      )}

      {/* Results */}
      {result && (
        <div ref={resultsRef} className="space-y-6">
          {/* Quote Completeness */}
          <div className="result-card">
            <h3 className="result-label">Quote Completeness</h3>
            <div className="flex items-baseline gap-3">
              <span className="result-number">{result.score}%</span>
              <span className="text-sm font-medium text-primary">{result.level}</span>
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${result.score}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <span className="text-muted"><span className="font-medium text-green-700">{result.present}</span> Present</span>
              <span className="text-muted"><span className="font-medium text-red-700">{result.missing}</span> Missing</span>
              <span className="text-muted"><span className="font-medium text-amber-700">{result.unclear}</span> Unclear</span>
            </div>
          </div>

          {/* Critical Missing Items */}
          {result.criticalMissing.length > 0 && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">Critical Missing Items</h3>
                <p className="text-sm text-muted mt-1">These essential fields are missing or unclear and directly affect whether this quote can be compared with others.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.criticalMissing.map((item) => (
                  <div key={item.id} className="rounded-xl border border-red-200 bg-red-50/50 p-4 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items to Review */}
          {itemsToReview.length > 0 && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">Items to Review</h3>
                <p className="text-sm text-muted mt-1">Key commercial terms that are missing or unclear in this quotation.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {itemsToReview.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border bg-background p-4 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions to Ask Supplier */}
          {questions.length > 0 && (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Questions to Ask Supplier</h3>
                  <p className="text-sm text-muted mt-1">Generated from the missing and unclear items above, sorted by priority.</p>
                </div>
                <button
                  onClick={handleCopy}
                  className="btn btn-secondary btn-sm"
                >
                  {copied ? "Copied ✓" : "Copy Questions"}
                </button>
              </div>
              <ol className="rounded-xl border border-border bg-background divide-y divide-border">
                {questions.map((q, i) => (
                  <li key={i} className="flex items-start gap-3 px-4 py-3">
                    <span className="text-xs font-semibold text-primary mt-0.5 shrink-0">{i + 1}.</span>
                    <span className="text-sm text-foreground">{q}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* All Checks */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-surface">
              <h3 className="text-sm font-semibold text-foreground">All Checks</h3>
            </div>
            <div className="divide-y divide-border">
              {result.checks.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4 py-3 px-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">{item.label}</div>
                    <div className="text-xs text-muted mt-0.5 break-words">
                      {item.status === "PRESENT" && item.value ? item.value : "—"}
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Compare CTA */}
          <div className="flex justify-center">
            <Link
              href="/tools/production-line-quote-comparator"
              className="inline-flex items-center gap-2 btn btn-primary"
            >
              Compare Supplier Quotes
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-muted border-t border-border pt-4">
            This tool checks for common quotation fields using rule-based text matching. It does not verify whether the commercial terms are correct, favorable, or legally sufficient.
          </div>
        </div>
      )}
    </div>
  );
}
