// IOLTA Trust Account 3-Way Reconciliation — Engine
// Pure client-side arithmetic assistant. Integer-cents math only — no JS float money.
// This tool performs arithmetic only: it does not certify compliance and is not legal advice.

// ─── Money parsing (integer cents) ─────────────────────────────────────────

/**
 * Parse a money string into integer cents.
 * - "" (empty / whitespace) → 0  (empty optional fields mean zero)
 * - "$1,234.56", "1234", "1234.5", "-250.00" supported
 * - Accounting negative "(250.00)" / "($250.00)" → -25000
 * - Anything unparseable → null
 */
export function parseMoneyToCents(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  let s = raw.trim();
  if (s === "") return 0;

  let negative = false;
  // Accounting parentheses: (250.00) or ($1,234.56)
  if (s.startsWith("(") && s.endsWith(")")) {
    negative = true;
    s = s.slice(1, -1).trim();
  }
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  }
  s = s.replace(/^\$/, "").replace(/,/g, "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;

  const parts = s.split(".");
  const cents =
    parseInt(parts[0], 10) * 100 + (parts[1] ? parseInt(parts[1].padEnd(2, "0"), 10) : 0);
  if (!Number.isSafeInteger(cents)) return null; // overflow guard
  return negative ? -cents : cents;
}

/** Format integer cents as "$1,234.56" / "-$1,234.56". */
export function formatCents(cents: number): string {
  const neg = cents < 0;
  const c = Math.abs(Math.round(cents));
  const s = String(c).padStart(3, "0");
  const dollars = s.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (neg ? "-" : "") + "$" + dollars + "." + s.slice(-2);
}

// ─── CSV import (local-only, format: Client,Balance) ───────────────────────

/** Parse one CSV line with quoted-field support ("a,b", "he said ""hi"""). */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

export interface CsvClientLedgerRow {
  name: string;
  balance: string; // raw balance string (validated by the caller)
}

export interface CsvImportResult {
  rows: CsvClientLedgerRow[];
  skipped: number; // rows that did not match "Client,Balance" or had an unparseable balance
  headerSkipped: boolean;
}

/**
 * Parse a Client,Balance CSV. Exactly two columns per row: more columns are
 * NOT concatenated into the client name — the row is skipped and counted.
 * A leading "Client,Balance" header row is detected and ignored.
 */
export function parseClientCsv(text: string): CsvImportResult {
  const lines = text.split(/\r?\n/);
  const rows: CsvClientLedgerRow[] = [];
  let skipped = 0;
  let headerSkipped = false;
  let sawData = false;

  for (const rawLine of lines) {
    if (rawLine.trim() === "") continue;
    const fields = parseCsvLine(rawLine);

    // Header row: exactly ["Client","Balance"] (case-insensitive)
    if (
      !sawData &&
      !headerSkipped &&
      fields.length === 2 &&
      fields[0].trim().toLowerCase() === "client" &&
      fields[1].trim().toLowerCase() === "balance"
    ) {
      headerSkipped = true;
      continue;
    }
    sawData = true;

    // Exactly two columns: Client, Balance. Anything else is an invalid row.
    if (fields.length !== 2) {
      skipped++;
      continue;
    }
    const name = fields[0].trim();
    const balance = fields[1].trim();
    if (balance === "" || parseMoneyToCents(balance) === null) {
      skipped++;
      continue;
    }
    rows.push({ name, balance });
  }
  return { rows, skipped, headerSkipped };
}

// ─── Reconciliation ────────────────────────────────────────────────────────

export interface LedgerEntry {
  name: string; // optional, for the printed record
  balance: string; // raw input
}

export type BookAdjustmentType = "Bank Fee" | "Interest" | "Other Adjustment";

export interface BookAdjustmentInput {
  type: BookAdjustmentType;
  amount: string;
  note: string;
}

export interface BookAdjustmentRecord {
  type: BookAdjustmentType;
  note: string;
  enteredCents: number;
  effectCents: number;
}

export interface ReconciliationIssue {
  location:
    | "Bank to adjusted book"
    | "Adjusted book to client ledgers"
    | "Both reconciliation boundaries"
    | "Client ledger exception";
  recommendedCheck: string;
}

export interface ReconciliationInput {
  statementEnding: string;
  register: string;
  checks: string[]; // outstanding checks (optional; empty = 0; must be >= 0)
  deposits: string[]; // outstanding deposits (optional; empty = 0; must be >= 0)
  bookAdjustments?: BookAdjustmentInput[];
  ledgers: LedgerEntry[];
}

export interface ReconciliationResult {
  errors: string[]; // blocking errors — when non-empty, no reconciliation result may be shown
  statementCents: number;
  registerCents: number;
  checksCents: number;
  depositsCents: number;
  adjustedBankCents: number;
  bookAdjustments: BookAdjustmentRecord[];
  bookAdjustmentCents: number;
  adjustedBookCents: number;
  ledgerTotalCents: number;
  ledgerCount: number; // number of valid client ledger rows
  negativeLedgers: { name: string; cents: number }[];
  bankBookDifferenceCents: number;
  bookLedgerDifferenceCents: number;
  bankLedgerDifferenceCents: number;
  issues: ReconciliationIssue[];
  statusLabel: string;
  balanced: boolean; // only meaningful when errors.length === 0
  canGenerate: boolean; // all required inputs present and valid, no blocking errors
}

/**
 * Run the three-way reconciliation. All money math in integer cents:
 *   Adjusted Bank = Statement Ending − Outstanding Checks + Outstanding Deposits
 *   Adjusted Book = Trust Register − Bank Fees + Interest + signed Other Adjustments
 *   PASS when Adjusted Bank = Adjusted Book = Total Client Ledgers.
 *
 * Required: statement ending balance, trust register balance, ≥1 valid ledger.
 * Optional: outstanding checks / deposits (empty rows = 0). Negative checks or
 * deposits are rejected (would reverse the adjusted balance). Negative ledgers
 * are allowed but always reported as a warning, even when totals balance.
 */
export function computeReconciliation(input: ReconciliationInput): ReconciliationResult {
  const errors: string[] = [];
  const statementCents = parseMoneyToCents(input.statementEnding);
  const registerCents = parseMoneyToCents(input.register);

  // ── Required fields ──
  if (input.statementEnding.trim() === "") {
    errors.push("Statement ending balance is required.");
  } else if (statementCents === null) {
    errors.push("Statement ending balance is not a valid amount.");
  }

  if (input.register.trim() === "") {
    errors.push("Trust register balance is required.");
  } else if (registerCents === null) {
    errors.push("Trust register balance is not a valid amount.");
  }

  // ── Optional outstanding items: empty = 0, invalid or negative = blocking ──
  let checksCents = 0;
  let depositsCents = 0;
  input.checks.forEach((raw, i) => {
    const v = parseMoneyToCents(raw);
    if (raw.trim() === "") return; // empty optional row = 0
    if (v === null) {
      errors.push(`Outstanding check ${i + 1} is not a valid amount.`);
      return;
    }
    if (v < 0) {
      errors.push(
        `Outstanding check ${i + 1} cannot be negative — outstanding items must be 0 or more.`
      );
      return;
    }
    checksCents += v;
  });
  input.deposits.forEach((raw, i) => {
    const v = parseMoneyToCents(raw);
    if (raw.trim() === "") return;
    if (v === null) {
      errors.push(`Outstanding deposit ${i + 1} is not a valid amount.`);
      return;
    }
    if (v < 0) {
      errors.push(
        `Outstanding deposit ${i + 1} cannot be negative — outstanding items must be 0 or more.`
      );
      return;
    }
    depositsCents += v;
  });

  // ── Book adjustments: typed, noted audit trail with explicit sign rules ──
  const bookAdjustments: BookAdjustmentRecord[] = [];
  let bookAdjustmentCents = 0;
  (input.bookAdjustments ?? []).forEach((adjustment, i) => {
    const label = `${adjustment.type} adjustment ${i + 1}`;
    const amountProvided = adjustment.amount.trim() !== "";
    const noteProvided = adjustment.note.trim() !== "";

    if (!amountProvided && !noteProvided) return;
    if (!amountProvided) {
      errors.push(`${label} requires an amount.`);
      return;
    }

    const enteredCents = parseMoneyToCents(adjustment.amount);
    if (enteredCents === null) {
      errors.push(`${label} is not a valid amount.`);
      return;
    }
    if (
      (adjustment.type === "Bank Fee" || adjustment.type === "Interest") &&
      enteredCents < 0
    ) {
      errors.push(`${label} must be 0 or more.`);
      return;
    }
    if (!noteProvided) {
      errors.push(`${label} requires a short note.`);
      return;
    }

    const effectCents = adjustment.type === "Bank Fee" ? -enteredCents : enteredCents;
    bookAdjustments.push({
      type: adjustment.type,
      note: adjustment.note.trim(),
      enteredCents,
      effectCents,
    });
    bookAdjustmentCents += effectCents;
  });

  // ── Client ledgers: ≥1 valid row required; negatives allowed but warned ──
  let ledgerTotalCents = 0;
  let ledgerCount = 0;
  const negativeLedgers: { name: string; cents: number }[] = [];
  input.ledgers.forEach((l) => {
    if (l.balance.trim() === "") return; // empty row is not a ledger yet — ignored
    const v = parseMoneyToCents(l.balance);
    if (v === null) {
      errors.push(`Client ledger "${l.name.trim() || "(unnamed)"}" is not a valid amount.`);
      return;
    }
    ledgerTotalCents += v;
    ledgerCount++;
    if (v < 0) {
      negativeLedgers.push({ name: l.name.trim() || "(unnamed)", cents: v });
    }
  });
  if (ledgerCount === 0) {
    errors.push("Add at least one client ledger with a valid balance.");
  }

  const canGenerate = errors.length === 0;
  const adjustedBankCents = statementCents! - checksCents + depositsCents;
  const adjustedBookCents = registerCents! + bookAdjustmentCents;
  const bankBookDifferenceCents = adjustedBankCents - adjustedBookCents;
  const bookLedgerDifferenceCents = adjustedBookCents - ledgerTotalCents;
  const bankLedgerDifferenceCents = adjustedBankCents - ledgerTotalCents;
  const balanced =
    canGenerate && bankBookDifferenceCents === 0 && bookLedgerDifferenceCents === 0;

  const issues: ReconciliationIssue[] = [];
  if (canGenerate && bankBookDifferenceCents !== 0 && bookLedgerDifferenceCents === 0) {
    issues.push({
      location: "Bank to adjusted book",
      recommendedCheck:
        "Review outstanding items, bank fees or interest not yet posted, and possible missing or duplicate bank/book postings.",
    });
  } else if (canGenerate && bankBookDifferenceCents === 0 && bookLedgerDifferenceCents !== 0) {
    issues.push({
      location: "Adjusted book to client ledgers",
      recommendedCheck:
        "Review omitted client ledgers, client-level postings, and the client ledger addition against the adjusted book balance.",
    });
  } else if (canGenerate && bankBookDifferenceCents !== 0 && bookLedgerDifferenceCents !== 0) {
    issues.push({
      location: "Both reconciliation boundaries",
      recommendedCheck:
        "Complete bank-to-book first, then review book-to-ledgers postings and ledger addition.",
    });
  }
  if (canGenerate && negativeLedgers.length > 0) {
    issues.push({
      location: "Client ledger exception",
      recommendedCheck:
        "Review negative client ledger balances before signing, even when the three arithmetic totals agree.",
    });
  }
  const statusLabel = !balanced
    ? "OUT OF BALANCE"
    : issues.length > 0
      ? "Arithmetic Balanced — Exception Requires Review"
      : "BALANCED — all three figures agree to the cent";

  return {
    errors,
    statementCents: statementCents ?? 0,
    registerCents: registerCents ?? 0,
    checksCents,
    depositsCents,
    adjustedBankCents,
    bookAdjustments,
    bookAdjustmentCents,
    adjustedBookCents,
    ledgerTotalCents,
    ledgerCount,
    negativeLedgers,
    bankBookDifferenceCents,
    bookLedgerDifferenceCents,
    bankLedgerDifferenceCents,
    issues,
    statusLabel,
    balanced,
    canGenerate,
  };
}
