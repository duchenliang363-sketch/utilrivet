import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

type SurveyEngine = typeof import("./engine.ts");
type LeakEntry = import("./engine.ts").LeakEntry;

async function loadEngine(): Promise<SurveyEngine> {
  const enginePath = new URL("./engine.ts", import.meta.url);
  const calculatorPath = new URL("../compressed-air/engine.ts", import.meta.url).href;
  const source = fs
    .readFileSync(enginePath, "utf8")
    .replace("@/lib/compressed-air/engine", calculatorPath);
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);
}

const settings = {
  projectName: "Plant A",
  facility: "Factory",
  surveyDate: "2026-08-29",
  hoursPerDay: 16,
  daysPerYear: 250,
  electricityRate: 0.12,
  specificPower: 18,
  recoverablePercentage: 90,
};

function leak(
  id: string,
  flow: number,
  status: LeakEntry["status"],
  repairCost: number | null,
): LeakEntry {
  return {
    id,
    location: id,
    equipment: "",
    flow,
    flowUnit: "CFM",
    repairCost,
    notes: "",
    status,
  };
}

function assertClose(actual: number, expected: number): void {
  assert.ok(Math.abs(actual - expected) < 1e-9, `expected ${actual} to be close to ${expected}`);
}

test("all-open survey keeps original baseline and treats every leak as remaining opportunity", async () => {
  const { buildSurveyReport } = await loadEngine();
  const report = buildSurveyReport(settings, [
    leak("L-001", 12, "Open", 100),
    leak("L-002", 6, "Open", 200),
  ]);

  assertClose(report.summary.originalAnnualLoss, 1555.2);
  assert.equal(report.summary.repairedOriginalAnnualLoss, 0);
  assert.equal(report.summary.closedPotentialSavings, 0);
  assertClose(report.summary.remainingOpenLoss, 1555.2);
  assertClose(report.summary.remainingPotentialSavings, 1399.68);
  assert.equal(report.summary.remainingRepairCost, 300);
  assert.ok(report.summary.overallRemainingPaybackMonths !== null);
  assert.equal(report.completed.length, 0);
  assert.deepEqual(report.priorities.map((item) => item.entry.id), ["L-001", "L-002"]);
});

test("repaired leak closes future savings, repair cost, payback contribution, and priority", async () => {
  const { buildSurveyReport, buildSummaryText } = await loadEngine();
  const report = buildSurveyReport(settings, [
    leak("L-001", 12, "Open", 100),
    leak("L-002", 6, "Repaired", 200),
  ]);

  assertClose(report.summary.originalAnnualLoss, 1555.2);
  assertClose(report.summary.repairedOriginalAnnualLoss, 518.4);
  assertClose(report.summary.closedPotentialSavings, 466.56);
  assertClose(report.summary.remainingOpenLoss, 1036.8);
  assertClose(report.summary.remainingPotentialSavings, 933.12);
  assert.equal(report.summary.remainingRepairCost, 100);
  assert.ok(report.summary.overallRemainingPaybackMonths !== null);
  assert.deepEqual(report.priorities.map((item) => item.entry.id), ["L-001"]);
  assert.deepEqual(report.completed.map((item) => item.entry.id), ["L-002"]);

  const summaryText = buildSummaryText(settings, report);
  assert.match(summaryText, /Original Annual Loss:/);
  assert.match(summaryText, /Closed Potential Savings:/);
  assert.match(summaryText, /Remaining Annual Loss:/);
  assert.match(summaryText, /Remaining Potential Savings:/);
  assert.match(summaryText, /Remaining Repair Cost:/);
  assert.match(summaryText, /Completed \/ Repaired:/);
  assert.match(summaryText, /not verified savings/);
});

test("all-repaired survey has zero remaining opportunity and no false payback", async () => {
  const { buildSurveyReport } = await loadEngine();
  const report = buildSurveyReport(settings, [
    leak("L-001", 12, "Repaired", 100),
    leak("L-002", 6, "Repaired", 200),
  ]);

  assert.equal(report.summary.remainingOpenLoss, 0);
  assert.equal(report.summary.remainingPotentialSavings, 0);
  assert.equal(report.summary.remainingRepairCost, 0);
  assert.equal(report.summary.overallRemainingPaybackMonths, null);
  assert.ok(Number.isFinite(report.summary.closedPotentialSavings));
  assert.deepEqual(report.priorities, []);
  assert.equal(report.completed.length, 2);
});

test("repaired leak without repair cost does not contaminate remaining calculations", async () => {
  const { buildSurveyReport } = await loadEngine();
  const report = buildSurveyReport(settings, [
    leak("L-001", 12, "Open", 100),
    leak("L-002", 6, "Repaired", null),
  ]);

  assert.equal(report.summary.remainingRepairCost, 100);
  assertClose(report.summary.remainingPotentialSavings, 933.12);
  assert.deepEqual(report.priorities.map((item) => item.entry.id), ["L-001"]);
  assert.deepEqual(report.completed.map((item) => item.entry.id), ["L-002"]);
});

test("open leak without repair cost remains visible with savings and Unrated priority", async () => {
  const { buildSurveyReport } = await loadEngine();
  const report = buildSurveyReport(settings, [leak("L-001", 10, "Open", null)]);

  assert.equal(report.summary.remainingOpenLoss, 864);
  assertClose(report.summary.remainingPotentialSavings, 777.6);
  assert.equal(report.summary.remainingRepairCost, 0);
  assert.equal(report.summary.overallRemainingPaybackMonths, null);
  assert.equal(report.priorities[0].entry.id, "L-001");
  assert.equal(report.priorities[0].priority, "Unrated");
});
