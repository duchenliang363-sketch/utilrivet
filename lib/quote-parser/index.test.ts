// Parser tests — XLSX → text → engine pipeline
// Run: node --test --experimental-strip-types lib/quote-parser/index.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQuoteFile } from "./index.ts";
import { checkQuote } from "../quote-checker/engine.ts";

// Build a real XLSX binary in memory (SheetJS) and wrap it as a browser-like File.
async function buildXlsx(rows: string[][]): Promise<File> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Quotation");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new File([buf], "quote.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

test("label cell equal to its column header is skipped — no 'Qty: Qty', no PRESENT false positive", async () => {
  const file = await buildXlsx([
    ["Supplier", "Acme Trading Co., Ltd."],
    [],
    ["Item No", "Description", "Qty", "Unit Price"],
    ["2", "Gadget", "Qty", "7.00"], // "Qty" under the Qty column is a label cell
  ]);
  const parsed = await parseQuoteFile(file);

  assert.ok(!parsed.text.includes("Qty: Qty"), "must not emit 'Qty: Qty'");
  assert.ok(parsed.text.includes("Description: Gadget"));
  assert.ok(parsed.text.includes("Unit Price: 7.00"));

  const r = checkQuote(parsed.text);
  assert.equal(
    r.checks.find((c) => c.id === "quantity")!.status,
    "MISSING",
    "label cell must not fake a PRESENT quantity"
  );
});

test("repeated header row emits nothing — fallback must not leak bare labels", async () => {
  const file = await buildXlsx([
    ["Item No", "Description", "Qty", "Unit Price"],
    ["Item No", "Description", "Qty", "Unit Price"], // repeated header row as data
  ]);
  const parsed = await parseQuoteFile(file);

  const bareLabels = parsed.text
    .split("\n")
    .filter((l) => /^(Item No|Description|Qty|Unit Price)$/.test(l.trim()));
  assert.deepEqual(bareLabels, []);

  const r = checkQuote(parsed.text);
  assert.equal(r.checks.find((c) => c.id === "product")!.status, "MISSING");
  assert.equal(r.checks.find((c) => c.id === "quantity")!.status, "MISSING");
});

test("real data rows still parse to labelled values", async () => {
  const file = await buildXlsx([
    ["Supplier", "Dongguan Jingyi Machinery Co., Ltd."],
    ["Total Price", "230000"],
    ["Currency", "CNY"],
    [],
    ["Item No", "Description", "Qty", "Unit Price", "Total Price"],
    ["1", "Automatic filling line", "1 set", "180000", "180000"],
    ["2", "Conveyor belt", "2 sets", "25000", "50000"],
  ]);
  const parsed = await parseQuoteFile(file);

  assert.equal(parsed.format, "xlsx");
  assert.ok(parsed.text.includes("Supplier: Dongguan Jingyi Machinery Co., Ltd."));
  assert.ok(parsed.text.includes("Total Price: 230000"));
  assert.ok(parsed.text.includes("Qty: 1 set"));
  assert.ok(parsed.text.includes("Qty: 2 sets"));
  assert.ok(parsed.text.includes("Description: Automatic filling line"));

  const r = checkQuote(parsed.text);
  assert.equal(r.checks.find((c) => c.id === "total-price")!.status, "PRESENT");
  assert.equal(r.checks.find((c) => c.id === "quantity")!.status, "PRESENT");
  assert.equal(r.checks.find((c) => c.id === "supplier-name")!.status, "PRESENT");
});
