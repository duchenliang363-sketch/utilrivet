// ============================================================
// Commercial Risk Assessment — Pure Functions
// ============================================================
// Evaluates supplier risk based on missing / unclear items and
// critical-category gaps.  No React, no side-effects.
// ============================================================

import type { ComparisonResult } from "./schema.ts";
import { comparisonCategories } from "./schema.ts";

export type RiskLevel = "Low" | "Medium" | "High";

export interface SupplierRisk {
  supplierId: string;
  supplierName: string;
  missingCount: number;
  unclearCount: number;
  majorDifferenceCount: number;
  criticalGaps: string[]; // category names with >= 2 missing items
  riskLevel: RiskLevel;
}

// Categories whose missing items raise commercial / delivery risk
const CRITICAL_CATEGORY_IDS = ["commercial-terms", "installation-service"];

// ---------------------------------------------------------------
// Core pure function
// ---------------------------------------------------------------

export function assessSupplierRisks(result: ComparisonResult): SupplierRisk[] {
  return result.suppliers.map((supplier) => {
    const missingItems = result.missing[supplier.id] || [];
    const unclearItems = result.unclear[supplier.id] || [];
    const missingCount = missingItems.length;
    const unclearCount = unclearItems.length;

    // Count major differences this supplier is involved in
    const majorDifferenceCount = result.different.filter((d) =>
      d.values.some((v) => v.supplierName === supplier.name && v.value !== "—")
    ).length;

    // Detect critical-category gaps:
    // For each critical category, count how many items are Missing
    const criticalGaps: string[] = [];
    for (const cat of comparisonCategories) {
      if (!CRITICAL_CATEGORY_IDS.includes(cat.id)) continue;
      const missingInCat = cat.items.filter((item) => {
        const data = supplier.items[item.id];
        return !data || data.status === "Missing";
      }).length;
      if (missingInCat >= 2) {
        criticalGaps.push(cat.name);
      }
    }

    // Risk level rules
    // High: missing >= 5 OR critical category has >= 2 missing items
    // Medium: missing 1-4 OR unclear >= 3
    // Low: otherwise
    let riskLevel: RiskLevel;
    if (missingCount >= 5 || criticalGaps.length > 0) {
      riskLevel = "High";
    } else if (missingCount >= 1 || unclearCount >= 3) {
      riskLevel = "Medium";
    } else {
      riskLevel = "Low";
    }

    return {
      supplierId: supplier.id,
      supplierName: supplier.name,
      missingCount,
      unclearCount,
      majorDifferenceCount,
      criticalGaps,
      riskLevel,
    };
  });
}
