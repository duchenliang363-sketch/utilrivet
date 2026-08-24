// Business Document Difference Checker — Comparison Engine
// Pure client-side, no AI, no external API.

export type ChangeType = "CHANGED" | "ADDED" | "REMOVED" | "UNCHANGED";

export interface DiffItem {
  key: string;
  valueA: string;
  valueB: string;
  type: ChangeType;
  difference?: string;
}

export interface DiffResult {
  items: DiffItem[];
  summary: {
    changed: number;
    added: number;
    removed: number;
    unchanged: number;
  };
  importantChanges: string[];
}

// ─── Parsing ───────────────────────────────────────────────

function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDocument(text: string): Map<string, string> {
  const map = new Map<string, string>();
  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Try "Key: Value" format
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx > 0 && colonIdx < trimmed.length - 1) {
      const key = trimmed.slice(0, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 1).trim();
      if (key && value) {
        map.set(normalizeKey(key), value);
      }
      continue;
    }

    // Try "Key — Value" or "Key - Value" format
    const dashMatch = trimmed.match(/^(.+?)\s*[—–-]\s*(.+)$/);
    if (dashMatch) {
      const key = dashMatch[1].trim();
      const value = dashMatch[2].trim();
      if (key && value) {
        map.set(normalizeKey(key), value);
      }
      continue;
    }
  }

  return map;
}

// ─── Value comparison helpers ──────────────────────────────

function extractNumber(text: string): number | null {
  const cleaned = text.replace(/[, ]/g, "");
  const match = cleaned.match(/-?\d+\.?\d*/);
  return match ? parseFloat(match[0]) : null;
}

function extractPercent(text: string): number | null {
  const match = text.match(/(\d+\.?\d*)\s*%/);
  return match ? parseFloat(match[1]) : null;
}

function extractDays(text: string): number | null {
  const match = text.match(/(\d+)\s*(days?|day)/i);
  return match ? parseInt(match[1]) : null;
}

function extractMonths(text: string): number | null {
  const match = text.match(/(\d+)\s*(months?|month)/i);
  return match ? parseInt(match[1]) : null;
}

function isIncluded(text: string): boolean {
  const lower = text.toLowerCase();
  return lower === "included" || lower === "yes" || lower === "free" || lower === "n/a";
}

function isNotIncluded(text: string): boolean {
  const lower = text.toLowerCase();
  return lower === "not included" || lower === "excluded" || lower === "no" || lower === "none";
}

function valuesEqual(a: string, b: string): boolean {
  return a.toLowerCase().replace(/\s+/g, " ").trim() === b.toLowerCase().replace(/\s+/g, " ").trim();
}

// ─── Difference calculation ────────────────────────────────

function calcDifference(key: string, valueA: string, valueB: string): string | undefined {
  const nk = normalizeKey(key);

  // Price difference
  if (nk.includes("price") || nk.includes("cost") || nk.includes("amount") || nk.includes("total")) {
    const numA = extractNumber(valueA);
    const numB = extractNumber(valueB);
    if (numA !== null && numB !== null && numA !== numB) {
      const diff = numB - numA;
      const sign = diff > 0 ? "+" : "";
      const pct = numA !== 0 ? ((diff / numA) * 100).toFixed(1) : "N/A";
      return `${sign}${diff.toLocaleString()} (${sign}${pct}%)`;
    }
  }

  // Percentage difference (payment terms, deposit, etc.)
  if (nk.includes("payment") || nk.includes("deposit") || nk.includes("percent")) {
    const pctA = extractPercent(valueA);
    const pctB = extractPercent(valueB);
    if (pctA !== null && pctB !== null && pctA !== pctB) {
      const diff = pctB - pctA;
      const sign = diff > 0 ? "+" : "";
      return `${valueA} → ${valueB} (${sign}${diff}%)`;
    }
  }

  // Days difference (delivery, lead time, validity)
  if (nk.includes("delivery") || nk.includes("lead") || nk.includes("validity") || nk.includes("days")) {
    const daysA = extractDays(valueA);
    const daysB = extractDays(valueB);
    if (daysA !== null && daysB !== null && daysA !== daysB) {
      const diff = daysB - daysA;
      const sign = diff > 0 ? "+" : "";
      return `${sign}${diff} days`;
    }
  }

  // Months difference (warranty)
  if (nk.includes("warranty") || nk.includes("guarantee")) {
    const mA = extractMonths(valueA);
    const mB = extractMonths(valueB);
    if (mA !== null && mB !== null && mA !== mB) {
      const diff = mB - mA;
      const sign = diff > 0 ? "+" : "";
      return `${sign}${diff} months`;
    }
  }

  // Included → Not included (or vice versa)
  if ((isIncluded(valueA) && isNotIncluded(valueB)) || (isNotIncluded(valueA) && isIncluded(valueB))) {
    return `${valueA} → ${valueB}`;
  }

  // Generic numeric difference
  const numA = extractNumber(valueA);
  const numB = extractNumber(valueB);
  if (numA !== null && numB !== null && numA !== numB) {
    const diff = numB - numA;
    const sign = diff > 0 ? "+" : "";
    return `${sign}${diff}`;
  }

  return undefined;
}

// ─── Important change description ──────────────────────────

function describeImportantChange(item: DiffItem): string | null {
  const nk = normalizeKey(item.key);

  if (nk.includes("price") || nk.includes("cost") || nk.includes("total")) {
    const numA = extractNumber(item.valueA);
    const numB = extractNumber(item.valueB);
    if (numA !== null && numB !== null) {
      const diff = numB - numA;
      const sign = diff > 0 ? "+" : "";
      const pct = numA !== 0 ? ((diff / numA) * 100).toFixed(1) : "N/A";
      const dir = diff > 0 ? "increased" : diff < 0 ? "decreased" : "changed";
      return `Price ${dir} by ${sign}${diff.toLocaleString()} (${sign}${pct}%)`;
    }
  }

  if (nk.includes("deposit") || (nk.includes("payment") && nk.includes("term"))) {
    const pctA = extractPercent(item.valueA);
    const pctB = extractPercent(item.valueB);
    if (pctA !== null && pctB !== null) {
      return `Deposit changed from ${pctA}% to ${pctB}%`;
    }
  }

  if (nk.includes("delivery") || nk.includes("lead")) {
    const dA = extractDays(item.valueA);
    const dB = extractDays(item.valueB);
    if (dA !== null && dB !== null) {
      const diff = dB - dA;
      const sign = diff > 0 ? "+" : "";
      return `Delivery time ${diff > 0 ? "increased" : "decreased"} by ${sign}${diff} days`;
    }
  }

  if (nk.includes("warranty")) {
    const mA = extractMonths(item.valueA);
    const mB = extractMonths(item.valueB);
    if (mA !== null && mB !== null) {
      const diff = mB - mA;
      return diff < 0 ? `Warranty reduced by ${Math.abs(diff)} months` : `Warranty extended by ${diff} months`;
    }
  }

  if (nk.includes("training") || nk.includes("installation") || nk.includes("spare")) {
    if (isIncluded(item.valueA) && isNotIncluded(item.valueB)) {
      return `${item.key} is no longer included`;
    }
    if (isNotIncluded(item.valueA) && isIncluded(item.valueB)) {
      return `${item.key} is now included`;
    }
  }

  if (nk.includes("freight") || nk.includes("shipping")) {
    if (isIncluded(item.valueA) && !isIncluded(item.valueB)) {
      return `Freight changed from included to ${item.valueB}`;
    }
    if (!isIncluded(item.valueA) && isIncluded(item.valueB)) {
      return `Freight changed from ${item.valueA} to included`;
    }
  }

  if (nk.includes("validity")) {
    const dA = extractDays(item.valueA);
    const dB = extractDays(item.valueB);
    if (dA !== null && dB !== null) {
      const diff = dB - dA;
      return `Validity ${diff > 0 ? "extended" : "reduced"} by ${Math.abs(diff)} days`;
    }
  }

  // Generic
  if (item.type === "ADDED") return `${item.key} was added`;
  if (item.type === "REMOVED") return `${item.key} was removed`;
  return `${item.key} changed`;
}

// ─── Main comparison function ──────────────────────────────

export function compareDocuments(textA: string, textB: string): DiffResult {
  const docA = parseDocument(textA);
  const docB = parseDocument(textB);

  const allKeys = new Set<string>();
  const keyDisplay = new Map<string, string>();

  // Build display key map from original keys
  for (const [k] of docA) {
    allKeys.add(k);
    if (!keyDisplay.has(k)) keyDisplay.set(k, k);
  }
  for (const [k] of docB) {
    allKeys.add(k);
    if (!keyDisplay.has(k)) keyDisplay.set(k, k);
  }

  const items: DiffItem[] = [];
  const importantChanges: string[] = [];

  for (const key of allKeys) {
    const valA = docA.get(key);
    const valB = docB.get(key);

    if (valA && valB) {
      if (valuesEqual(valA, valB)) {
        items.push({ key, valueA: valA, valueB: valB, type: "UNCHANGED" });
      } else {
        const diff = calcDifference(key, valA, valB);
        items.push({ key, valueA: valA, valueB: valB, type: "CHANGED", difference: diff });
        const desc = describeImportantChange({ key, valueA: valA, valueB: valB, type: "CHANGED" });
        if (desc) importantChanges.push(desc);
      }
    } else if (valA && !valB) {
      items.push({ key, valueA: valA, valueB: "", type: "REMOVED" });
      const desc = describeImportantChange({ key, valueA: valA, valueB: "", type: "REMOVED" });
      if (desc) importantChanges.push(desc);
    } else if (!valA && valB) {
      items.push({ key, valueA: "", valueB: valB, type: "ADDED" });
      const desc = describeImportantChange({ key, valueA: "", valueB: valB, type: "ADDED" });
      if (desc) importantChanges.push(desc);
    }
  }

  const summary = {
    changed: items.filter((i) => i.type === "CHANGED").length,
    added: items.filter((i) => i.type === "ADDED").length,
    removed: items.filter((i) => i.type === "REMOVED").length,
    unchanged: items.filter((i) => i.type === "UNCHANGED").length,
  };

  return { items, summary, importantChanges };
}
