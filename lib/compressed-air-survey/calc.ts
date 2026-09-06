import {
  CALCULATION_VERSION,
  type FlowUnit,
  type LeakComputed,
  type LeakEntry,
  type SurveyReport,
  type SurveySettings,
  type SurveySummary,
} from "./types.ts";
import { rankRepairQueue } from "./queue.ts";

const LPS_TO_SCFM = 2.11888;
const M3MIN_TO_SCFM = 35.3147;

function isBad(n: number): boolean {
  return !Number.isFinite(n) || Number.isNaN(n);
}

export function toSCFM(value: number, unit: FlowUnit): number {
  if (isBad(value) || value < 0) return 0;
  switch (unit) {
    case "SCFM":
    case "CFM":
      return value;
    case "L/s":
      return value * LPS_TO_SCFM;
    case "m³/min":
      return value * M3MIN_TO_SCFM;
  }
}

export function annualHoursOf(s: SurveySettings): number {
  if (isBad(s.hoursPerDay) || isBad(s.daysPerYear)) return 0;
  return s.hoursPerDay * s.daysPerYear;
}

function energyCost(scfm: number, s: SurveySettings): {
  leakPowerKW: number;
  annualEnergyKWh: number;
  annualCost: number;
  opportunity: number;
} {
  const hours = annualHoursOf(s);
  const specificPower = isBad(s.specificPower) || s.specificPower <= 0 ? 0 : s.specificPower;
  const control = isBad(s.controlAdjustmentFactor) || s.controlAdjustmentFactor < 0 ? 0 : s.controlAdjustmentFactor;
  const rate = isBad(s.electricityRate) || s.electricityRate < 0 ? 0 : s.electricityRate;
  const realization =
    isBad(s.savingsRealizationFraction) || s.savingsRealizationFraction < 0
      ? 0
      : s.savingsRealizationFraction;
  const leakPowerKW = (scfm / 100) * specificPower * control;
  const annualEnergyKWh = leakPowerKW * hours;
  const annualCost = annualEnergyKWh * rate;
  const opportunity = annualCost * realization;
  return { leakPowerKW, annualEnergyKWh, annualCost, opportunity };
}

export function validateSettings(s: SurveySettings): string[] {
  const errors: string[] = [];
  if (isBad(s.hoursPerDay) || s.hoursPerDay < 0 || s.hoursPerDay > 24) {
    errors.push("Hours per day must be 0–24.");
  }
  if (isBad(s.daysPerYear) || s.daysPerYear < 0 || s.daysPerYear > 366) {
    errors.push("Days per year must be 0–366.");
  }
  if (isBad(s.electricityRate) || s.electricityRate < 0) {
    errors.push("Electricity rate must be >= 0.");
  }
  if (isBad(s.specificPower) || s.specificPower <= 0) {
    errors.push("Specific power must be > 0.");
  }
  if (isBad(s.controlAdjustmentFactor) || s.controlAdjustmentFactor < 0) {
    errors.push("Compressor control adjustment factor must be >= 0.");
  }
  if (isBad(s.savingsRealizationFraction) || s.savingsRealizationFraction < 0 || s.savingsRealizationFraction > 1) {
    errors.push("Savings realization fraction must be 0–1.");
  }
  return errors;
}

export function validateLeak(entry: LeakEntry): string | null {
  if (isBad(entry.baselineFlow) || entry.baselineFlow < 0) return `${entry.tag}: Baseline flow must be >= 0.`;
  if (isBad(entry.pressure) || entry.pressure < 0) return `${entry.tag}: Pressure must be >= 0.`;
  if (entry.estimatedRepairCost !== null && (isBad(entry.estimatedRepairCost) || entry.estimatedRepairCost < 0)) {
    return `${entry.tag}: Estimated repair cost must be >= 0.`;
  }
  return null;
}

export function validateSurvey(s: SurveySettings, entries: LeakEntry[]): string[] {
  return [...validateSettings(s), ...entries.map(validateLeak).filter((e): e is string => e !== null)];
}

export function computeLeak(entry: LeakEntry, s: SurveySettings): LeakComputed {
  const baselineSCFM = toSCFM(entry.baselineFlow, entry.flowUnit);
  const est = energyCost(baselineSCFM, s);
  const estimated = {
    kind: "Estimated Opportunity" as const,
    scfm: baselineSCFM,
    leakPowerKW: est.leakPowerKW,
    annualEnergyKWh: est.annualEnergyKWh,
    annualCost: est.annualCost,
    opportunity: est.opportunity,
  };

  let verified: LeakComputed["verified"] = null;
  let stillLeaking: LeakComputed["stillLeaking"] = null;
  if (entry.retest) {
    const postRepairSCFM = toSCFM(entry.retest.postRepairFlow, entry.retest.flowUnit);
    const closed =
      entry.status === "Verified Closed" &&
      entry.retest.result === "Pass" &&
      postRepairSCFM === 0;
    if (closed) {
      const ver = energyCost(baselineSCFM, s);
      verified = {
        kind: "Verified Result",
        baselineSCFM,
        postRepairSCFM,
        closedSCFM: baselineSCFM,
        leakPowerKW: ver.leakPowerKW,
        annualEnergyKWh: ver.annualEnergyKWh,
        annualCostAvoided: ver.opportunity,
      };
    } else {
      const remainingSCFM = postRepairSCFM;
      const measuredReductionSCFM = Math.max(0, baselineSCFM - remainingSCFM);
      const rem = energyCost(remainingSCFM, s);
      stillLeaking = {
        kind: "Re-tested / Reduced but Still Leaking",
        baselineSCFM,
        postRepairSCFM,
        measuredReductionSCFM,
        remainingSCFM,
        remainingOpportunity: rem.opportunity,
      };
    }
  }

  const hasEstimatedRepairCost = entry.estimatedRepairCost !== null && entry.estimatedRepairCost > 0;
  const paybackMonths =
    hasEstimatedRepairCost && estimated.opportunity > 0
      ? ((entry.estimatedRepairCost as number) / estimated.opportunity) * 12
      : null;
  const actualCost = entry.repair?.actualRepairCost ?? null;
  const actualPaybackMonths =
    actualCost !== null && actualCost > 0 && verified && verified.annualCostAvoided > 0
      ? (actualCost / verified.annualCostAvoided) * 12
      : null;

  return {
    entry,
    baselineSCFM,
    estimated,
    verified,
    stillLeaking,
    hasEstimatedRepairCost,
    paybackMonths,
    actualPaybackMonths,
    inRepairQueue: entry.status === "Open" || entry.status === "Planned" || entry.status === "Failed Re-test",
  };
}

export function buildSurveyReport(s: SurveySettings, entries: LeakEntry[]): SurveyReport {
  const leaks = entries.map((e) => computeLeak(e, s));
  const annualHours = annualHoursOf(s);
  const estimatedOpportunityTotal = leaks.reduce((a, l) => a + l.estimated.opportunity, 0);
  const verifiedResultTotal = leaks.reduce((a, l) => a + (l.verified?.annualCostAvoided ?? 0), 0);
  const remainingOpenOpportunity = leaks
    .filter((l) => l.inRepairQueue)
    .reduce((a, l) => a + (l.stillLeaking?.remainingOpportunity ?? l.estimated.opportunity), 0);
  const awaitingRetestOpportunity = leaks
    .filter((l) => l.entry.status === "Awaiting Re-test")
    .reduce((a, l) => a + l.estimated.opportunity, 0);
  const totalEstimatedRepairCost = leaks
    .filter((l) => l.hasEstimatedRepairCost)
    .reduce((a, l) => a + (l.entry.estimatedRepairCost || 0), 0);
  const totalActualRepairCost = leaks.reduce((a, l) => a + (l.entry.repair?.actualRepairCost || 0), 0);
  const overallPaybackMonths =
    totalEstimatedRepairCost > 0 && estimatedOpportunityTotal > 0
      ? (totalEstimatedRepairCost / estimatedOpportunityTotal) * 12
      : null;

  const summary: SurveySummary = {
    totalLeaks: leaks.length,
    totalBaselineSCFM: leaks.reduce((a, l) => a + l.baselineSCFM, 0),
    estimatedOpportunityTotal,
    verifiedResultTotal,
    remainingOpenOpportunity,
    awaitingRetestOpportunity,
    totalEstimatedRepairCost,
    totalActualRepairCost,
    overallPaybackMonths,
    openCount: leaks.filter((l) => l.entry.status === "Open").length,
    plannedCount: leaks.filter((l) => l.entry.status === "Planned").length,
    awaitingRetestCount: leaks.filter((l) => l.entry.status === "Awaiting Re-test").length,
    verifiedClosedCount: leaks.filter((l) => l.verified !== null).length,
    failedRetestCount: leaks.filter((l) => l.entry.status === "Failed Re-test").length,
    calculationVersion: CALCULATION_VERSION,
    annualHours,
  };

  return {
    leaks,
    summary,
    queue: rankRepairQueue(leaks),
    settings: s,
    calculationVersion: CALCULATION_VERSION,
  };
}
