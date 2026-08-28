import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compareQuotes, type SupplierQuote } from "./comparison.ts";
import { checkQuote } from "./engine.ts";

function makeQuote(name: string, text: string): SupplierQuote {
  return { name, result: checkQuote(text) };
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
});
