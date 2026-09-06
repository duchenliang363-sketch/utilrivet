// P0-7 Acceptance Tests — Air Leak Survey
// Run: node --test --experimental-strip-types lib/compressed-air-survey/p0-acceptance.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CALCULATION_VERSION,
  DEFAULT_SETTINGS,
  emptyLeak,
  type KeyValueStore,
  type LeakEntry,
  type SurveyProject,
  type SurveySettings,
} from "./types.ts";
import { MemoryStore, createSurveyStore } from "./persist.ts";
import {
  toSCFM,
  computeLeak,
  buildSurveyReport,
  validateSettings,
} from "./calc.ts";
import {
  applyPlan,
  applyRepairCompleted,
  applyRetest,
  returnFailedToQueue,
  canEnterVerifiedClosed,
} from "./status.ts";
import { rankRepairQueue, explainWhyAhead } from "./queue.ts";
import {
  exportProjectJson,
  importProjectJson,
  exportRegisterCsv,
  buildRepairWorkPack,
  buildManagementReport,
} from "./export.ts";
import { buildDemoProject } from "./demo.ts";

function settings(over: Partial<SurveySettings> = {}): SurveySettings {
  return { ...DEFAULT_SETTINGS, hoursPerDay: 16, daysPerYear: 250, electricityRate: 0.12, specificPower: 18, ...over };
}

function leak(over: Partial<LeakEntry> = {}): LeakEntry {
  return {
    ...emptyLeak(over.id ?? "id-1", over.tag ?? "L-001"),
    area: "Packaging",
    exactLocation: "Line 3 coupling",
    asset: "PKG-03",
    component: "Coupling",
    problemDescription: "Audible leak at union",
    pressure: 100,
    baselineFlow: 10,
    flowUnit: "SCFM",
    quantificationMethod: "Ultrasonic instrument",
    sourceReading: "instrument 10 SCFM",
    confidence: "High",
    suggestedAction: "Tighten",
    repairAccess: "Easy",
    operationalImpact: "High",
    urgency: "High",
    estimatedRepairCost: 80,
    ...over,
  };
}

function project(over: Partial<SurveyProject> = {}): SurveyProject {
  const now = "2026-09-06T00:00:00.000Z";
  return {
    schemaVersion: 1,
    id: "proj-1",
    createdAt: now,
    updatedAt: now,
    lastSavedAt: now,
    settings: settings({ projectName: "Plant A" }),
    leaks: [],
    nextTagNumber: 1,
    ...over,
  };
}

// ─── P0-7-1 Persistence ────────────────────────────────────

test("P0-7-1: refresh-equivalent reload keeps leaks and last saved time", () => {
  const memory = new MemoryStore();
  const store = createSurveyStore(memory);
  const created = store.createProject(settings({ projectName: "Alpha" }));
  store.updateActive((p) => ({
    ...p,
    leaks: [leak({ id: created.id + "-l1", tag: "L-001", area: "Warehouse" })],
    nextTagNumber: 2,
  }));

  const savedAt = store.getActive()!.lastSavedAt;
  assert.ok(savedAt);

  const reloaded = createSurveyStore(memory);
  const active = reloaded.getActive();
  assert.ok(active);
  assert.equal(active.settings.projectName, "Alpha");
  assert.equal(active.leaks.length, 1);
  assert.equal(active.leaks[0].area, "Warehouse");
  assert.equal(active.lastSavedAt, savedAt);
});

test("P0-7-1: projects stay isolated", () => {
  const store = createSurveyStore(new MemoryStore());
  const a = store.createProject(settings({ projectName: "A" }));
  store.updateActive((p) => ({ ...p, leaks: [leak({ tag: "L-001", area: "A-only" })] }));
  store.createProject(settings({ projectName: "B" }));
  store.updateActive((p) => ({ ...p, leaks: [leak({ tag: "L-001", area: "B-only" })] }));

  store.setActiveProject(a.id);
  assert.equal(store.getActive()!.leaks[0].area, "A-only");
  assert.equal(store.listProjects().length, 2);
});

test("P0-7-1: JSON export / import restores a project without mixing ids", () => {
  const store = createSurveyStore(new MemoryStore());
  store.createProject(settings({ projectName: "Export Me" }));
  store.updateActive((p) => ({ ...p, leaks: [leak({ tag: "L-009" })] }));
  const json = exportProjectJson(store.getActive()!);

  const other = createSurveyStore(new MemoryStore());
  const imported = importProjectJson(json);
  const restored = other.importProject(imported);

  assert.equal(restored.settings.projectName, "Export Me");
  assert.equal(restored.leaks[0].tag, "L-009");
  assert.notEqual(restored.id, store.getActive()!.id);
});

// ─── P0-7-2 Field capture ──────────────────────────────────

test("P0-7-2: leak record keeps every handover field", () => {
  const entry = leak({
    tag: "A-12",
    area: "Compressor Room",
    exactLocation: "West header, 2nd flange",
    asset: "C-201 dryer inlet",
    component: "Valve",
    problemDescription: "Stem leak under load",
    pressure: 110,
    pressureUnit: "psig",
    baselineFlow: 7.5,
    flowUnit: "SCFM",
    quantificationMethod: "Flow meter",
    sourceReading: "7.5 SCFM meter",
    confidence: "High",
    photoDataUrl: "data:image/png;base64,aaa",
    suggestedAction: "Replace component",
    repairAccess: "Restricted",
    operationalImpact: "Critical",
  });
  const fields = [
    "tag",
    "area",
    "exactLocation",
    "asset",
    "component",
    "problemDescription",
    "pressure",
    "baselineFlow",
    "flowUnit",
    "quantificationMethod",
    "sourceReading",
    "confidence",
    "photoDataUrl",
    "suggestedAction",
    "repairAccess",
    "operationalImpact",
  ] as const;
  for (const key of fields) {
    assert.notEqual(entry[key], undefined, key);
    assert.notEqual(entry[key], "", key);
  }
});

test("P0-7-2: no dB-to-CFM conversion is provided", async () => {
  const src = await import("./calc.ts");
  assert.equal("dbToCfm" in src, false);
  assert.equal("decibelToCfm" in src, false);
  assert.equal("dbToSCFM" in src, false);
});

// ─── P0-7-3 Professional calculation ───────────────────────

test("P0-7-3: SCFM unification uses standard unit factors only", () => {
  assert.equal(toSCFM(10, "SCFM"), 10);
  assert.equal(toSCFM(10, "CFM"), 10);
  assert.ok(Math.abs(toSCFM(1, "L/s") - 2.11888) < 1e-9);
  assert.ok(Math.abs(toSCFM(1, "m³/min") - 35.3147) < 1e-9);
});

test("P0-7-3: estimated opportunity applies specific power, hours, rate, control factor, realization", () => {
  const s = settings({
    hoursPerDay: 10,
    daysPerYear: 200,
    electricityRate: 0.10,
    specificPower: 20,
    controlAdjustmentFactor: 0.5,
    savingsRealizationFraction: 0.8,
  });
  // 10 SCFM → 2 kW raw → 1 kW after control 0.5 → 2000 kWh → $200 → $160 opportunity
  const c = computeLeak(leak({ baselineFlow: 10, flowUnit: "SCFM" }), s);
  assert.equal(c.estimated.kind, "Estimated Opportunity");
  assert.equal(c.estimated.scfm, 10);
  assert.equal(c.estimated.leakPowerKW, 1);
  assert.equal(c.estimated.annualEnergyKWh, 2000);
  assert.equal(c.estimated.annualCost, 200);
  assert.equal(c.estimated.opportunity, 160);
  assert.equal(c.verified, null);
  assert.equal(buildSurveyReport(s, [c.entry]).calculationVersion, CALCULATION_VERSION);
});

test("P0-7-3: verified result is distinct and uses post-repair flow", () => {
  const s = settings({
    hoursPerDay: 10,
    daysPerYear: 200,
    electricityRate: 0.10,
    specificPower: 20,
    controlAdjustmentFactor: 1,
    savingsRealizationFraction: 1,
  });
  const closed = leak({
    baselineFlow: 10,
    status: "Verified Closed",
    repair: { repairedBy: "J. Lee", repairDate: "2026-09-01", actionTaken: "Replaced fitting", actualRepairCost: 40 },
    retest: {
      retestDate: "2026-09-02",
      testedBy: "A. Chen",
      method: "Ultrasonic instrument",
      postRepairFlow: 0,
      flowUnit: "SCFM",
      result: "Pass",
    },
  });
  const c = computeLeak(closed, s);
  assert.ok(c.verified);
  assert.equal(c.verified.kind, "Verified Result");
  assert.equal(c.verified.closedSCFM, 10);
  assert.equal(c.verified.annualCostAvoided, 400);
  assert.notEqual(c.estimated.kind, c.verified.kind);
});

test("P0-7-3: settings validation rejects bad factors", () => {
  const errors = validateSettings(settings({ controlAdjustmentFactor: -1, savingsRealizationFraction: 1.5 }));
  assert.ok(errors.some((e) => /control/i.test(e)));
  assert.ok(errors.some((e) => /realization/i.test(e)));
});

// ─── P0-7-4 Repair queue ───────────────────────────────────

test("P0-7-4: queue order is urgency → impact → access → opportunity → payback", () => {
  const s = settings();
  const leaks: LeakEntry[] = [
    leak({ id: "pay", tag: "L-PAY", urgency: "Low", operationalImpact: "None", repairAccess: "Easy", baselineFlow: 2, estimatedRepairCost: 500 }),
    leak({ id: "opp", tag: "L-OPP", urgency: "Low", operationalImpact: "None", repairAccess: "Easy", baselineFlow: 20, estimatedRepairCost: 50 }),
    leak({ id: "acc", tag: "L-ACC", urgency: "Low", operationalImpact: "None", repairAccess: "Shutdown Required", baselineFlow: 20, estimatedRepairCost: 50 }),
    leak({ id: "imp", tag: "L-IMP", urgency: "Low", operationalImpact: "Critical", repairAccess: "Shutdown Required", baselineFlow: 1, estimatedRepairCost: 50 }),
    leak({ id: "urg", tag: "L-URG", urgency: "Immediate", operationalImpact: "None", repairAccess: "Shutdown Required", baselineFlow: 1, estimatedRepairCost: 50 }),
    leak({
      id: "closed",
      tag: "L-CLS",
      status: "Verified Closed",
      urgency: "Immediate",
      repair: { repairedBy: "x", repairDate: "2026-01-01", actionTaken: "fixed", actualRepairCost: 10 },
      retest: { retestDate: "2026-01-02", testedBy: "y", method: "Flow meter", postRepairFlow: 0, flowUnit: "SCFM", result: "Pass" },
    }),
  ];
  const report = buildSurveyReport(s, leaks);
  assert.deepEqual(
    report.queue.map((q) => q.computed.entry.tag),
    ["L-URG", "L-IMP", "L-OPP", "L-PAY", "L-ACC"],
  );
  assert.ok(report.queue[0].whyAhead.length > 0);
  assert.match(report.queue[0].whyAhead, /urgency|Immediate/i);
});

test("P0-7-4: whyAhead names the first discriminating key", () => {
  const a = computeLeak(leak({ urgency: "Immediate", operationalImpact: "Low" }), settings());
  const b = computeLeak(leak({ id: "2", tag: "L-002", urgency: "Low", operationalImpact: "Critical" }), settings());
  const reason = explainWhyAhead(a, b);
  assert.match(reason, /urgency/i);
  assert.doesNotMatch(reason, /HIGH|MEDIUM|LOW priority/i);
});

test("P0-7-4: HIGH/MEDIUM/LOW payback badges are not produced", () => {
  const report = buildSurveyReport(settings(), [leak({ urgency: "Immediate", operationalImpact: "Critical" })]);
  for (const item of report.queue) {
    assert.equal("priority" in item.computed, false);
  }
  assert.equal("priorities" in report, false);
});

// ─── P0-7-5 Repair + re-test ───────────────────────────────

test("P0-7-5: Open → Planned → Awaiting Re-test → Verified Closed", () => {
  let e = leak({ status: "Open" });
  e = applyPlan(e);
  assert.equal(e.status, "Planned");
  e = applyRepairCompleted(e, {
    repairedBy: "J. Lee",
    repairDate: "2026-09-01",
    actionTaken: "Replaced hose",
    actualRepairCost: 55,
  });
  assert.equal(e.status, "Awaiting Re-test");
  e = applyRetest(e, {
    retestDate: "2026-09-03",
    testedBy: "A. Chen",
    method: "Ultrasonic instrument",
    postRepairFlow: 0,
    flowUnit: "SCFM",
    result: "Pass",
  });
  assert.equal(e.status, "Verified Closed");
});

test("P0-7-5: failed re-test returns to the repair queue", () => {
  let e = applyPlan(leak());
  e = applyRepairCompleted(e, {
    repairedBy: "J. Lee",
    repairDate: "2026-09-01",
    actionTaken: "Tightened",
    actualRepairCost: 20,
  });
  e = applyRetest(e, {
    retestDate: "2026-09-03",
    testedBy: "A. Chen",
    method: "Ultrasonic instrument",
    postRepairFlow: 8,
    flowUnit: "SCFM",
    result: "Fail",
  });
  assert.equal(e.status, "Failed Re-test");
  e = returnFailedToQueue(e);
  assert.equal(e.status, "Open");
  const report = buildSurveyReport(settings(), [e]);
  assert.equal(report.queue.length, 1);
});

test("P0-7-5: Verified Closed is impossible without a re-test", () => {
  const planned = applyPlan(leak());
  assert.equal(canEnterVerifiedClosed(planned), false);
  assert.throws(() =>
    applyRetest(planned, {
      retestDate: "2026-09-03",
      testedBy: "A. Chen",
      method: "Flow meter",
      postRepairFlow: 0,
      flowUnit: "SCFM",
      result: "Pass",
    }),
  );
  const awaiting = applyRepairCompleted(planned, {
    repairedBy: "J. Lee",
    repairDate: "2026-09-01",
    actionTaken: "Replaced fitting",
    actualRepairCost: 40,
  });
  assert.equal(canEnterVerifiedClosed(awaiting), false);
  const missing = { ...awaiting, retest: null, status: "Verified Closed" as const };
  assert.equal(canEnterVerifiedClosed(missing), false);
});

test("P0-7-5: repair and re-test records are required fields", () => {
  const planned = applyPlan(leak());
  assert.throws(() =>
    applyRepairCompleted(planned, { repairedBy: "", repairDate: "2026-09-01", actionTaken: "x", actualRepairCost: 1 }),
  );
  const awaiting = applyRepairCompleted(planned, {
    repairedBy: "J. Lee",
    repairDate: "2026-09-01",
    actionTaken: "Replaced fitting",
    actualRepairCost: 40,
  });
  assert.throws(() =>
    applyRetest(awaiting, {
      retestDate: "",
      testedBy: "A. Chen",
      method: "Flow meter",
      postRepairFlow: 0,
      flowUnit: "SCFM",
      result: "Pass",
    }),
  );
});

// ─── P0-7-6 Outputs ────────────────────────────────────────

test("P0-7-6: work pack, management report, CSV, JSON keep Estimate vs Verified", () => {
  const s = settings({ projectName: "Client Plant", facility: "Demo" });
  const open = leak({ tag: "L-001", status: "Open" });
  const verified = leak({
    id: "v",
    tag: "L-002",
    status: "Verified Closed",
    repair: { repairedBy: "J. Lee", repairDate: "2026-09-01", actionTaken: "Replaced fitting", actualRepairCost: 40 },
    retest: {
      retestDate: "2026-09-02",
      testedBy: "A. Chen",
      method: "Flow meter",
      postRepairFlow: 0,
      flowUnit: "SCFM",
      result: "Pass",
    },
  });
  const report = buildSurveyReport(s, [open, verified]);
  const work = buildRepairWorkPack(project({ settings: s, leaks: [open, verified] }), report);
  const mgmt = buildManagementReport(project({ settings: s, leaks: [open, verified] }), report);
  const csv = exportRegisterCsv(report);
  const json = exportProjectJson(project({ settings: s, leaks: [open, verified] }));

  assert.match(work, /L-001/);
  assert.match(work, /Repair Work Pack/);
  assert.match(mgmt, /Estimated Opportunity/);
  assert.match(mgmt, /Verified Result/);
  assert.match(csv, /Estimated Opportunity/);
  assert.match(csv, /Verified Result/);
  assert.match(json, /Estimated Opportunity|estimatedOpportunity|baselineFlow/);
  assert.match(json, new RegExp(CALCULATION_VERSION));
});

// ─── P0-7-7 Demo project + full chain ──────────────────────

test("P0-7-7: demo project has at least 20 leaks covering required diversity", () => {
  const demo = buildDemoProject();
  assert.ok(demo.leaks.length >= 20);
  const areas = new Set(demo.leaks.map((l) => l.area));
  const flows = new Set(demo.leaks.map((l) => l.baselineFlow));
  const pressures = new Set(demo.leaks.map((l) => l.pressure));
  const components = new Set(demo.leaks.map((l) => l.component));
  const access = new Set(demo.leaks.map((l) => l.repairAccess));
  const impact = new Set(demo.leaks.map((l) => l.operationalImpact));
  const statuses = new Set(demo.leaks.map((l) => l.status));
  assert.ok(areas.size >= 3);
  assert.ok(flows.size >= 5);
  assert.ok(pressures.size >= 3);
  assert.ok(components.size >= 4);
  assert.ok(access.size >= 4);
  assert.ok(impact.size >= 4);
  for (const required of ["Open", "Planned", "Awaiting Re-test", "Verified Closed", "Failed Re-test"]) {
    assert.ok(statuses.has(required as LeakEntry["status"]), required);
  }
});

test("P0-7-7: full chain from new project through export never requires a spreadsheet", () => {
  const store = createSurveyStore(new MemoryStore());
  store.createProject(settings({ projectName: "Chain" }));
  let e = leak({ tag: "L-001" });
  store.updateActive((p) => ({ ...p, leaks: [e], nextTagNumber: 2 }));
  e = applyPlan(store.getActive()!.leaks[0]);
  e = applyRepairCompleted(e, {
    repairedBy: "J. Lee",
    repairDate: "2026-09-01",
    actionTaken: "Replaced hose",
    actualRepairCost: 55,
  });
  e = applyRetest(e, {
    retestDate: "2026-09-03",
    testedBy: "A. Chen",
    method: "Ultrasonic instrument",
    postRepairFlow: 0,
    flowUnit: "SCFM",
    result: "Pass",
  });
  store.updateActive((p) => ({ ...p, leaks: [e] }));
  const report = buildSurveyReport(store.getActive()!.settings, store.getActive()!.leaks);
  assert.equal(report.summary.verifiedClosedCount, 1);
  assert.ok(exportRegisterCsv(report).includes("L-001"));
  assert.ok(exportProjectJson(store.getActive()!).includes("Verified Closed"));
  assert.ok(buildManagementReport(store.getActive()!, report).includes("Verified Result"));
});
