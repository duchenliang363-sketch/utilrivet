import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compareQuotes, type SupplierQuote } from "./comparison.ts";
import { checkQuote } from "./engine.ts";

let quoteSeq = 0;
function makeQuote(name: string, text: string): SupplierQuote {
  return { id: `quote-${++quoteSeq}`, name, result: checkQuote(text) };
}

describe("compareQuotes", () => {
  it("1. Detects price difference between two quotes", () => {
    const a = makeQuote("Supplier A", "Total Price: 100000\nCurrency: CNY");
    const b = makeQuote("Supplier B", "Total Price: 90000\nCurrency: CNY");
    const summary = compareQuotes([a, b]);

    assert.ok(summary.priceDifference);
    assert.equal(summary.priceDifference.lower, "Supplier B");
    assert.equal(summary.priceDifference.amount, 10000);
    assert.equal(summary.priceDifference.percentage, 11.1);
  });

  it("2. RMB and CNY treated as same currency", () => {
    const a = makeQuote("Supplier A", "Total Price: 100000\nCurrency: RMB");
    const b = makeQuote("Supplier B", "Total Price: 90000\nCurrency: CNY");
    const summary = compareQuotes([a, b]);

    // Both should normalize to CNY, so no currency difference
    const currencyRow = summary.rows.find((r) => r.fieldId === "currency");
    assert.ok(currencyRow);
    assert.equal(currencyRow.values[0], "CNY");
    assert.equal(currencyRow.values[1], "CNY");
  });

  it("3. Detects quantity difference as comparability issue", () => {
    const a = makeQuote("Supplier A", "Total Price: 100000\nQuantity: 6 sets\nCurrency: CNY");
    const b = makeQuote("Supplier B", "Total Price: 90000\nQuantity: 4 sets\nCurrency: CNY");
    const summary = compareQuotes([a, b]);

    assert.equal(summary.assessment.comparable, false);
    assert.ok(summary.assessment.reasons.some((r) => r.includes("Quantity")));
  });

  it("4. Detects tax basis difference", () => {
    const a = makeQuote("Supplier A", "Total Price: 100000\nCurrency: CNY\nTaxes: 13% VAT included");
    const b = makeQuote("Supplier B", "Total Price: 90000\nCurrency: CNY\nTaxes: Prices exclude VAT");
    const summary = compareQuotes([a, b]);

    assert.equal(summary.assessment.comparable, false);
    assert.ok(summary.assessment.reasons.some((r) => r.includes("Tax basis")));
  });

  it("5. Comparable quotes produce positive conclusion", () => {
    const a = makeQuote("Supplier A", "Total Price: 100000\nCurrency: CNY\nQuantity: 5 sets");
    const b = makeQuote("Supplier B", "Total Price: 90000\nCurrency: CNY\nQuantity: 5 sets");
    const summary = compareQuotes([a, b]);

    assert.equal(summary.assessment.comparable, true);
    assert.ok(summary.conclusion.includes("Supplier B"));
    assert.ok(summary.conclusion.includes("lower"));
  });

  it("6. Placeholder values detected as UNCLEAR", () => {
    const a = makeQuote("Supplier A", "Lead Time: ___ days after contract\nCurrency: CNY\nTotal Price: 100000");
    const leadTime = a.result.checks.find((c) => c.id === "lead-time");
    assert.ok(leadTime);
    assert.equal(leadTime.status, "UNCLEAR");
  });

  it("7. Empty deposit in payment terms → UNCLEAR", () => {
    const a = makeQuote("Supplier A", "Payment Terms: ____ deposit in advance\nCurrency: CNY\nTotal Price: 100000");
    const payment = a.result.checks.find((c) => c.id === "payment-terms");
    assert.ok(payment);
    assert.equal(payment.status, "UNCLEAR");
  });

  it("8. Taxes field does not match total price lines", () => {
    const a = makeQuote("Supplier A", "Grand Total (Incl. 13% Tax): 392685.3\nCurrency: CNY");
    const taxes = a.result.checks.find((c) => c.id === "taxes");
    assert.ok(taxes);
    // Should be MISSING, not PRESENT with value 392685.3
    assert.equal(taxes.status, "MISSING");
  });

  it("9. Single quote returns not comparable", () => {
    const a = makeQuote("Supplier A", "Total Price: 100000\nCurrency: CNY");
    const summary = compareQuotes([a]);
    assert.equal(summary.assessment.comparable, false);
  });

  it("10. Missing total price → no price difference", () => {
    const a = makeQuote("Supplier A", "Currency: CNY");
    const b = makeQuote("Supplier B", "Currency: CNY");
    const summary = compareQuotes([a, b]);
    assert.equal(summary.priceDifference, undefined);
    assert.ok(summary.conclusion.includes("Unable"));
  });

  it("11. rawValues stay index-aligned when a quote lacks a total price", () => {
    const a = makeQuote("Supplier A", "Total Price: 100\nCurrency: CNY");
    const b = makeQuote("Supplier B", "Currency: CNY"); // no total price
    const c = makeQuote("Supplier C", "Total Price: 200\nCurrency: CNY");
    const summary = compareQuotes([a, b, c]);

    assert.ok(summary.priceDifference);
    // Null must sit at B's position — prices must never shift onto the wrong supplier.
    assert.deepEqual(summary.priceDifference.rawValues, [100, null, 200]);
    assert.equal(summary.priceDifference.lower, "Supplier A");
    assert.equal(summary.priceDifference.amount, 100);
  });

  it("12. Conclusion uses the actual highest price for 3+ quotes", () => {
    const a = makeQuote("Supplier A", "Total Price: 100\nCurrency: CNY");
    const b = makeQuote("Supplier B", "Total Price: 150\nCurrency: CNY");
    const c = makeQuote("Supplier C", "Total Price: 90\nCurrency: CNY");
    const summary = compareQuotes([a, b, c]);

    assert.equal(summary.priceDifference!.lower, "Supplier C");
    assert.equal(summary.priceDifference!.amount, 60);
    // Highest is B (150) — not the first other quote (A).
    assert.ok(summary.conclusion.includes("than Supplier B"));
    assert.ok(summary.conclusion.includes("60 less"));
  });

  it("13. Cross-currency quotes produce no numeric price difference", () => {
    const a = makeQuote("Supplier A", "Total Price: 100\nCurrency: USD");
    const b = makeQuote("Supplier B", "Total Price: 900\nCurrency: CNY");
    const summary = compareQuotes([a, b]);

    assert.equal(summary.priceDifference, undefined);
    assert.ok(summary.conclusion.toLowerCase().includes("different currencies"));
    assert.ok(summary.conclusion.includes("exchange rates"));
    // The table row note must not carry a misleading numeric diff either.
    const totalRow = summary.rows.find((r) => r.fieldId === "total-price");
    assert.ok(totalRow?.warning);
    assert.ok(!/\d/.test(totalRow?.difference ?? ""), "row note must not contain a numeric diff");
  });

  it("14. Duplicate supplier names still compare correctly", () => {
    const a = makeQuote("Supplier X", "Total Price: 120\nCurrency: CNY");
    const b = makeQuote("Supplier X", "Total Price: 100\nCurrency: CNY");
    const summary = compareQuotes([a, b]);

    assert.ok(summary.priceDifference);
    assert.equal(summary.priceDifference.amount, 20);
    assert.equal(summary.priceDifference.lower, "Supplier X");
    assert.deepEqual(summary.priceDifference.rawValues, [120, 100]);
  });

  it("15. Identical total prices produce a same-price conclusion", () => {
    const a = makeQuote("Supplier A", "Total Price: 100\nCurrency: CNY");
    const b = makeQuote("Supplier B", "Total Price: 100\nCurrency: CNY");
    const summary = compareQuotes([a, b]);

    assert.ok(summary.priceDifference);
    assert.equal(summary.priceDifference.amount, 0);
    assert.ok(summary.conclusion.includes("same total price"));
  });

  it("16. A missing currency does not block comparison when the rest match", () => {
    const a = makeQuote("Supplier A", "Total Price: 100\nCurrency: USD");
    const b = makeQuote("Supplier B", "Total Price: 90");
    const summary = compareQuotes([a, b]);

    assert.ok(summary.priceDifference);
    assert.deepEqual(summary.priceDifference.rawValues, [100, 90]);
  });
});
