// Calculation tests — Fixed-Fee Matter Profitability Calculator
// Run: node --test --experimental-strip-types lib/matter-profitability/engine.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { computeMatter, validateMatter, type MatterInputs } from "./engine.ts";

function base(overrides: Partial<MatterInputs>): MatterInputs {
  return {
    matterName: "",
    fixedFee: 0,
    currency: "USD",
    team: [],
    otherCosts: [],
    targetMarginPct: 30,
    ...overrides,
  };
}

const demoTeam = [
  { id: 1, role: "Partner", hours: 3, hourlyCost: 160 },
  { id: 2, role: "Associate", hours: 8, hourlyCost: 80 },
  { id: 3, role: "Paralegal", hours: 4, hourlyCost: 40 },
];

test("Case A: full profitability review", () => {
  const m = base({
    fixedFee: 3500,
    team: [{ id: 1, role: "Team", hours: 16, hourlyCost: 80 }], // labor = 1280
    otherCosts: [{ id: 1, description: "Filing", amount: 300 }],
    targetMarginPct: 30,
  });
  const r = computeMatter(m);
  assert.equal(r.laborCost, 1280);
  assert.equal(r.otherCost, 300);
  assert.equal(r.totalCost, 1580);
  assert.equal(r.profit, 1920);
  assert.ok(Math.abs(r.profitMarginPct! - 54.857142) < 1e-4);
  assert.ok(Math.abs(r.targetMarginFee! - 1580 / 0.7) < 1e-9); // 2257.142857
  assert.equal(r.roundedFee, 2260);
  assert.ok(Math.abs(r.effectiveHourlyRate! - 218.75) < 1e-9); // 3500 / 16
});

test("Case B: fee below cost shows negative profit", () => {
  const r = computeMatter(
    base({ fixedFee: 1000, otherCosts: [{ id: 1, description: "X", amount: 2200 }] })
  );
  assert.equal(r.profit, -1200);
  assert.ok(Math.abs(r.profitMarginPct! - -120) < 1e-9);
  assert.ok(Number.isFinite(r.profitMarginPct!));
});

test("Case C: fee = 0 never yields NaN or Infinity", () => {
  const r = computeMatter(
    base({ fixedFee: 0, team: [{ id: 1, role: "A", hours: 5, hourlyCost: 100 }] })
  );
  assert.equal(r.profitMarginPct, null);
  assert.equal(r.laborPctOfFee, null);
  assert.equal(r.otherPctOfFee, null);
  assert.equal(r.profitPctOfFee, null);
  assert.equal(r.profit, -500);
  assert.ok(Number.isFinite(r.targetMarginFee!));
});

test("Case D: hours = 0 never yields Infinity for EHR", () => {
  const r = computeMatter(base({ fixedFee: 3500, team: [{ id: 1, role: "A", hours: 0, hourlyCost: 100 }] }));
  assert.equal(r.effectiveHourlyRate, null);
  assert.equal(r.profitPerHour, null);
});

test("Case E: target margin 100% is blocked by validation and safe in engine", () => {
  const m = base({ fixedFee: 3500, targetMarginPct: 100 });
  assert.ok(validateMatter(m).length > 0);
  const r = computeMatter(m); // engine clamps to 90 — never divides by zero
  assert.ok(Number.isFinite(r.targetMarginFee!));
});

test("Demo matter matches spec figures", () => {
  const m = base({
    matterName: "Standard Business Formation",
    fixedFee: 3500,
    team: demoTeam,
    otherCosts: [{ id: 1, description: "Filing / Admin", amount: 300 }],
    targetMarginPct: 30,
  });
  const r = computeMatter(m);
  assert.equal(r.totalHours, 15);
  assert.equal(r.laborCost, 1280); // 480 + 640 + 160
  assert.equal(r.totalCost, 1580);
  assert.equal(r.profit, 1920);
  assert.ok(Math.abs(r.profitMarginPct! - 54.857142) < 1e-4);
  assert.ok(Math.abs(r.effectiveHourlyRate! - 233.3333) < 1e-3); // 3500 / 15
  assert.ok(Math.abs(r.profitPerHour! - 128) < 1e-9); // 1920 / 15
});

test("Negative inputs are rejected by validation and neutralized in engine", () => {
  const m = base({
    fixedFee: -100,
    team: [{ id: 1, role: "A", hours: -2, hourlyCost: 50 }],
    otherCosts: [{ id: 1, description: "X", amount: -10 }],
  });
  assert.equal(validateMatter(m).length, 3);
  const r = computeMatter(m);
  assert.equal(r.totalHours, 0);
  assert.equal(r.laborCost, 0);
  assert.equal(r.otherCost, 0);
  assert.ok(Number.isFinite(r.profit));
});

test("Huge numbers stay finite", () => {
  const r = computeMatter(
    base({ fixedFee: 1e15, team: [{ id: 1, role: "A", hours: 1e6, hourlyCost: 1e6 }] })
  );
  assert.ok(Number.isFinite(r.profit));
  assert.ok(Number.isFinite(r.targetMarginFee!));
});
