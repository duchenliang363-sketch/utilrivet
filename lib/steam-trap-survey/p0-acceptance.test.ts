import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEFAULT_SETTINGS, emptyTrap, type TrapEntry, type SurveySettings } from "./types.ts";
import { MemoryStore, createSurveyStore } from "./persist.ts";
import { buildSurveyReport, computeTrap, countsRecoverableLoss } from "./calc.ts";
import {
  applyFinding,
  applyPlan,
  applyRepairCompleted,
  applyRetest,
  returnFailedToQueue,
} from "./status.ts";
import {
  buildFindingsReport,
  buildManagementReport,
  buildRepairWorkPack,
  exportProjectJson,
  exportRegisterCsv,
  importProjectJson,
} from "./export.ts";
import { buildDemoProject } from "./demo.ts";

function settings(over: Partial<SurveySettings> = {}): SurveySettings {
  return {
    ...DEFAULT_SETTINGS,
    projectName: "Demo Food Plant Steam Trap Survey",
    facility: "Demo Food Plant",
    site: "Boiler House",
    hoursPerDay: 16,
    daysPerYear: 300,
    steamCostPer1000Lb: 12,
    ...over,
  };
}

function trap(over: Partial<TrapEntry> = {}): TrapEntry {
  return {
    ...emptyTrap(over.id ?? "id-1", over.tag ?? "T-001"),
    area: "Boiler House",
    location: "Main header",
    application: "Drip leg",
    operatingPressure: 125,
    steamLoss: 18,
    lossInputKind: "measured",
    diagnosis: "Failed Open",
    recommendedAction: "Repair",
    ...over,
  };
}

test("Good and Failed Closed do not create recoverable steam-loss opportunity", () => {
  assert.equal(countsRecoverableLoss("Good"), false);
  assert.equal(countsRecoverableLoss("Failed Closed"), false);
  assert.equal(countsRecoverableLoss("Not Testable"), false);
  assert.equal(countsRecoverableLoss("Leaking"), true);
  assert.equal(countsRecoverableLoss("Failed Open"), true);
  const good = computeTrap(trap({ diagnosis: "Good", status: "Good", steamLoss: 18 }), settings());
  assert.equal(good.estimated.annualCost, 0);
  assert.match(good.estimated.method, /Estimate only/);
  assert.equal(good.estimated.inputKind, "measured");
});

test("temperature and ultrasound do not auto-set diagnosis", () => {
  const src = readFileSync(new URL("./calc.ts", import.meta.url), "utf8");
  assert.doesNotMatch(src, /temperature.*>.*Good/i);
  assert.doesNotMatch(src, /ultrasound.*Failed Open/i);
  const entry = trap({ temperature: "210 F", instrumentReading: "loud", diagnosis: "Good", status: "Good" });
  assert.equal(entry.diagnosis, "Good");
});

test("finding enters repair queue; Good does not", () => {
  const finding = applyFinding(trap({ diagnosis: "Leaking" }));
  assert.equal(finding.status, "Open Finding");
  assert.equal(computeTrap(finding, settings()).inRepairQueue, true);
  const good = applyFinding(trap({ diagnosis: "Good" }));
  assert.equal(good.status, "Good");
  assert.equal(computeTrap(good, settings()).inRepairQueue, false);
  const skip = applyFinding(trap({ diagnosis: "Not Testable" }));
  assert.equal(skip.status, "Not Testable");
  assert.equal(computeTrap(skip, settings()).inRepairQueue, false);
});

test("Trap A: Repair → Pass → Verified Closed; savings not mixed with estimate", () => {
  let entry = applyFinding(trap({ tag: "T-002", diagnosis: "Failed Open", steamLoss: 18 }));
  entry = applyPlan(entry);
  entry = applyRepairCompleted(entry, {
    repairedBy: "J. Ortiz",
    repairDate: "2026-09-12",
    actionKind: "Repair",
    actionTaken: "Rebuilt trap",
    actualRepairCost: 180,
  });
  assert.equal(entry.status, "Awaiting Re-test");
  assert.throws(
    () =>
      applyRetest(entry, {
        retestDate: "2026-09-13",
        testedBy: "A. Chen",
        method: "Ultrasound",
        remainingSteamLoss: 2,
        lossUnit: "lb/hr",
        result: "Pass",
        notes: "still blowing",
      }),
    /remaining steam loss of 0/,
  );
  entry = applyRetest(entry, {
    retestDate: "2026-09-13",
    testedBy: "A. Chen",
    method: "Ultrasound",
    remainingSteamLoss: 0,
    lossUnit: "lb/hr",
    result: "Pass",
    notes: "cycle restored",
  });
  assert.equal(entry.status, "Verified Closed");
  const computed = computeTrap(entry, settings());
  assert.ok(computed.verified);
  assert.equal(computed.verified?.annualCostAvoided, computed.estimated.annualCost);
  assert.equal(Number(computed.verified?.annualCostAvoided.toFixed(1)), 1036.8);
  assert.equal(computed.inRepairQueue, false);
  const kinds = entry.history.map((h) => h.kind);
  assert.ok(kinds.includes("Finding"));
  assert.ok(kinds.includes("Repair"));
  assert.ok(kinds.includes("Closure"));
});

test("Trap B: Replace → Fail → Failed Re-test returns to queue; not verified", () => {
  let entry = applyFinding(trap({ tag: "T-004", diagnosis: "Leaking", steamLoss: 9, recommendedAction: "Replace" }));
  entry = applyPlan(entry);
  entry = applyRepairCompleted(entry, {
    repairedBy: "S. Patel",
    repairDate: "2026-09-12",
    actionKind: "Replace",
    actionTaken: "Replaced trap body",
    actualRepairCost: 420,
  });
  entry = applyRetest(entry, {
    retestDate: "2026-09-13",
    testedBy: "A. Chen",
    method: "Ultrasound",
    remainingSteamLoss: 3,
    lossUnit: "lb/hr",
    result: "Fail",
    notes: "still leaking",
  });
  assert.equal(entry.status, "Failed Re-test");
  const failed = computeTrap(entry, settings());
  assert.equal(failed.verified, null);
  assert.ok(failed.stillLosing);
  assert.equal(failed.stillLosing?.remainingLbHr, 3);
  assert.equal(failed.inRepairQueue, true);
  const report = buildSurveyReport(settings(), [entry]);
  assert.equal(report.summary.verifiedResultTotal, 0);
  assert.equal(report.summary.failedRetestCount, 1);
  entry = returnFailedToQueue(entry);
  assert.equal(entry.status, "Open Finding");
  assert.equal(computeTrap(entry, settings()).inRepairQueue, true);
});

test("refresh-equivalent store keeps traps; JSON backup restore isolates ids", () => {
  const memory = new MemoryStore();
  const store = createSurveyStore(memory);
  store.createProject(settings());
  store.updateActive((p) => ({
    ...p,
    traps: [trap({ tag: "T-001", diagnosis: "Good", status: "Good" })],
    nextTagNumber: 2,
  }));
  const savedAt = store.getActive()!.lastSavedAt;
  const reloaded = createSurveyStore(memory);
  assert.equal(reloaded.getActive()!.traps[0].tag, "T-001");
  assert.equal(reloaded.getActive()!.lastSavedAt, savedAt);

  const json = exportProjectJson(store.getActive()!);
  const other = createSurveyStore(new MemoryStore());
  const restored = other.importProject(importProjectJson(json));
  assert.equal(restored.settings.facility, "Demo Food Plant");
  assert.notEqual(restored.id, store.getActive()!.id);
});

test("demo project covers required diagnoses and report figures stay consistent", () => {
  const demo = buildDemoProject();
  assert.equal(demo.settings.facility, "Demo Food Plant");
  assert.equal(demo.settings.site, "Boiler House");
  assert.equal(demo.traps.length, 10);
  const diagnoses = new Set(demo.traps.map((t) => t.diagnosis));
  for (const required of ["Good", "Failed Open", "Failed Closed", "Leaking", "Not Testable"] as const) {
    assert.ok(diagnoses.has(required), required);
  }
  const report = buildSurveyReport(demo.settings, demo.traps);
  const csv = exportRegisterCsv(report);
  const findings = buildFindingsReport(demo, report);
  const pack = buildRepairWorkPack(demo, report);
  const management = buildManagementReport(demo, report);
  assert.match(csv, /Estimated Opportunity/);
  assert.match(csv, /Verified Result/);
  assert.match(findings, /Survey \/ Findings Report/);
  assert.match(pack, /Repair Work Pack/);
  assert.match(management, /Verified Result \(Verified Closed only\)/);
  assert.doesNotMatch(management, /Estimated Savings/);
  const money = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
  assert.match(management, new RegExp(money(report.summary.estimatedOpportunityTotal).replace("$", "\\$")));
  assert.match(management, new RegExp(money(report.summary.verifiedResultTotal).replace("$", "\\$")));
  assert.ok(report.queue.every((item) => item.computed.inRepairQueue));
  assert.ok(demo.traps.every((t) => t.history.length > 0));
});

test("this round does not rewrite the Air Leak workflow engine", () => {
  const airStatus = readFileSync(new URL("../compressed-air-survey/status.ts", import.meta.url), "utf8");
  const airUi = readFileSync(
    new URL("../../components/tools/CompressedAirLeakSurveyReportBuilder.tsx", import.meta.url),
    "utf8",
  );
  assert.match(airStatus, /Verified Closed requires post-repair flow of 0/);
  assert.match(airUi, /does not convert dB to flow/i);
  assert.match(airUi, /Repair Queue/);
});
