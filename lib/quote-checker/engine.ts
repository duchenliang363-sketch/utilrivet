// Supplier Quote Completeness Checker — Detection Engine
// Pure client-side, deterministic rule-based text matching.
// No AI, no network, no uploads.

export type FieldStatus = "PRESENT" | "MISSING" | "UNCLEAR";

export interface FieldCheck {
  id: string;
  label: string;
  status: FieldStatus;
  value?: string;
}

export interface QuoteCheckResult {
  checks: FieldCheck[];
  present: number;
  missing: number;
  unclear: number;
  score: number; // 0–100
  level: string;
}

// ─── Field Definitions ────────────────────────────────────

interface FieldDef {
  id: string;
  label: string;
  test: (line: string) => boolean;
  global?: (fullText: string) => string | null; // optional whole-text detection, returns detected value
  question: string;
  questionUnclear?: string;
}

const FIELD_DEFS: FieldDef[] = [
  {
    id: "supplier-name",
    label: "Supplier Name",
    test: (l) => /\b(supplier|vendor|company\s*name|sold\s*by)\b/i.test(l),
    question: "Please confirm the supplier company name and contact details.",
  },
  {
    id: "quote-number",
    label: "Quote / Reference Number",
    test: (l) => /\b(quotation|quote|offer|reference|ref)\s*(no\.?|number|#|id)\b/i.test(l),
    question: "Please provide a quotation or reference number for tracking.",
  },
  {
    id: "quote-date",
    label: "Quote Date",
    test: (l) => /\b(quote|quotation|offer)\s*date\b/i.test(l) || /^\s*date\b/i.test(l),
    question: "Please confirm the date of this quotation.",
  },
  {
    id: "product",
    label: "Product / Item Description",
    test: (l) => /\b(product|item\s*(name|description|no)|description|goods)\b/i.test(l),
    question: "Please provide a clear product or item description, including model and specifications.",
  },
  {
    id: "quantity",
    label: "Quantity",
    test: (l) => /\b(quantity|qty)\b/i.test(l) || /\d+\s*(pcs|pieces|units|sets)\b/i.test(l),
    question: "Please confirm the quantity being quoted.",
  },
  {
    id: "unit-price",
    label: "Unit Price",
    test: (l) => /\bunit\s*price\b/i.test(l) || /\bprice\s*per\s*(unit|piece|pc|set)\b/i.test(l),
    question: "Please confirm the unit price.",
  },
  {
    id: "total-price",
    label: "Total Price",
    test: (l) => /\btotal\s*(price|amount|cost|value)\b/i.test(l) || /\bgrand\s*total\b/i.test(l),
    question: "Please confirm the total price of this quotation.",
  },
  {
    id: "currency",
    label: "Currency",
    global: (t) => {
      const m = t.match(/\b(USD|EUR|GBP|CNY|RMB|JPY|AUD|CAD|CHF|INR)\b/);
      return m ? m[1] : null;
    },
    test: (l) => /\bcurrency\b/i.test(l),
    question: "Please confirm the currency for all quoted prices.",
  },
  {
    id: "moq",
    label: "MOQ",
    test: (l) => /\b(moq|minimum\s*order(\s*quantity)?)\b/i.test(l),
    question: "Please confirm the minimum order quantity (MOQ).",
  },
  {
    id: "lead-time",
    label: "Lead Time / Delivery Time",
    test: (l) =>
      /\b(lead\s*time|delivery)\b/i.test(l) && !/\b(charge|charges|cost|fee)\b/i.test(l),
    question: "Please confirm the lead time or delivery time.",
  },
  {
    id: "payment-terms",
    label: "Payment Terms",
    test: (l) =>
      /\b(payment\s*terms?|payment|deposit|advance\s*payment|balance|letter\s*of\s*credit|t\/t|l\/c)\b/i.test(l),
    question:
      "Please provide the payment terms, including deposit and balance payment requirements.",
  },
  {
    id: "freight",
    label: "Freight / Shipping",
    test: (l) =>
      /\b(freight|shipping(\s*cost|\s*charge)?|transport(ation)?\s*(cost|charge)?|delivery\s*(charge|cost|fee))\b/i.test(l),
    question:
      "Please confirm whether freight is included in the quoted price. If not, please provide the freight cost.",
    questionUnclear:
      "Please confirm whether freight is included in the quoted price. If not, please provide the freight cost.",
  },
  {
    id: "incoterm",
    label: "Incoterm",
    test: (l) =>
      /\b(FOB|CIF|CFR|EXW|FCA|FAS|CPT|CIP|DAP|DPU|DDP|incoterms?)\b/i.test(l),
    question:
      "Please confirm the applicable Incoterm and named place (e.g. FOB Shanghai or CIF Rotterdam).",
  },
  {
    id: "taxes",
    label: "Taxes / Duties",
    test: (l) => /\b(tax(es)?|vat|dut(y|ies)|gst|customs\s*(duty|duties))\b/i.test(l),
    question: "Please clarify whether taxes and import duties are included in the quoted price.",
  },
  {
    id: "warranty",
    label: "Warranty",
    test: (l) => /\b(warranty|guarantee)\b/i.test(l),
    question: "Please provide the warranty period and warranty coverage.",
  },
  {
    id: "validity",
    label: "Quote Validity",
    test: (l) => /\b(validity|valid\s*(for|until|through)|quotation\s*valid)\b/i.test(l),
    question: "Please confirm how long this quotation remains valid.",
  },
  {
    id: "installation",
    label: "Installation",
    test: (l) => /\binstallation\b/i.test(l),
    question: "Please confirm whether installation is included, and any associated costs.",
  },
  {
    id: "training",
    label: "Training",
    test: (l) => /\btraining\b/i.test(l),
    question: "Please confirm whether operator training is included.",
  },
  {
    id: "spare-parts",
    label: "Spare Parts",
    test: (l) => /\bspare\s*parts?\b/i.test(l),
    question:
      "Please confirm whether spare parts are included, and provide a recommended spare parts list.",
  },
];

export const TOTAL_FIELDS = FIELD_DEFS.length;

// ─── Value Extraction ─────────────────────────────────────

// Vague phrasing means the field is mentioned but has no concrete value.
const VAGUE_PATTERN =
  /\b(tbd|tba|to be (confirmed|discussed|determined|advised|decided|agreed|negotiated)|on request|upon request|negotiable|as agreed|as per (agreement|contract)|depends|pending|not specified|unknown|n\/a)\b/i;

function extractValue(lines: string[], idx: number): string {
  const line = lines[idx].trim();
  const sepIdx = Math.max(line.indexOf(":"), line.indexOf("："));
  let value = sepIdx >= 0 ? line.slice(sepIdx + 1).trim() : "";

  // Value may sit on the following line, e.g. "Delivery:\n50 days"
  if (!value && sepIdx >= 0) {
    const next = (lines[idx + 1] || "").trim();
    if (next && !/[:：]/.test(next) && next.length <= 120) {
      value = next;
    }
  }

  // Bare mention without a colon, e.g. "Prices are FOB Shanghai"
  if (!value && sepIdx < 0) {
    value = line.length <= 100 ? line : line.slice(0, 100) + "…";
  }
  return value;
}

// Find the best matching line for a field.
// Prefer label-style lines (keyword appears before a colon),
// then fall back to any bare mention.
function findFieldLine(lines: string[], test: (line: string) => boolean): number {
  for (let i = 0; i < lines.length; i++) {
    const sep = lines[i].search(/[:：]/);
    if (sep >= 0 && test(lines[i].slice(0, sep))) return i;
  }
  return lines.findIndex(test);
}

function classify(value: string): FieldStatus {
  const v = value.trim();
  if (!v || v === "-" || v === "—" || VAGUE_PATTERN.test(v)) return "UNCLEAR";
  return "PRESENT";
}

// ─── Main Check ───────────────────────────────────────────

export function checkQuote(text: string): QuoteCheckResult {
  const lines = (text || "").split(/\r?\n/);

  const checks: FieldCheck[] = FIELD_DEFS.map((def) => {
    // Global detection first (e.g. currency codes anywhere in the text)
    if (def.global) {
      const g = def.global(text || "");
      if (g) return { id: def.id, label: def.label, status: "PRESENT", value: g };
    }

    const idx = findFieldLine(lines, def.test);
    if (idx === -1) {
      return { id: def.id, label: def.label, status: "MISSING" };
    }

    const value = extractValue(lines, idx);
    const status = classify(value);
    return {
      id: def.id,
      label: def.label,
      status,
      value: value.length > 100 ? value.slice(0, 100) + "…" : value || undefined,
    };
  });

  const present = checks.filter((c) => c.status === "PRESENT").length;
  const missing = checks.filter((c) => c.status === "MISSING").length;
  const unclear = checks.filter((c) => c.status === "UNCLEAR").length;
  const score = Math.round((present / TOTAL_FIELDS) * 100);

  return { checks, present, missing, unclear, score, level: scoreToLevel(score) };
}

export function scoreToLevel(score: number): string {
  if (score >= 90) return "Highly Complete";
  if (score >= 70) return "Mostly Complete";
  if (score >= 50) return "Needs Review";
  return "Incomplete";
}

// ─── Questions to Ask Supplier ────────────────────────────

export function buildQuestions(result: QuoteCheckResult): string[] {
  return result.checks
    .filter((c) => c.status !== "PRESENT")
    .map((c) => {
      const def = FIELD_DEFS.find((d) => d.id === c.id)!;
      return c.status === "UNCLEAR" && def.questionUnclear ? def.questionUnclear : def.question;
    });
}
