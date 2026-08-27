// Calculation tests — IOLTA Trust Account 3-Way Reconciliation
// Run: node --test --experimental-strip-types lib/iolta-reconciliation/engine.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseMoneyToCents,
  formatCents,
  parseCsvLine,
  parseClientCsv,
  computeReconciliation,
  type ReconciliationInput,
} from "./engine.ts";

// ─── P0-1 / P1-3: parseMoneyToCents ────────────────────────────────────────

test("parseMoneyToCents: empty is zero (optional-field semantics)", () => {
  assert.equal(parseMoneyToCents(""), 0);
  assert.equal(parseMoneyToCents("   "), 0);
  assert.equal(parseMoneyToCents(null), null);
});

test("parseMoneyToCents: standard formats", () => {
  assert.equal(parseMoneyToCents("1250.00"), 125000);
  assert.equal(parseMoneyToCents("1250"), 125000);
  assert.equal(parseMoneyToCents("1250.5"), 125050);
  assert.equal(parseMoneyToCents("$1,234.56"), 123456);
  assert.equal(parseMoneyToCents("0.01"), 1);
});

test("parseMoneyToCents: negatives — minus and accounting parens", () => {
  assert.equal(parseMoneyToCents("-250.00"), -25000);
  assert.equal(parseMoneyToCents("(250.00)"), -25000);
  assert.equal(parseMoneyToCents("($1,234.56)"), -123456);
  assert.equal(parseMoneyToCents("(250)"), -25000);
});

test("parseMoneyToCents: garbage is null", () => {
  assert.equal(parseMoneyToCents("abc"), null);
  assert.equal(parseMoneyToCents("12.345"), null);
  assert.equal(parseMoneyToCents("1.2.3"), null);
  assert.equal(parseMoneyToCents("(abc)"), null);
  assert.equal(parseMoneyToCents("--5"), null);
});

test("formatCents: display formatting", () => {
  assert.equal(formatCents(0), "$0.00");
  assert.equal(formatCents(123456), "$1,234.56");
  assert.equal(formatCents(-25000), "-$250.00");
  assert.equal(formatCents(5), "$0.05");
});

// ─── P1-2: CSV ─────────────────────────────────────────────────────────────

test("parseCsvLine: quoted fields with comma and escaped quotes", () => {
  assert.deepEqual(parseCsvLine('"Smith, John",1250.00'), ["Smith, John", "1250.00"]);
  assert.deepEqual(parseCsvLine('"He said ""hi""",-5'), ['He said "hi"', "-5"]);
  assert.deepEqual(parseCsvLine("Plain Name,(250.00)"), ["Plain Name", "(250.00)"]);
});

test("parseClientCsv: header row detected and ignored, not counted as invalid", () => {
  const r = parseClientCsv('Client,Balance\n"Smith, John",1250.00\nJones,300.00');
  assert.equal(r.headerSkipped, true);
  assert.equal(r.skipped, 0);
  assert.equal(r.rows.length, 2);
  assert.equal(r.rows[0].name, "Smith, John");
  assert.equal(r.rows[0].balance, "1250.00");
});

test("parseClientCsv: multi-column rows are skipped, not concatenated", () => {
  const r = parseClientCsv('"Smith, John",1250.00,A,B,C\nJones,300.00');
  assert.equal(r.skipped, 1);
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0].name, "Jones");
});

test("parseClientCsv: invalid balance rows skipped and counted", () => {
  const r = parseClientCsv('Jones,abc\nBrooks,\nLee,300.00');
  assert.equal(r.skipped, 2);
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0].name, "Lee");
});

test("parseClientCsv: accounting negatives and one-column rows", () => {
  const r = parseClientCsv('A,(250.00)\nOnlyOneColumn\nB,-125.25');
  assert.equal(r.skipped, 1);
  assert.equal(r.rows.length, 2);
  assert.equal(parseMoneyToCents(r.rows[0].balance), -25000);
});

// ─── P0-1: required fields — no BALANCED false positive ────────────────────

function base(overrides: Partial<ReconciliationInput>): ReconciliationInput {
  return {
    statementEnding: "1000.00",
    register: "1000.00",
    checks: [],
    deposits: [],
    ledgers: [{ name: "Client A", balance: "1000.00" }],
    ...overrides,
  };
}

test("P0-1: completely empty input must NOT produce BALANCED", () => {
  const r = computeReconciliation(base({ statementEnding: "", register: "", ledgers: [] }));
  assert.equal(r.canGenerate, false);
  assert.equal(r.balanced, false);
  assert.ok(r.errors.some((e) => e.includes("Statement ending balance is required")));
  assert.ok(r.errors.some((e) => e.includes("Trust register balance is required")));
  assert.ok(r.errors.some((e) => e.includes("at least one client ledger")));
});

test("P0-1: missing register and ledger blocked", () => {
  const r = computeReconciliation(base({ register: "", ledgers: [] }));
  assert.equal(r.canGenerate, false);
  assert.equal(r.balanced, false);
});

test("P0-1: empty optional rows mean zero and do not block", () => {
  const r = computeReconciliation(base({ checks: [""], deposits: ["", "0.00"] }));
  assert.equal(r.canGenerate, true);
  assert.equal(r.balanced, true);
  assert.equal(r.adjustedBankCents, 100000);
});

test("P0-1: valid zero-balance reconciliation is BALANCED", () => {
  const r = computeReconciliation(
    base({ statementEnding: "0.00", register: "0", ledgers: [{ name: "A", balance: "0.00" }] })
  );
  assert.equal(r.canGenerate, true);
  assert.equal(r.balanced, true);
});

// ─── Core math: integer cents, no float ────────────────────────────────────

test("core: adjusted bank = statement − checks + deposits", () => {
  const r = computeReconciliation(
    base({
      statementEnding: "5000.00",
      checks: ["100.00", "250.00"],
      deposits: ["350.00"],
      register: "5000.00",
      ledgers: [{ name: "A", balance: "3000.00" }, { name: "B", balance: "2000.00" }],
    })
  );
  assert.equal(r.checksCents, 35000);
  assert.equal(r.depositsCents, 35000);
  assert.equal(r.adjustedBankCents, 500000);
  assert.equal(r.ledgerTotalCents, 500000);
  assert.equal(r.balanced, true);
});

test("core: out of balance reports deltas", () => {
  const r = computeReconciliation(
    base({ register: "1001.00", ledgers: [{ name: "A", balance: "1000.00" }] })
  );
  assert.equal(r.canGenerate, true);
  assert.equal(r.balanced, false);
  assert.equal(r.adjustedBankCents - r.registerCents, -100);
});

test("core: cent precision — no float drift (0.1 + 0.2 style)", () => {
  const r = computeReconciliation(
    base({
      statementEnding: "0.30",
      checks: ["0.10"],
      deposits: [],
      register: "0.20",
      ledgers: [{ name: "A", balance: "0.10" }, { name: "B", balance: "0.10" }],
    })
  );
  assert.equal(r.adjustedBankCents, 20);
  assert.equal(r.ledgerTotalCents, 20);
  assert.equal(r.balanced, true);
});

// ─── P1-3: negative outstanding items blocked ──────────────────────────────

test("P1-3: negative outstanding check blocks reconciliation", () => {
  const r = computeReconciliation(
    base({
      statementEnding: "5000.00",
      checks: ["-100.00"],
      register: "5100.00",
      ledgers: [{ name: "A", balance: "5100.00" }],
    })
  );
  assert.equal(r.canGenerate, false);
  assert.equal(r.balanced, false);
  assert.ok(r.errors.some((e) => e.includes("cannot be negative")));
});

test("P1-3: negative outstanding deposit blocks reconciliation", () => {
  const r = computeReconciliation(base({ deposits: ["(50.00)"] }));
  assert.equal(r.canGenerate, false);
  assert.ok(r.errors.some((e) => e.includes("Outstanding deposit 1")));
});

// ─── Negative ledgers: allowed, warned, never hidden ───────────────────────

test("negative ledger warns even when three-way totals balance", () => {
  const r = computeReconciliation(
    base({
      statementEnding: "900.00",
      register: "900.00",
      ledgers: [
        { name: "Client A", balance: "1000.00" },
        { name: "Client B", balance: "(100.00)" },
      ],
    })
  );
  assert.equal(r.canGenerate, true);
  assert.equal(r.balanced, true); // totals agree…
  assert.equal(r.negativeLedgers.length, 1); // …but the warning must still show
  assert.equal(r.negativeLedgers[0].name, "Client B");
  assert.equal(r.negativeLedgers[0].cents, -10000);
});

test("negative statement and register balances are allowed", () => {
  const r = computeReconciliation(
    base({
      statementEnding: "-100.00",
      register: "(100.00)",
      ledgers: [{ name: "A", balance: "-100.00" }],
    })
  );
  assert.equal(r.canGenerate, true);
  assert.equal(r.balanced, true);
});

test("invalid filled ledger balance blocks with a clear message", () => {
  const r = computeReconciliation(base({ ledgers: [{ name: "A", balance: "oops" }] }));
  assert.equal(r.canGenerate, false);
  assert.ok(r.errors.some((e) => e.includes("not a valid amount")));
});
