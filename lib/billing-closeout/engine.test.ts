// Calculation tests — Service Job Billing Closeout Checker
// Run: node --test --experimental-strip-types lib/billing-closeout/engine.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildSummaryText,
  computeJob,
  validateJob,
  type ChargeRow,
  type DocumentationMap,
  type JobInputs,
} from "./engine.ts";

function base(overrides: Partial<JobInputs>): JobInputs {
  return {
    jobDescription: "",
    invoiceReference: "",
    currency: "USD",
    labor: [],
    materials: [],
    charges: [],
    documentation: allCompleteDocs(),
    ...overrides,
  };
}

function allCompleteDocs(): DocumentationMap {
  return {
    technicianNotes: "Complete",
    customerApproval: "Complete",
    customerSignature: "Complete",
    requiredPO: "Not Required",
    partsDocumented: "Complete",
    additionalWorkApproval: "Complete",
  };
}

// Demo scenario from the product brief (Commercial AC Repair)
const demoCharges: ChargeRow[] = [
  { id: 3, chargeType: "After-Hours / Emergency Surcharge", expectedAmount: 85, amountBilled: 0 },
  { id: 4, chargeType: "Service / Diagnostic Fee", expectedAmount: 95, amountBilled: 95 },
];

const demoInputs = base({
  jobDescription: "Commercial AC Repair",
  labor: [{ id: 1, role: "Service Technician", hoursWorked: 5, hoursBilled: 4, billingRate: 150 }],
  materials: [{ id: 2, material: "Replacement Valve", quantityUsed: 3, quantityBilled: 2, pricePerUnit: 85 }],
  charges: demoCharges,
});

// TEST A — labor row
test("TEST A: worked 5 / billed 4 / rate 150 → missing 1h, potential $150", () => {
  const r = computeJob(
    base({ labor: [{ id: 1, role: "Tech", hoursWorked: 5, hoursBilled: 4, billingRate: 150 }] })
  );
  assert.equal(r.labor[0].missingHours, 1);
  assert.equal(r.labor[0].potentialUnbilled, 150);
  assert.equal(r.labor[0].overBilled, false);
});

// TEST B — material row
test("TEST B: used 3 / billed 2 / price 85 → missing 1, potential $85", () => {
  const r = computeJob(
    base({ materials: [{ id: 1, material: "Valve", quantityUsed: 3, quantityBilled: 2, pricePerUnit: 85 }] })
  );
  assert.equal(r.materials[0].missingQuantity, 1);
  assert.equal(r.materials[0].potentialUnbilled, 85);
  assert.equal(r.materials[0].overBilled, false);
});

// TEST C — additional charge
test("TEST C: expected charge 85 / billed 0 → potential $85", () => {
  const r = computeJob(
    base({
      charges: [{ id: 1, chargeType: "Trip / Travel Charge", expectedAmount: 85, amountBilled: 0 }],
    })
  );
  assert.equal(r.charges[0].potentialUnbilled, 85);
});

// TEST D — full demo
test("TEST D: demo → total $320, 3 missing items, 0 doc issues, NEEDS REVIEW", () => {
  const r = computeJob(demoInputs);
  assert.equal(r.potentialLabor, 150);
  assert.equal(r.potentialMaterials, 85);
  assert.equal(r.potentialCharges, 85);
  assert.equal(r.potentialTotal, 320);
  assert.equal(r.missingBillingItems, 3);
  assert.equal(r.documentationIssues, 0);
  assert.equal(r.status, "NEEDS REVIEW");
});

// TEST E — over-billed labor
test("TEST E: worked 4 / billed 5 → potential $0, flagged for review", () => {
  const r = computeJob(
    base({ labor: [{ id: 1, role: "Tech", hoursWorked: 4, hoursBilled: 5, billingRate: 150 }] })
  );
  assert.equal(r.labor[0].potentialUnbilled, 0);
  assert.equal(r.labor[0].overBilled, true);
  assert.equal(r.potentialTotal, 0);
});

// TEST F — normal job
test("TEST F: everything matched + docs complete → READY TO INVOICE", () => {
  const r = computeJob(
    base({
      labor: [{ id: 1, role: "Tech", hoursWorked: 4, hoursBilled: 4, billingRate: 150 }],
      materials: [{ id: 2, material: "Valve", quantityUsed: 2, quantityBilled: 2, pricePerUnit: 85 }],
      charges: [{ id: 3, chargeType: "Service / Diagnostic Fee", expectedAmount: 95, amountBilled: 95 }],
    })
  );
  assert.equal(r.potentialTotal, 0);
  assert.equal(r.missingBillingItems, 0);
  assert.equal(r.documentationIssues, 0);
  assert.equal(r.status, "READY TO INVOICE");
});

// TEST G — documentation issue only
test("TEST G: amounts matched but required PO missing → 1 doc issue, NEEDS REVIEW", () => {
  const docs = allCompleteDocs();
  docs.requiredPO = "Missing";
  const r = computeJob(
    base({
      labor: [{ id: 1, role: "Tech", hoursWorked: 4, hoursBilled: 4, billingRate: 150 }],
      documentation: docs,
    })
  );
  assert.equal(r.potentialTotal, 0);
  assert.equal(r.documentationIssues, 1);
  assert.equal(r.status, "NEEDS REVIEW");
});

// Over-billed rows never reduce potential revenue
test("over-billed materials and charges clamp to $0 and are not counted", () => {
  const r = computeJob(
    base({
      materials: [{ id: 1, material: "Valve", quantityUsed: 2, quantityBilled: 3, pricePerUnit: 85 }],
      charges: [{ id: 2, chargeType: "Other", customLabel: "Custom", expectedAmount: 50, amountBilled: 75 }],
    })
  );
  assert.equal(r.materials[0].potentialUnbilled, 0);
  assert.equal(r.charges[0].potentialUnbilled, 0);
  assert.equal(r.materials[0].overBilled, true);
  assert.equal(r.charges[0].overBilled, true);
  assert.equal(r.missingBillingItems, 0);
});

// Validation rejects negative inputs
test("negative hours / quantities / amounts are rejected by validation", () => {
  const errors = validateJob(
    base({
      labor: [{ id: 1, role: "Tech", hoursWorked: -1, hoursBilled: 2, billingRate: -150 }],
      materials: [{ id: 2, material: "V", quantityUsed: -3, quantityBilled: 0, pricePerUnit: 0 }],
      charges: [{ id: 3, chargeType: "Other", expectedAmount: -10, amountBilled: 0 }],
    })
  );
  // negative hoursWorked, negative rate, negative qtyUsed, negative expectedAmount
  assert.equal(errors.length, 4);
});

// Invalid values are guarded in calculation (no NaN / Infinity / crash)
test("NaN and negative inputs are treated as 0 in calculation", () => {
  const r = computeJob(
    base({
      labor: [{ id: 1, role: "Tech", hoursWorked: NaN, hoursBilled: NaN, billingRate: NaN }],
      materials: [{ id: 2, material: "V", quantityUsed: -1, quantityBilled: Infinity, pricePerUnit: NaN }],
    })
  );
  assert.ok(Number.isFinite(r.potentialTotal));
  assert.equal(r.potentialTotal, 0);
  assert.equal(r.status, "READY TO INVOICE");
});

// Very large numbers stay finite
test("very large numbers stay finite", () => {
  const r = computeJob(
    base({
      labor: [{ id: 1, role: "Tech", hoursWorked: 1e9, hoursBilled: 0, billingRate: 1e6 }],
    })
  );
  assert.ok(Number.isFinite(r.potentialTotal));
  assert.equal(r.potentialTotal, 1e15);
});

// Empty job
test("empty job is READY TO INVOICE with zero potential", () => {
  const r = computeJob(base({}));
  assert.equal(r.potentialTotal, 0);
  assert.equal(r.missingBillingItems, 0);
  assert.equal(r.documentationIssues, 0);
  assert.equal(r.status, "READY TO INVOICE");
});

// Copy summary format matches the brief
test("summary text contains job, totals, counts and status", () => {
  const r = computeJob(demoInputs);
  const text = buildSummaryText(demoInputs, r);
  assert.ok(text.includes("Service Job Billing Closeout Review"));
  assert.ok(text.includes("Job: Commercial AC Repair"));
  assert.ok(text.includes("Potential Unbilled Revenue: $320"));
  assert.ok(text.includes("Potential Unbilled Labor: $150"));
  assert.ok(text.includes("Potential Unbilled Materials: $85"));
  assert.ok(text.includes("Potential Unbilled Additional Charges: $85"));
  assert.ok(text.includes("Missing Billing Items: 3"));
  assert.ok(text.includes("Documentation Issues: 0"));
  assert.ok(text.includes("Status: NEEDS REVIEW"));
});
