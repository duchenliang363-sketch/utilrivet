// Compressed Air Leak Survey Report Builder — Survey Engine
// Pure client-side. Per-leak math reuses the verified #004 engine
// (lib/compressed-air/engine.ts) — formulas are never duplicated.

import { calculateLeakCost, type FlowUnit } from "@/lib/compressed-air/engine";

export type SurveyFlowUnit = "CFM" | "L/s";
export type RepairStatus = "Open" | "Planned" | "Repaired";
export type Priority = "HIGH" | "MEDIUM" | "LOW" | "Unrated";

export interface SurveySettings {
  projectName: string;
  facility: string;
  surveyDate: string;
  hoursPerDay: number;
  daysPerYear: number;
  electricityRate: number; // $/kWh
  specificPower: number; // kW / 100 CFM
  recoverablePercentage: number; // %
}

export interface LeakEntry {
  id: string; // L-001, L-002, ...
  location: string;
  equipment: string;
  flow: number;
  flowUnit: SurveyFlowUnit;
  repairCost: number | null; // null / 0 = not provided
  notes: string;
  status: RepairStatus;
}

export interface LeakComputed {
  entry: LeakEntry;
  flowCFM: number;
  leakPowerKW: number;
  annualEnergyKWh: number;
  annualCost: number;
  annualSavings: number;
  hasRepairCost: boolean;
  paybackMonths: number | null; // null when no repair cost or no savings
  priority: Priority;
}

export interface SurveySummary {
  totalLeaks: number;
  totalFlowCFM: number;
  totalLeakPowerKW: number;
  totalAnnualEnergyKWh: number;
  originalAnnualLoss: number;
  repairedOriginalAnnualLoss: number;
  closedPotentialSavings: number;
  remainingOpenLoss: number; // leaks not yet Repaired
  remainingPotentialSavings: number;
  remainingRepairCost: number; // unrepaired leaks with a repair cost
  overallRemainingPaybackMonths: number | null;
  openCount: number;
  plannedCount: number;
  repairedCount: number;
}

export interface SurveyReport {
  leaks: LeakComputed[];
  summary: SurveySummary;
  priorities: LeakComputed[];
  completed: LeakComputed[];
}

// ─── Validation ───────────────────────────────────────────

function isBad(n: number): boolean {
  return !Number.isFinite(n) || Number.isNaN(n);
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
  if (isBad(s.recoverablePercentage) || s.recoverablePercentage < 0 || s.recoverablePercentage > 100) {
    errors.push("Recoverable leakage must be 0–100%.");
  }
  return errors;
}

export function validateLeak(entry: LeakEntry): string | null {
  if (isBad(entry.flow) || entry.flow < 0) return `${entry.id}: Leak flow must be >= 0.`;
  if (entry.repairCost !== null && (isBad(entry.repairCost) || entry.repairCost < 0)) {
    return `${entry.id}: Repair cost must be >= 0.`;
  }
  return null;
}

export function validateSurvey(s: SurveySettings, entries: LeakEntry[]): string[] {
  return [...validateSettings(s), ...entries.map(validateLeak).filter((e): e is string => e !== null)];
}

// ─── Per-Leak Computation (delegates to #004 engine) ──────

function priorityFor(paybackMonths: number | null): Priority {
  if (paybackMonths === null) return "Unrated";
  if (paybackMonths <= 3) return "HIGH";
  if (paybackMonths <= 12) return "MEDIUM";
  return "LOW";
}

export function computeLeak(entry: LeakEntry, s: SurveySettings): LeakComputed {
  // Reuse #004 exactly: same units, same formulas, same results.
  const r = calculateLeakCost({
    leakFlow: isBad(entry.flow) ? 0 : entry.flow,
    flowUnit: entry.flowUnit as FlowUnit,
    hoursPerDay: s.hoursPerDay,
    daysPerYear: s.daysPerYear,
    electricityRate: s.electricityRate,
    specificPower: s.specificPower,
    repairCost: entry.repairCost && entry.repairCost > 0 ? entry.repairCost : 0,
    recoverablePercentage: s.recoverablePercentage,
  });

  const hasRepairCost = entry.repairCost !== null && entry.repairCost > 0;
  const paybackMonths =
    hasRepairCost && r.annualSavings > 0 ? ((entry.repairCost as number) / r.annualSavings) * 12 : null;

  return {
    entry,
    flowCFM: r.leakFlowCFM,
    leakPowerKW: r.leakPowerKW,
    annualEnergyKWh: r.annualEnergyKWh,
    annualCost: r.annualCost,
    annualSavings: r.annualSavings,
    hasRepairCost,
    paybackMonths,
    priority: priorityFor(paybackMonths),
  };
}

// ─── Survey Aggregation ───────────────────────────────────

const PRIORITY_ORDER: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, Unrated: 3 };

export function buildSurveyReport(s: SurveySettings, entries: LeakEntry[]): SurveyReport {
  const leaks = entries.map((e) => computeLeak(e, s));
  const remaining = leaks.filter((l) => l.entry.status !== "Repaired");
  const completed = leaks.filter((l) => l.entry.status === "Repaired");

  const totalFlowCFM = leaks.reduce((a, l) => a + l.flowCFM, 0);
  const totalLeakPowerKW = leaks.reduce((a, l) => a + l.leakPowerKW, 0);
  const totalAnnualEnergyKWh = leaks.reduce((a, l) => a + l.annualEnergyKWh, 0);
  const originalAnnualLoss = leaks.reduce((a, l) => a + l.annualCost, 0);
  const repairedOriginalAnnualLoss = completed.reduce((a, l) => a + l.annualCost, 0);
  const closedPotentialSavings = completed.reduce((a, l) => a + l.annualSavings, 0);
  const remainingOpenLoss = remaining.reduce((a, l) => a + l.annualCost, 0);
  const remainingPotentialSavings = remaining.reduce((a, l) => a + l.annualSavings, 0);
  const remainingRepairCost = remaining
    .filter((l) => l.hasRepairCost)
    .reduce((a, l) => a + (l.entry.repairCost || 0), 0);

  const overallRemainingPaybackMonths =
    remainingRepairCost > 0 && remainingPotentialSavings > 0
      ? (remainingRepairCost / remainingPotentialSavings) * 12
      : null;

  const summary: SurveySummary = {
    totalLeaks: leaks.length,
    totalFlowCFM,
    totalLeakPowerKW,
    totalAnnualEnergyKWh,
    originalAnnualLoss,
    repairedOriginalAnnualLoss,
    closedPotentialSavings,
    remainingOpenLoss,
    remainingPotentialSavings,
    remainingRepairCost,
    overallRemainingPaybackMonths,
    openCount: leaks.filter((l) => l.entry.status === "Open").length,
    plannedCount: leaks.filter((l) => l.entry.status === "Planned").length,
    repairedCount: leaks.filter((l) => l.entry.status === "Repaired").length,
  };

  // Repair order: priority first, then highest savings.
  const priorities = [...remaining].sort((a, b) => {
    const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    return p !== 0 ? p : b.annualSavings - a.annualSavings;
  });

  return { leaks, summary, priorities, completed };
}

// ─── Copy Summary Text ────────────────────────────────────

function formatUSD(n: number): string {
  if (!Number.isFinite(n)) return "$0";
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function buildSummaryText(s: SurveySettings, report: SurveyReport): string {
  const { summary, priorities, completed } = report;
  const lines: string[] = ["Compressed Air Leak Survey Summary", ""];

  if (s.projectName.trim()) lines.push(`Project: ${s.projectName.trim()}`);
  if (s.facility.trim()) lines.push(`Facility: ${s.facility.trim()}`);
  if (s.surveyDate.trim()) lines.push(`Date: ${s.surveyDate.trim()}`);
  lines.push("");

  lines.push(`Total Leaks: ${summary.totalLeaks}`);
  lines.push(`Total Leak Flow: ${summary.totalFlowCFM.toLocaleString("en-US", { maximumFractionDigits: 1 })} CFM`);
  lines.push(`Original Annual Loss: ${formatUSD(summary.originalAnnualLoss)}`);
  lines.push(`Closed Potential Savings: ${formatUSD(summary.closedPotentialSavings)}`);
  lines.push(`Remaining Annual Loss: ${formatUSD(summary.remainingOpenLoss)}`);
  lines.push(`Remaining Potential Savings: ${formatUSD(summary.remainingPotentialSavings)}`);
  lines.push(`Remaining Repair Cost: ${formatUSD(summary.remainingRepairCost)}`);
  if (summary.overallRemainingPaybackMonths !== null) {
    lines.push(`Overall Remaining Payback: ${summary.overallRemainingPaybackMonths.toFixed(1)} months`);
  }
  lines.push("");
  lines.push("Repair Priorities:");
  lines.push("");

  if (priorities.length === 0) lines.push("None — no Open or Planned leaks remain.", "");

  priorities.forEach((l) => {
    lines.push(`${l.entry.id} — ${l.entry.location.trim() || "No location"}`);
    lines.push(`Annual Savings: ${formatUSD(l.annualSavings)}`);
    if (l.hasRepairCost) {
      lines.push(`Repair Cost: ${formatUSD(l.entry.repairCost || 0)}`);
      if (l.paybackMonths !== null) {
        lines.push(`Payback: ${l.paybackMonths < 1 ? "Less than 1 month" : l.paybackMonths.toFixed(1) + " months"}`);
      }
    }
    lines.push(`Priority: ${l.priority}`);
    lines.push("");
  });

  if (completed.length > 0) {
    lines.push("Completed / Repaired:", "");
    completed.forEach((l) => {
      lines.push(`${l.entry.id} — ${l.entry.location.trim() || "No location"}`);
      lines.push(`Original Annual Loss: ${formatUSD(l.annualCost)}`);
      lines.push(`Closed Potential Savings: ${formatUSD(l.annualSavings)}`);
      lines.push("");
    });
    lines.push("Closed potential savings are estimates from the original survey, not verified savings.");
  }

  return lines.join("\n").trim();
}
