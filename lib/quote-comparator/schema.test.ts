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
  // sA has 2 explicit Missing + all other items default to Missing
  assert.ok(result.missing["a"].length > 2);
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

test("6. Supplier without a field treats it as Missing", () => {
  const sA = makeSupplier("a", "A", {}); // no items at all
  const result = compareSuppliers([sA]);
  // Every item should be Missing
  const totalItems = comparisonCategories.reduce((sum, cat) => sum + cat.items.length, 0);
  assert.equal(result.missing["a"].length, totalItems);
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

test("11. Empty string value treated as missing for value-type items", () => {
  const sA = makeSupplier("a", "A", { "total-price": { status: "Included", value: "" } });
  const sB = makeSupplier("b", "B", { "total-price": { status: "Included", value: "$50,000" } });
  const result = compareSuppliers([sA, sB]);
  const priceDiff = result.different.find((d) => d.itemId === "total-price");
  assert.ok(priceDiff);
  // sA value should show as "—" (empty treated as no value)
  const sAVal = priceDiff!.values.find((v) => v.supplierName === "A");
  assert.equal(sAVal!.value, "—");
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
