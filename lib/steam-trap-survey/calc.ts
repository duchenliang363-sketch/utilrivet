import {
  CALCULATION_VERSION,
  LOSS_CALCULATION_METHOD,
  type LossUnit,
  type SurveyReport,
  type SurveySettings,
  type SurveySummary,
  type TrapComputed,
  type TrapDiagnosis,
  type TrapEntry,
} from "./types.ts";
import { rankRepairQueue } from "./queue.ts";

const LB_PER_KG = 2.20462;

function isBad(n: number): boolean {
  return !Number.isFinite(n) || Number.isNaN(n);
}

export function toLbHr(value: number, unit: LossUnit): number {
  if (isBad(value) || value < 0) return 0;
  return unit === "kg/hr" ? value * LB_PER_KG : value;
}

export function annualHoursOf(s: SurveySettings): number {
  if (isBad(s.hoursPerDay) || isBad(s.daysPerYear)) return 0;
  return s.hoursPerDay * s.daysPerYear;
}

export function countsRecoverableLoss(diagnosis: TrapDiagnosis): boolean {
  return diagnosis === "Leaking" || diagnosis === "Failed Open";
}

function annualCostFromLbHr(lbHr: number, s: SurveySettings): number {
  const hours = annualHoursOf(s);
  const cost = isBad(s.steamCostPer1000Lb) || s.steamCostPer1000Lb < 0 ? 0 : s.steamCostPer1000Lb;
  return ((lbHr * hours) / 1000) * cost;
}

export function validateSettings(s: SurveySettings): string[] {
  const errors: string[] = [];
  if (isBad(s.hoursPerDay) || s.hoursPerDay < 0 || s.hoursPerDay > 24) {
    errors.push("Hours per day must be 0–24.");
  }
  if (isBad(s.daysPerYear) || s.daysPerYear < 0 || s.daysPerYear > 366) {
    errors.push("Days per year must be 0–366.");
  }
  if (isBad(s.steamCostPer1000Lb) || s.steamCostPer1000Lb < 0) {
    errors.push("Steam cost must be >= 0.");
  }
  return errors;
}

export function validateTrap(entry: TrapEntry): string | null {
  if (isBad(entry.operatingPressure) || entry.operatingPressure < 0) {
    return `${entry.tag}: Operating pressure must be >= 0.`;
  }
  if (isBad(entry.steamLoss) || entry.steamLoss < 0) {
    return `${entry.tag}: Estimated steam loss must be >= 0.`;
  }
  if (entry.estimatedRepairCost !== null && (isBad(entry.estimatedRepairCost) || entry.estimatedRepairCost < 0)) {
    return `${entry.tag}: Estimated repair cost must be >= 0.`;
  }
  return null;
}

export function validateSurvey(s: SurveySettings, entries: TrapEntry[]): string[] {
  return [...validateSettings(s), ...entries.map(validateTrap).filter((e): e is string => e !== null)];
}

export function computeTrap(entry: TrapEntry, s: SurveySettings): TrapComputed {
  const baselineLbHr = countsRecoverableLoss(entry.diagnosis) ? toLbHr(entry.steamLoss, entry.lossUnit) : 0;
  const annualSteamLb = baselineLbHr * annualHoursOf(s);
  const annualCost = annualCostFromLbHr(baselineLbHr, s);
  const estimated = {
    kind: "Estimated Opportunity" as const,
    steamLossLbHr: baselineLbHr,
    annualSteamLb,
    annualCost,
    method: LOSS_CALCULATION_METHOD,
    inputKind: entry.lossInputKind,
  };

  let verified: TrapComputed["verified"] = null;
  let stillLosing: TrapComputed["stillLosing"] = null;
  if (entry.retest) {
    const remainingLbHr = toLbHr(entry.retest.remainingSteamLoss, entry.retest.lossUnit);
    const closed =
      entry.status === "Verified Closed" && entry.retest.result === "Pass" && remainingLbHr === 0;
    if (closed) {
      verified = {
        kind: "Verified Result",
        baselineLbHr,
        remainingLbHr: 0,
        annualCostAvoided: annualCost,
      };
    } else {
      stillLosing = {
        kind: "Re-tested / Reduced but Still Losing",
        baselineLbHr,
        remainingLbHr,
        remainingOpportunity: annualCostFromLbHr(remainingLbHr, s),
      };
    }
  }

  const hasEstimatedRepairCost = entry.estimatedRepairCost !== null && entry.estimatedRepairCost > 0;
  const paybackMonths =
    hasEstimatedRepairCost && estimated.annualCost > 0
      ? ((entry.estimatedRepairCost as number) / estimated.annualCost) * 12
      : null;

  return {
    entry,
    estimated,
    verified,
    stillLosing,
    hasEstimatedRepairCost,
    paybackMonths,
    inRepairQueue:
      entry.status === "Open Finding" || entry.status === "Planned" || entry.status === "Failed Re-test",
  };
}

export function buildSurveyReport(s: SurveySettings, entries: TrapEntry[]): SurveyReport {
  const traps = entries.map((e) => computeTrap(e, s));
  const annualHours = annualHoursOf(s);
  const estimatedOpportunityTotal = traps.reduce((a, t) => a + t.estimated.annualCost, 0);
  const verifiedResultTotal = traps.reduce((a, t) => a + (t.verified?.annualCostAvoided ?? 0), 0);
  const remainingOpenOpportunity = traps
    .filter((t) => t.inRepairQueue)
    .reduce((a, t) => a + (t.stillLosing?.remainingOpportunity ?? t.estimated.annualCost), 0);
  const awaitingRetestOpportunity = traps
    .filter((t) => t.entry.status === "Awaiting Re-test")
    .reduce((a, t) => a + t.estimated.annualCost, 0);

  const countDx = (d: TrapDiagnosis) => traps.filter((t) => t.entry.diagnosis === d).length;
  const findingsCount = traps.filter((t) => t.entry.status !== "Good").length;

  const summary: SurveySummary = {
    totalTraps: traps.length,
    goodCount: countDx("Good"),
    failedOpenCount: countDx("Failed Open"),
    failedClosedCount: countDx("Failed Closed"),
    leakingCount: countDx("Leaking"),
    notTestableCount: countDx("Not Testable"),
    misappliedCount: countDx("Misapplied / Wrong Application"),
    otherIssueCount: countDx("Other Issue"),
    findingsCount,
    estimatedOpportunityTotal,
    verifiedResultTotal,
    remainingOpenOpportunity,
    awaitingRetestOpportunity,
    repairReplaceCount: traps.filter((t) => t.entry.repair !== null).length,
    openFindingCount: traps.filter((t) => t.entry.status === "Open Finding").length,
    plannedCount: traps.filter((t) => t.entry.status === "Planned").length,
    awaitingRetestCount: traps.filter((t) => t.entry.status === "Awaiting Re-test").length,
    verifiedClosedCount: traps.filter((t) => t.verified !== null).length,
    failedRetestCount: traps.filter((t) => t.entry.status === "Failed Re-test").length,
    calculationVersion: CALCULATION_VERSION,
    calculationMethod: LOSS_CALCULATION_METHOD,
    annualHours,
  };

  return {
    traps,
    summary,
    queue: rankRepairQueue(traps),
    settings: s,
    calculationVersion: CALCULATION_VERSION,
  };
}
