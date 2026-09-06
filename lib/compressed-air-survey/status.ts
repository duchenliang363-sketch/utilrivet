import type { LeakEntry, RepairRecord, RetestRecord } from "./types.ts";

function requireText(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} is required.`);
  return trimmed;
}

function hasCompleteRepair(repair: RepairRecord | null): boolean {
  return Boolean(repair && repair.repairedBy.trim() && repair.repairDate.trim() && repair.actionTaken.trim());
}

function hasCompleteRetest(retest: RetestRecord | null): boolean {
  return Boolean(
    retest &&
      retest.retestDate.trim() &&
      retest.testedBy.trim() &&
      retest.method &&
      Number.isFinite(retest.postRepairFlow) &&
      retest.postRepairFlow >= 0 &&
      (retest.result === "Pass" || retest.result === "Fail"),
  );
}

export function canEnterVerifiedClosed(entry: LeakEntry): boolean {
  return entry.status === "Awaiting Re-test" && hasCompleteRetest(entry.retest) && entry.retest!.result === "Pass";
}

export function applyPlan(entry: LeakEntry): LeakEntry {
  if (entry.status !== "Open" && entry.status !== "Failed Re-test") {
    throw new Error(`Cannot plan a leak in status ${entry.status}.`);
  }
  return { ...entry, status: "Planned" };
}

export function applyRepairCompleted(entry: LeakEntry, repair: RepairRecord): LeakEntry {
  if (entry.status !== "Planned") {
    throw new Error("Repair completed is only allowed from Planned.");
  }
  const next: RepairRecord = {
    repairedBy: requireText(repair.repairedBy, "Repaired by"),
    repairDate: requireText(repair.repairDate, "Repair date"),
    actionTaken: requireText(repair.actionTaken, "Action taken"),
    actualRepairCost:
      repair.actualRepairCost === null || repair.actualRepairCost === undefined
        ? null
        : repair.actualRepairCost,
  };
  if (next.actualRepairCost !== null && (!Number.isFinite(next.actualRepairCost) || next.actualRepairCost < 0)) {
    throw new Error("Actual repair cost must be >= 0.");
  }
  if (!hasCompleteRepair(next)) throw new Error("Repair record is incomplete.");
  return { ...entry, status: "Awaiting Re-test", repair: next };
}

export function applyRetest(entry: LeakEntry, retest: RetestRecord): LeakEntry {
  if (entry.status !== "Awaiting Re-test") {
    throw new Error("Re-test is only allowed from Awaiting Re-test.");
  }
  const next: RetestRecord = {
    ...retest,
    retestDate: requireText(retest.retestDate, "Re-test date"),
    testedBy: requireText(retest.testedBy, "Tested by"),
  };
  if (!hasCompleteRetest(next)) throw new Error("Re-test record is incomplete.");
  if (next.result === "Pass") {
    return { ...entry, status: "Verified Closed", retest: next };
  }
  return { ...entry, status: "Failed Re-test", retest: next };
}

export function returnFailedToQueue(entry: LeakEntry): LeakEntry {
  if (entry.status !== "Failed Re-test") {
    throw new Error("Only Failed Re-test leaks can be returned to the repair queue.");
  }
  return { ...entry, status: "Open" };
}
