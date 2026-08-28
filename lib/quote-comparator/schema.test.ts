// Tests — Production Line Quote Comparator
// Run: node --test --experimental-strip-types lib/quote-comparator/schema.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  compareSuppliers,
  convertDraftToSuppliers,
  comparisonCategories,
  type Supplier,
  type DraftSupplier,
} from "./schema.ts";
import { assessSupplierRisks } from "./risk-assessment.ts";
import { demoSuppliers } from "./demo-data.ts";

// ============================================================
// Helpers
// ============================================================

function makeSupplier(
  id: string,
  name: string,
  items: Record<string, { status: "Included" | "Missing" | "Unclear"; value?: string }>
): Supplier {
  return { id, name, items };
}

function allIncluded(): Record<string, { status: "Included" }> {
  const items: Record<string, { status: "Included" }> = {};
  for (const cat of comparisonCategories) {
    for (const item of cat.items) {
      items[item.id] = { status: "Included" };
    }
  }
  return items;
}

// ============================================================
// compareSuppliers — basic
// ============================================================

test("1. Two suppliers compare without error", () => {
  const sA = makeSupplier("a", "Supplier A", { "main-machine": { status: "Included" } });
  const sB = makeSupplier("b", "Supplier B", { "main-machine": { status: "Missing" } });
  const result = compareSuppliers([sA, sB]);
  assert.equal(result.suppliers.length, 2);
  assert.ok(result.missing["a"] !== undefined);
  assert.ok(result.missing["b"] !== undefined);
});

test("2. Three suppliers compare without error", () => {
  const sA = makeSupplier("a", "A", { "main-machine": { status: "Included" } });
  const sB = makeSupplier("b", "B", { "main-machine": { status: "Missing" } });
  const sC = makeSupplier("c", "C", { "main-machine": { status: "Unclear" } });
  const result = compareSuppliers([sA, sB, sC]);
  assert.equal(result.suppliers.length, 3);
});

test("3. Missing items counted correctly", () => {
  const sA = makeSupplier("a", "A", {
    "main-machine": { status: "Included" },
    "auxiliary-equipment": { status: "Missing" },
    "feeding-system": { status: "Missing" },
  });
  const result = compareSuppliers([sA]);
  // Only 2 explicit Missing — Not filled items don't count
  assert.equal(result.missing["a"].length, 2);
  assert.ok(result.missing["a"].includes("Auxiliary Equipment"));
  assert.ok(result.missing["a"].includes("Feeding System"));
});

test("4. Unclear items counted correctly", () => {
  const sA = makeSupplier("a", "A", {
    "main-machine": { status: "Included" },
    "cutting-tools": { status: "Unclear" },
    consumables: { status: "Unclear" },
  });
  const result = compareSuppliers([sA]);
  assert.ok(result.unclear["a"].includes("Cutting Tools"));
  assert.ok(result.unclear["a"].includes("Consumables"));
});

test("5. Different values detected for value-type items", () => {
  const sA = makeSupplier("a", "A", { "total-price": { status: "Included", value: "$80,000" } });
  const sB = makeSupplier("b", "B", { "total-price": { status: "Included", value: "$72,000" } });
  const result = compareSuppliers([sA, sB]);
  assert.ok(result.different.length > 0);
  const priceDiff = result.different.find((d) => d.itemId === "total-price");
  assert.ok(priceDiff);
  assert.equal(priceDiff!.values.length, 2);
});

test("6. Supplier without a field is Not filled, NOT Missing", () => {
  const sA = makeSupplier("a", "A", {}); // no items at all
  const result = compareSuppliers([sA]);
  // Not filled ≠ Missing — missing should be empty
  assert.equal(result.missing["a"].length, 0);
});

test("7. Same values are NOT reported as different", () => {
  const sA = makeSupplier("a", "A", { "total-price": { status: "Included", value: "$80,000" } });
  const sB = makeSupplier("b", "B", { "total-price": { status: "Included", value: "$80,000" } });
  const result = compareSuppliers([sA, sB]);
  const priceDiff = result.different.find((d) => d.itemId === "total-price");
  assert.equal(priceDiff, undefined);
});

// ============================================================
// Commercial Risk
// ============================================================

test("8. Risk Low — no missing, few unclear", () => {
  const items = allIncluded();
  const sA = makeSupplier("a", "A", items);
  const sB = makeSupplier("b", "B", items);
  const result = compareSuppliers([sA, sB]);
  const risks = assessSupplierRisks(result);
  assert.equal(risks[0].riskLevel, "Low");
  assert.equal(risks[1].riskLevel, "Low");
});

test("9. Risk Medium — 1-4 missing items", () => {
  const items = allIncluded();
  items["freight"] = { status: "Missing" };
  items["insurance"] = { status: "Missing" };
  const sA = makeSupplier("a", "A", items);
  const sB = makeSupplier("b", "B", allIncluded());
  const result = compareSuppliers([sA, sB]);
  const risks = assessSupplierRisks(result);
  assert.equal(risks[0].riskLevel, "Medium");
});

test("10. Risk High — missing >= 5", () => {
  const items: Record<string, { status: "Included" | "Missing" }> = allIncluded();
  items["freight"] = { status: "Missing" };
  items["insurance"] = { status: "Missing" };
  items["packing"] = { status: "Missing" };
  items["inland-transport"] = { status: "Missing" };
  items["destination"] = { status: "Missing" };
  const sA = makeSupplier("a", "A", items);
  const sB = makeSupplier("b", "B", allIncluded());
  const result = compareSuppliers([sA, sB]);
  const risks = assessSupplierRisks(result);
  assert.equal(risks[0].riskLevel, "High");
});

test("10b. Risk High — critical category with >= 2 missing", () => {
  const items = allIncluded();
  // Commercial Terms: remove 2 items
  items["total-price"] = { status: "Missing" };
  items["incoterm"] = { status: "Missing" };
  const sA = makeSupplier("a", "A", items);
  const sB = makeSupplier("b", "B", allIncluded());
  const result = compareSuppliers([sA, sB]);
  const risks = assessSupplierRisks(result);
  assert.equal(risks[0].riskLevel, "High");
  assert.ok(risks[0].criticalGaps.includes("Commercial Terms"));
});

test("11. Empty string value = not provided, no difference with single actual value", () => {
  const sA = makeSupplier("a", "A", { "total-price": { status: "Included", value: "" } });
  const sB = makeSupplier("b", "B", { "total-price": { status: "Included", value: "$50,000" } });
  const result = compareSuppliers([sA, sB]);
  // Only 1 supplier provided actual value → no difference
  const priceDiff = result.different.find((d) => d.itemId === "total-price");
  assert.equal(priceDiff, undefined);
});

test("12. Minimum 2 suppliers with no data does not error", () => {
  const sA = makeSupplier("a", "A", {});
  const sB = makeSupplier("b", "B", {});
  const result = compareSuppliers([sA, sB]);
  assert.equal(result.suppliers.length, 2);
  assert.ok(Array.isArray(result.missing["a"]));
  assert.ok(Array.isArray(result.missing["b"]));
});

// ============================================================
// convertDraftToSuppliers
// ============================================================

test("13. convertDraftToSuppliers — status items with explicit status", () => {
  const draft: DraftSupplier = {
    id: "a",
    name: "A",
    items: {
      "main-machine": { status: "Included" },
      "auxiliary-equipment": { status: "Missing" },
    },
  };
  const result = convertDraftToSuppliers([draft]);
  assert.equal(result.length, 1);
  assert.equal(result[0].items["main-machine"].status, "Included");
  assert.equal(result[0].items["auxiliary-equipment"].status, "Missing");
  // Items not set should not be in the output
  assert.equal(result[0].items["feeding-system"], undefined);
});

test("14. convertDraftToSuppliers — value items with value only", () => {
  const draft: DraftSupplier = {
    id: "a",
    name: "A",
    items: {
      "total-price": { value: "$50,000" },
    },
  };
  const result = convertDraftToSuppliers([draft]);
  assert.equal(result[0].items["total-price"].status, "Included");
  assert.equal(result[0].items["total-price"].value, "$50,000");
});

test("15. convertDraftToSuppliers — empty string value excluded", () => {
  const draft: DraftSupplier = {
    id: "a",
    name: "A",
    items: {
      "total-price": { value: "  " },
    },
  };
  const result = convertDraftToSuppliers([draft]);
  assert.equal(result[0].items["total-price"], undefined);
});

test("16. convertDraftToSuppliers — value with explicit Missing status", () => {
  const draft: DraftSupplier = {
    id: "a",
    name: "A",
    items: {
      "total-price": { status: "Missing", value: "$50,000" },
    },
  };
  const result = convertDraftToSuppliers([draft]);
  assert.equal(result[0].items["total-price"].status, "Missing");
});

test("17. convertDraftToSuppliers — Missing status strips value", () => {
  const draft: DraftSupplier = {
    id: "a",
    name: "A",
    items: {
      "total-price": { status: "Missing", value: "$50,000" },
    },
  };
  const result = convertDraftToSuppliers([draft]);
  assert.equal(result[0].items["total-price"].status, "Missing");
  assert.equal(result[0].items["total-price"].value, undefined);
});

// ============================================================
// Not filled ≠ Missing (core product logic)
// ============================================================

test("18. Not filled field does NOT enter missing", () => {
  // sA has no items at all (all Not filled)
  const sA = makeSupplier("a", "A", {});
  const sB = makeSupplier("b", "B", {});
  const result = compareSuppliers([sA, sB]);
  assert.equal(result.missing["a"].length, 0);
  assert.equal(result.missing["b"].length, 0);
});

test("19. Not filled field does NOT enter unclear", () => {
  const sA = makeSupplier("a", "A", {});
  const sB = makeSupplier("b", "B", {});
  const result = compareSuppliers([sA, sB]);
  assert.equal(result.unclear["a"].length, 0);
  assert.equal(result.unclear["b"].length, 0);
});

test("20. Not filled does NOT increase risk missingCount", () => {
  const sA = makeSupplier("a", "A", {}); // all Not filled
  const sB = makeSupplier("b", "B", {});
  const result = compareSuppliers([sA, sB]);
  const risks = assessSupplierRisks(result);
  assert.equal(risks[0].missingCount, 0);
  assert.equal(risks[0].riskLevel, "Low");
});

test("21. Not filled critical-category fields do NOT produce criticalGap", () => {
  // All commercial-terms items are Not filled (not in items)
  const sA = makeSupplier("a", "A", { "main-machine": { status: "Included" } });
  const sB = makeSupplier("b", "B", { "main-machine": { status: "Included" } });
  const result = compareSuppliers([sA, sB]);
  const risks = assessSupplierRisks(result);
  assert.equal(risks[0].criticalGaps.length, 0);
});

test("22. Explicit Missing still enters missing", () => {
  const sA = makeSupplier("a", "A", { "main-machine": { status: "Missing" } });
  const sB = makeSupplier("b", "B", {});
  const result = compareSuppliers([sA, sB]);
  assert.ok(result.missing["a"].includes("Main Machine"));
  assert.equal(result.missing["b"].length, 0); // B has no explicit Missing
});

test("23. Explicit Missing still affects risk", () => {
  const items: Record<string, { status: "Included" | "Missing" }> = {};
  items["main-machine"] = { status: "Missing" };
  items["auxiliary-equipment"] = { status: "Missing" };
  const sA = makeSupplier("a", "A", items);
  const sB = makeSupplier("b", "B", {});
  const result = compareSuppliers([sA, sB]);
  const risks = assessSupplierRisks(result);
  assert.equal(risks[0].missingCount, 2);
  assert.equal(risks[0].riskLevel, "Medium");
});

test("24. Not filled + value from another supplier does NOT produce difference", () => {
  const sA = makeSupplier("a", "A", { "total-price": { status: "Included", value: "$80,000" } });
  const sB = makeSupplier("b", "B", {}); // Not filled
  const result = compareSuppliers([sA, sB]);
  const priceDiff = result.different.find((d) => d.itemId === "total-price");
  assert.equal(priceDiff, undefined);
});

test("25. Two suppliers with different values still produces difference", () => {
  const sA = makeSupplier("a", "A", { "total-price": { status: "Included", value: "$80,000" } });
  const sB = makeSupplier("b", "B", { "total-price": { status: "Included", value: "$72,000" } });
  const result = compareSuppliers([sA, sB]);
  const priceDiff = result.different.find((d) => d.itemId === "total-price");
  assert.ok(priceDiff);
  assert.equal(priceDiff!.values.length, 2);
});

test("26. Not filled does NOT generate supplier question", () => {
  const sA = makeSupplier("a", "A", {}); // all Not filled
  const sB = makeSupplier("b", "B", {});
  const result = compareSuppliers([sA, sB]);
  assert.equal(result.questions["a"].length, 0);
  assert.equal(result.questions["b"].length, 0);
});

test("27. Comparison Matrix can distinguish Not filled and Missing", () => {
  // sA: main-machine explicitly Missing
  // sB: main-machine Not filled (not in items)
  const sA = makeSupplier("a", "A", { "main-machine": { status: "Missing" } });
  const sB = makeSupplier("b", "B", {});
  const result = compareSuppliers([sA, sB]);
  // sA should have Missing
  assert.ok(result.missing["a"].includes("Main Machine"));
  // sB should NOT have Missing
  assert.equal(result.missing["b"].length, 0);
  // sB's item is simply absent from items
  assert.equal(sB.items["main-machine"], undefined);
});

test("28. Demo data results are NOT broken by Not filled change", () => {
  // demo-data.ts uses explicit statuses, so results should be same as before
  const result = compareSuppliers(demoSuppliers);
  // Supplier A had freight=Missing, insurance=Missing, inland-transport=Missing
  assert.ok(result.missing["supplier-a"].length >= 3);
  // Supplier B had many Missing items
  assert.ok(result.missing["supplier-b"].length > 10);
  // Supplier C had some Unclear
  assert.ok(result.unclear["supplier-c"].length >= 2);
  // Differences should still exist
  assert.ok(result.different.length > 0);
});
