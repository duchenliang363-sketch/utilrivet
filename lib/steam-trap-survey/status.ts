import type { RepairRecord, RetestRecord, TrapEntry, TrapHistoryEvent } from "./types.ts";
import { statusForDiagnosis } from "./types.ts";

function requireText(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} is required.`);
  return trimmed;
}

function stamp(): string {
  return new Date().toISOString();
}

export function appendHistory(entry: TrapEntry, event: Omit<TrapHistoryEvent, "at"> & { at?: string }): TrapEntry {
  return {
    ...entry,
    history: [...entry.history, { at: event.at ?? stamp(), kind: event.kind, summary: event.summary, notes: event.notes }],
  };
}

export function applyFinding(entry: TrapEntry): TrapEntry {
  const status = statusForDiagnosis(entry.diagnosis);
  const next: TrapEntry = { ...entry, status };
  return appendHistory(next, {
    kind: entry.diagnosis === "Good" || entry.diagnosis === "Not Testable" ? "Survey" : "Finding",
    summary: `Diagnosis ${entry.diagnosis} → ${status}`,
    notes: entry.notes,
  });
}

export function applyPlan(entry: TrapEntry): TrapEntry {
  if (entry.status !== "Open Finding" && entry.status !== "Failed Re-test") {
    throw new Error(`Cannot plan a trap in status ${entry.status}.`);
  }
  return appendHistory({ ...entry, status: "Planned" }, {
    kind: "Finding",
    summary: "Moved to Planned",
    notes: "",
  });
}

export function applyRepairCompleted(entry: TrapEntry, repair: RepairRecord): TrapEntry {
  if (entry.status !== "Planned") {
    throw new Error("Repair / replace is only allowed from Planned.");
  }
  const nextRepair: RepairRecord = {
    repairedBy: requireText(repair.repairedBy, "Performed by"),
    repairDate: requireText(repair.repairDate, "Action date"),
    actionKind: repair.actionKind,
    actionTaken: requireText(repair.actionTaken, "Action notes"),
    actualRepairCost:
      repair.actualRepairCost === null || repair.actualRepairCost === undefined ? null : repair.actualRepairCost,
  };
  if (nextRepair.actualRepairCost !== null && (!Number.isFinite(nextRepair.actualRepairCost) || nextRepair.actualRepairCost < 0)) {
    throw new Error("Actual repair cost must be >= 0.");
  }
  const kind = nextRepair.actionKind === "Replace" ? "Replacement" : "Repair";
  return appendHistory(
    { ...entry, status: "Awaiting Re-test", repair: nextRepair },
    { kind, summary: `${nextRepair.actionKind} recorded — awaiting re-test`, notes: nextRepair.actionTaken },
  );
}

export function meetsCloseCondition(retest: RetestRecord | null): boolean {
  return Boolean(retest && retest.result === "Pass" && retest.remainingSteamLoss === 0);
}

export function canEnterVerifiedClosed(entry: TrapEntry): boolean {
  return (
    entry.status === "Awaiting Re-test" &&
    Boolean(entry.retest?.retestDate.trim() && entry.retest.testedBy.trim()) &&
    meetsCloseCondition(entry.retest)
  );
}

export function applyRetest(entry: TrapEntry, retest: RetestRecord): TrapEntry {
  if (entry.status !== "Awaiting Re-test") {
    throw new Error("Re-test is only allowed from Awaiting Re-test.");
  }
  const next: RetestRecord = {
    ...retest,
    retestDate: requireText(retest.retestDate, "Re-test date"),
    testedBy: requireText(retest.testedBy, "Tested by"),
    notes: retest.notes ?? "",
  };
  if (!Number.isFinite(next.remainingSteamLoss) || next.remainingSteamLoss < 0) {
    throw new Error("Remaining steam loss must be >= 0.");
  }
  if (next.result === "Pass") {
    if (!meetsCloseCondition(next)) {
      throw new Error("Verified Closed requires a Pass re-test with remaining steam loss of 0.");
    }
    return appendHistory(
      { ...entry, status: "Verified Closed", retest: next },
      { kind: "Closure", summary: "Re-test Pass → Verified Closed", notes: next.notes },
    );
  }
  return appendHistory(
    { ...entry, status: "Failed Re-test", retest: next },
    { kind: "Re-test", summary: "Re-test Fail → Failed Re-test (not verified)", notes: next.notes },
  );
}

export function returnFailedToQueue(entry: TrapEntry): TrapEntry {
  if (entry.status !== "Failed Re-test") {
    throw new Error("Only Failed Re-test traps can be returned to the repair queue.");
  }
  return appendHistory({ ...entry, status: "Open Finding" }, {
    kind: "Finding",
    summary: "Failed Re-test returned to Open Finding",
    notes: "",
  });
}
