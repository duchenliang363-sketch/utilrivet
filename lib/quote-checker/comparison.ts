// Quote Comparison Engine — generates comparison summary from multiple quote results.
// Pure client-side, deterministic. No AI, no network.

import type { QuoteCheckResult, FieldCheck } from "./engine.ts";

// ─── Types ─────────────────────────────────────────────────

export interface SupplierQuote {
  id: string; // stable unique id — comparison uses index/id, never name (names may collide)
  name: string; // display-only
  result: QuoteCheckResult;
}

export interface ComparisonRow {
  fieldId: string;
  label: string;
  values: (string | null)[]; // one per supplier, null = missing
  statuses: string[]; // PRESENT / MISSING / UNCLEAR
  difference?: string; // human-readable difference note
  warning?: boolean; // true = this difference affects comparability
}

export interface ComparabilityAssessment {
  comparable: boolean;
  reasons: string[]; // why not directly comparable (empty if comparable)
}

export interface ComparisonSummary {
  rows: ComparisonRow[];
  assessment: ComparabilityAssessment;
  conclusion: string; // one-line human-readable conclusion
  priceDifference?: {
    lower: string; // supplier name
    amount: number; // absolute difference
    percentage: number; // percentage difference
    rawValues: (number | null)[]; // raw total prices, index-aligned with input quotes (null = missing/unparseable)
  };
}

// ─── Field value helpers ───────────────────────────────────

function getFieldValue(checks: FieldCheck[], fieldId: string): FieldCheck | undefined {
  return checks.find((c) => c.id === fieldId);
}

function extractNumber(value: string | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[,$¥€£]/g, "").trim();
  const match = cleaned.match(/[\d,]+\.?\d*/);
  if (!match) return null;
  return parseFloat(match[0].replace(/,/g, ""));
}

function getTotalPrices(quotes: SupplierQuote[]): (number | null)[] {
  return quotes.map((q) => extractNumber(getFieldValue(q.result.checks, "total-price")?.value));
}

function getCurrencyValues(quotes: SupplierQuote[]): (string | null)[] {
  return quotes.map((q) => getFieldValue(q.result.checks, "currency")?.value || null);
}

// ─── Comparability Assessment ──────────────────────────────

function assessComparability(quotes: SupplierQuote[]): ComparabilityAssessment {
  const reasons: string[] = [];

  if (quotes.length < 2) {
    return { comparable: false, reasons: ["Need at least 2 quotes to compare"] };
  }

  // Check quantity differences
  const quantities = quotes.map((q) => {
    const field = getFieldValue(q.result.checks, "quantity");
    return extractNumber(field?.value);
  });

  const uniqueQuantities = new Set(quantities.filter((q) => q !== null));
  if (uniqueQuantities.size > 1) {
    const qtyStrs = quotes.map((q) => {
      const field = getFieldValue(q.result.checks, "quantity");
      return `${q.name}: ${field?.value || "unknown"}`;
    });
    reasons.push(`Quantity differs (${qtyStrs.join(" vs ")})`);
  }

  // Check product/scope differences
  const products = quotes.map((q) => {
    const field = getFieldValue(q.result.checks, "product");
    return field?.value || null;
  });

  const uniqueProducts = new Set(products.filter((p) => p !== null));
  if (uniqueProducts.size > 1) {
    reasons.push("Product scope/specification differs");
  }

  // Check tax basis differences
  const taxFields = quotes.map((q) => {
    const field = getFieldValue(q.result.checks, "taxes");
    return field?.value || null;
  });

  const taxIncluded = taxFields.map((v) => {
    if (!v) return null;
    const lower = v.toLowerCase();
    if (lower.includes("included") || lower.includes("incl")) return true;
    if (lower.includes("excluded") || lower.includes("excl") || lower.includes("exclude")) return false;
    return null;
  });

  const taxValues = taxIncluded.filter((v) => v !== null);
  if (taxValues.includes(true) && taxValues.includes(false)) {
    reasons.push("Tax basis differs (some include tax, others exclude)");
  }

  // Check currency differences (after normalization, RMB=CNY)
  const currencies = getCurrencyValues(quotes);
  const uniqueCurrencies = new Set(currencies.filter((c) => c !== null));
  if (uniqueCurrencies.size > 1) {
    reasons.push(`Currency differs (${[...uniqueCurrencies].join(" vs ")})`);
  }

  // Check incoterm differences
  const incoterms = quotes.map((q) => {
    const field = getFieldValue(q.result.checks, "incoterm");
    return field?.value || null;
  });

  const uniqueIncoterms = new Set(incoterms.filter((i) => i !== null));
  if (uniqueIncoterms.size > 1) {
    reasons.push(`Incoterm differs (${[...uniqueIncoterms].join(" vs ")})`);
  }

  return { comparable: reasons.length === 0, reasons };
}

// ─── Price Difference Calculation ──────────────────────────

function calculatePriceDifference(quotes: SupplierQuote[]): ComparisonSummary["priceDifference"] | undefined {
  const prices = getTotalPrices(quotes);

  const validPrices = prices.filter((p) => p !== null) as number[];
  if (validPrices.length < 2) return undefined;

  const minPrice = Math.min(...validPrices);
  const maxPrice = Math.max(...validPrices);
  const lowerIdx = prices.indexOf(minPrice);

  return {
    lower: quotes[lowerIdx].name,
    amount: maxPrice - minPrice,
    percentage: minPrice > 0 ? Math.round(((maxPrice - minPrice) / minPrice) * 1000) / 10 : 0,
    // Keep nulls: the UI maps rawValues by quote index. Filtering here would
    // shift prices onto the wrong supplier.
    rawValues: prices,
  };
}

// ─── Build Comparison Rows ────────────────────────────────

const COMPARISON_FIELDS = [
  { id: "total-price", label: "Total Price" },
  { id: "quantity", label: "Quantity" },
  { id: "product", label: "Product / Scope" },
  { id: "unit-price", label: "Unit Price" },
  { id: "currency", label: "Currency" },
  { id: "lead-time", label: "Lead Time" },
  { id: "payment-terms", label: "Payment Terms" },
  { id: "taxes", label: "Tax / VAT" },
  { id: "incoterm", label: "Incoterm" },
  { id: "warranty", label: "Warranty" },
  { id: "freight", label: "Freight / Shipping" },
  { id: "installation", label: "Installation" },
];

function buildComparisonRows(quotes: SupplierQuote[], currencyConflict: boolean): ComparisonRow[] {
  return COMPARISON_FIELDS.map(({ id, label }) => {
    const values = quotes.map((q) => {
      const field = getFieldValue(q.result.checks, id);
      return field?.value || null;
    });

    const statuses = quotes.map((q) => {
      const field = getFieldValue(q.result.checks, id);
      return field?.status || "MISSING";
    });

    // Detect differences
    const presentValues = values.filter((v) => v !== null);
    const uniqueValues = new Set(presentValues);
    let difference: string | undefined;
    let warning = false;

    if (uniqueValues.size > 1 && presentValues.length >= 2) {
      if ((id === "total-price" || id === "unit-price") && currencyConflict) {
        // Different currencies: a numeric "lower by X" would be misleading.
        difference = "Prices in different currencies — not comparable";
        warning = true;
      } else if (id === "total-price" || id === "unit-price") {
        const nums = values.map((v) => extractNumber(v ?? undefined));
        const validNums = nums.filter((n) => n !== null) as number[];
        if (validNums.length >= 2) {
          const diff = Math.max(...validNums) - Math.min(...validNums);
          const lowerIdx = nums.indexOf(Math.min(...validNums));
          const lower = quotes[lowerIdx]?.name || "Unknown";
          difference = `${lower} is lower by ${diff.toLocaleString()}`;
          warning = id === "total-price";
        }
      } else if (id === "quantity") {
        difference = "Quantities differ — compare unit prices instead";
        warning = true;
      } else if (id === "currency") {
        difference = `Different currencies: ${presentValues.join(" vs ")}`;
        warning = true;
      } else if (id === "taxes") {
        const hasIncluded = presentValues.some((v) => /included|incl/i.test(v || ""));
        const hasExcluded = presentValues.some((v) => /excluded|excl|exclude/i.test(v || ""));
        if (hasIncluded && hasExcluded) {
          difference = "Tax basis differs — prices not directly comparable";
          warning = true;
        }
      } else {
        difference = `Different: ${presentValues.join(" vs ")}`;
      }
    }

    return { fieldId: id, label, values, statuses, difference, warning };
  });
}

// ─── Generate Conclusion ─────────────────────────────────

function generateConclusion(
  quotes: SupplierQuote[],
  assessment: ComparabilityAssessment,
  priceDiff: ComparisonSummary["priceDifference"],
  currencyConflict: boolean
): string {
  if (!priceDiff) {
    if (currencyConflict) {
      return "Prices are in different currencies and cannot be directly compared without exchange rates.";
    }
    return "Unable to compare prices — total price not found in one or more quotes.";
  }

  if (priceDiff.amount === 0) {
    return "All quotes have the same total price.";
  }

  const lowerSupplier = priceDiff.lower;
  // Highest price must come from the actual values, never array position —
  // quotes are ordered by upload order, not by price.
  const prices = getTotalPrices(quotes);
  const maxPrice = Math.max(...prices.filter((p): p is number => p !== null));
  const higherSupplier = quotes[prices.indexOf(maxPrice)]?.name ?? "the other supplier";
  const amountStr = priceDiff.amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const pctStr = priceDiff.percentage.toFixed(1);

  if (assessment.comparable) {
    return `${lowerSupplier} offers the lower total price at ${amountStr} less (${pctStr}% cheaper) than ${higherSupplier}, with comparable scope and terms.`;
  }

  const reasonStr = assessment.reasons.length > 0
    ? assessment.reasons[0].charAt(0).toLowerCase() + assessment.reasons[0].slice(1)
    : "scope and terms differ";

  return `${lowerSupplier}'s surface price is ${amountStr} lower (${pctStr}%), but ${reasonStr}, so the quotes cannot be directly compared without further clarification.`;
}

// ─── Main Export ───────────────────────────────────────────

export function compareQuotes(quotes: SupplierQuote[]): ComparisonSummary {
  const currencies = getCurrencyValues(quotes);
  const uniqueCurrencies = new Set(currencies.filter((c) => c !== null));
  const currencyConflict = uniqueCurrencies.size > 1;

  const rows = buildComparisonRows(quotes, currencyConflict);
  const assessment = assessComparability(quotes);
  // Never compute a numeric price difference across currencies —
  // without exchange rates any "lower by X" would be misleading.
  const priceDifference = currencyConflict ? undefined : calculatePriceDifference(quotes);
  const conclusion = generateConclusion(quotes, assessment, priceDifference, currencyConflict);

  return { rows, assessment, conclusion, priceDifference };
}
