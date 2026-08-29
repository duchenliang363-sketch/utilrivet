import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

type SurveyEngine = typeof import("./engine.ts");
type TrapCondition = import("./engine.ts").TrapCondition;
type TrapEntry = import("./engine.ts").TrapEntry;

async function loadEngine(): Promise<SurveyEngine> {
  const enginePath = new URL("./engine.ts", import.meta.url);
  const source = fs.readFileSync(enginePath, "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);
}

const settings = {
  projectName: "Plant A",
  facility: "Factory",
  surveyDate: "2026-08-29",
  technician: "Inspector",
  hoursPerDay: 10,
  daysPerYear: 400,
  steamCostPer1000Lb: 10,
};

function trap(id: string, condition: TrapCondition, status: TrapEntry["status"]): TrapEntry {
  return {
    id,
    location: id,
    equipment: "",
    trapType: "Thermodynamic",
    pressure: 100,
    pressureUnit: "psi",
    condition,
    steamLoss: 10,
    lossUnit: "lb/hr",
    repairCost: 100,
    notes: "",
    status,
  };
}

const cases: Array<{
  condition: TrapCondition;
  status: TrapEntry["status"];
  recoverable: boolean;
}> = [
  { condition: "Good", status: "Open", recoverable: false },
  { condition: "Good", status: "Repaired", recoverable: false },
  { condition: "Leaking", status: "Open", recoverable: true },
  { condition: "Leaking", status: "Repaired", recoverable: true },
  { condition: "Failed Open", status: "Open", recoverable: true },
  { condition: "Failed Open", status: "Repaired", recoverable: true },
  { condition: "Failed Closed", status: "Open", recoverable: false },
  { condition: "Failed Closed", status: "Repaired", recoverable: false },
  { condition: "Unknown", status: "Open", recoverable: false },
  { condition: "Unknown", status: "Repaired", recoverable: false },
];

for (const scenario of cases) {
  test(`${scenario.condition} + ${scenario.status} follows condition loss and status closure semantics`, async () => {
    const { computeTrap } = await loadEngine();
    const result = computeTrap(trap("T-001", scenario.condition, scenario.status), settings);
    const expectedLbHr = scenario.recoverable ? 10 : 0;
    const expectedAnnualLb = scenario.recoverable ? 40_000 : 0;
    const expectedCost = scenario.recoverable ? 400 : 0;

    assert.equal(result.recoverableSteamLossLbHr, expectedLbHr);
    assert.equal(result.annualSteamLossLb, expectedAnnualLb);
    assert.equal(result.annualLossCost, expectedCost);
    assert.equal(result.annualSavings, expectedCost);

    if (scenario.status === "Repaired" || scenario.condition === "Good") {
      assert.equal(result.priority, null);
      assert.equal(result.paybackMonths, null);
    }
  });
}

test("survey summary uses recoverable conditions while Repaired closes future work", async () => {
  const { buildSurveyReport } = await loadEngine();
  const entries = cases.map((scenario, index) =>
    trap(`T-${String(index + 1).padStart(3, "0")}`, scenario.condition, scenario.status),
  );
  const report = buildSurveyReport(settings, entries);

  assert.equal(report.summary.goodCount, 2);
  assert.equal(report.summary.leakingCount, 2);
  assert.equal(report.summary.failedOpenCount, 2);
  assert.equal(report.summary.failedClosedCount, 2);
  assert.equal(report.summary.unknownCount, 2);
  assert.equal(report.summary.failureRate, 0.6);

  assert.equal(report.summary.totalSteamLossLbHr, 40);
  assert.equal(report.summary.totalAnnualSteamLossLb, 160_000);
  assert.equal(report.summary.originalAnnualLoss, 1_600);
  assert.equal(report.summary.remainingOpenLoss, 800);
  assert.equal(report.summary.potentialAnnualSavings, 800);
  assert.equal(report.summary.remainingRepairCost, 400);

  assert.deepEqual(
    report.priorities.map((item) => item.entry.condition),
    ["Leaking", "Failed Open", "Failed Closed", "Unknown"],
  );
  assert.ok(report.priorities.every((item) => item.entry.status !== "Repaired"));
  assert.equal(report.completed.length, 5);
});

test("copy report uses recoverable and remaining labels without promoting closed work", async () => {
  const { buildSummaryText, buildSurveyReport } = await loadEngine();
  const report = buildSurveyReport(settings, [
    trap("T-001", "Leaking", "Open"),
    trap("T-002", "Failed Open", "Repaired"),
    trap("T-003", "Failed Closed", "Open"),
    trap("T-004", "Unknown", "Open"),
  ]);
  const text = buildSummaryText(settings, report);

  assert.match(text, /Original Recoverable Annual Cost Loss:/);
  assert.match(text, /Remaining Recoverable Annual Cost Loss:/);
  assert.match(text, /Remaining Potential Savings:/);
  assert.match(text, /Remaining Repair Cost:/);
  assert.match(text, /Completed \/ Repaired:/);
  assert.doesNotMatch(text.split("Repair Priorities:")[1].split("Completed \/ Repaired:")[0], /T-002/);
});
