// Steam Trap Survey Report Builder — Survey Engine
// Pure client-side, deterministic. Steam loss is user-entered
// (V1 never claims to compute loss from trap type + pressure).

export type PressureUnit = "psi" | "bar";
export type LossUnit = "lb/hr" | "kg/hr";
export type TrapType =
  | "Thermodynamic"
  | "Inverted Bucket"
  | "Float & Thermostatic"
  | "Thermostatic"
  | "Bimetallic"
  | "Disc"
  | "Other"
  | "Unknown";
export type TrapCondition = "Good" | "Leaking" | "Failed Open" | "Failed Closed" | "Unknown";
export type RepairStatus = "Open" | "Planned" | "Repaired";
export type Priority = "HIGH" | "MEDIUM" | "LOW" | "Unrated" | "Inspection Required";

export const TRAP_TYPES: TrapType[] = [
  "Thermodynamic",
  "Inverted Bucket",
  "Float & Thermostatic",
  "Thermostatic",
  "Bimetallic",
  "Disc",
  "Other",
  "Unknown",
];

export const CONDITIONS: TrapCondition[] = ["Good", "Leaking", "Failed Open", "Failed Closed", "Unknown"];

const PSI_PER_BAR = 14.5038;
const LB_PER_KG = 2.20462;

export interface SurveySettings {
  projectName: string;
  facility: string;
  surveyDate: string;
  technician: string;
  hoursPerDay: number;
  daysPerYear: number;
  steamCostPer1000Lb: number; // $/1,000 lb steam
}

export interface TrapEntry {
  id: string; // T-001, T-002, ...
  location: string;
  equipment: string;
  trapType: TrapType;
  pressure: number;
  pressureUnit: PressureUnit;
  condition: TrapCondition;
  steamLoss: number;
  lossUnit: LossUnit;
  repairCost: number | null; // null / 0 = not provided
  notes: string;
  status: RepairStatus;
}

export interface TrapComputed {
  entry: TrapEntry;
  pressurePsi: number;
  steamLossLbHr: number;
  annualSteamLossLb: number; // condition-counted (Good / Failed Closed / Unknown = 0)
  annualLossCost: number; // condition-counted
  rawAnnualLossCost: number; // entered loss valued at annual hours (reporting only)
  annualSavings: number; // only Leaking + Failed Open
  hasRepairCost: boolean;
  paybackMonths: number | null; // null when no repair cost or no savings
  priority: Priority;
}

export interface SurveySummary {
  totalTraps: number;
  goodCount: number;
  leakingCount: number;
  failedOpenCount: number;
  failedClosedCount: number;
  unknownCount: number;
  failureRate: number; // (Leaking + Failed Open + Failed Closed) / total
  totalSteamLossLbHr: number; // all traps, as entered
  totalAnnualSteamLossLb: number; // all traps, as entered
  originalAnnualLoss: number; // all problem traps (Leaking + Failed Open + Failed Closed)
  remainingOpenLoss: number; // problem traps, status != Repaired
  potentialAnnualSavings: number; // Leaking + Failed Open, status != Repaired
  totalRepairCost: number; // traps with a repair cost
  overallPaybackMonths: number | null; // Open/Planned problem traps with valid savings
  openCount: number;
  plannedCount: number;
  repairedCount: number;
}

export interface SurveyReport {
  traps: TrapComputed[];
  summary: SurveySummary;
  priorities: TrapComputed[]; // excludes Good; HIGH → MEDIUM → LOW → Unrated → Inspection Required
}

// ─── Validation ───────────────────────────────────────────

function isBad(n: number): boolean {
  return !Number.isFinite(n) || Number.isNaN(n);
}

export function validateSettings(s: SurveySettings): string[] {
  const errors: string[] = [];
  if (isBad(s.hoursPerDay) || s.hoursPerDay < 0 || s.hoursPerDay > 24) {
    errors.push("Operating hours per day must be 0–24.");
  }
  if (isBad(s.daysPerYear) || s.daysPerYear < 0 || s.daysPerYear > 366) {
    errors.push("Operating days per year must be 0–366.");
  }
  if (isBad(s.steamCostPer1000Lb) || s.steamCostPer1000Lb < 0) {
    errors.push("Steam cost must be >= 0.");
  }
  return errors;
}

export function validateTrap(entry: TrapEntry): string | null {
  if (isBad(entry.pressure) || entry.pressure < 0) return `${entry.id}: Steam pressure must be >= 0.`;
  if (isBad(entry.steamLoss) || entry.steamLoss < 0) return `${entry.id}: Estimated steam loss must be >= 0.`;
  if (entry.repairCost !== null && (isBad(entry.repairCost) || entry.repairCost < 0)) {
    return `${entry.id}: Repair cost must be >= 0.`;
  }
  return null;
}

export function validateSurvey(s: SurveySettings, entries: TrapEntry[]): string[] {
  return [...validateSettings(s), ...entries.map(validateTrap).filter((e): e is string => e !== null)];
}

// ─── Per-Trap Computation ─────────────────────────────────

function priorityFor(paybackMonths: number | null, condition: TrapCondition): Priority {
  if (condition === "Failed Closed" || condition === "Unknown") return "Inspection Required";
  if (paybackMonths === null) return "Unrated";
  if (paybackMonths <= 3) return "HIGH";
  if (paybackMonths <= 12) return "MEDIUM";
  return "LOW";
}

export function computeTrap(entry: TrapEntry, s: SurveySettings): TrapComputed {
  const hours = isBad(s.hoursPerDay) || isBad(s.daysPerYear) ? 0 : s.hoursPerDay * s.daysPerYear;
  const steamCost = isBad(s.steamCostPer1000Lb) || s.steamCostPer1000Lb < 0 ? 0 : s.steamCostPer1000Lb;

  const lossLbHr = isBad(entry.steamLoss) || entry.steamLoss < 0 ? 0 : entry.steamLoss;
  const steamLossLbHr = entry.lossUnit === "kg/hr" ? lossLbHr * LB_PER_KG : lossLbHr;
  const pressurePsi =
    entry.pressureUnit === "bar"
      ? (isBad(entry.pressure) || entry.pressure < 0 ? 0 : entry.pressure) * PSI_PER_BAR
      : isBad(entry.pressure) || entry.pressure < 0
        ? 0
        : entry.pressure;

  const annualLb = steamLossLbHr * hours;
  const annualCost = (annualLb / 1000) * steamCost;

  // Condition logic: only Leaking / Failed Open generate recoverable loss.
  const countsLoss = entry.condition === "Leaking" || entry.condition === "Failed Open";
  const annualSteamLossLb = countsLoss ? annualLb : 0;
  const annualLossCost = countsLoss ? annualCost : 0;
  const annualSavings = annualLossCost;

  const hasRepairCost = entry.repairCost !== null && entry.repairCost > 0;
  const paybackMonths =
    hasRepairCost && annualSavings > 0 ? ((entry.repairCost as number) / annualSavings) * 12 : null;

  return {
    entry,
    pressurePsi,
    steamLossLbHr,
    annualSteamLossLb,
    annualLossCost,
    rawAnnualLossCost: annualCost,
    annualSavings,
    hasRepairCost,
    paybackMonths,
    priority: priorityFor(paybackMonths, entry.condition),
  };
}

// ─── Survey Aggregation ───────────────────────────────────

const PRIORITY_ORDER: Record<Priority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
  Unrated: 3,
  "Inspection Required": 4,
};

function isProblem(condition: TrapCondition): boolean {
  return condition === "Leaking" || condition === "Failed Open" || condition === "Failed Closed";
}

export function buildSurveyReport(s: SurveySettings, entries: TrapEntry[]): SurveyReport {
  const traps = entries.map((e) => computeTrap(e, s));
  const hours = isBad(s.hoursPerDay) || isBad(s.daysPerYear) ? 0 : s.hoursPerDay * s.daysPerYear;

  const count = (c: TrapCondition) => traps.filter((t) => t.entry.condition === c).length;
  const leakingCount = count("Leaking");
  const failedOpenCount = count("Failed Open");
  const failedClosedCount = count("Failed Closed");

  const failureRate =
    traps.length > 0 ? (leakingCount + failedOpenCount + failedClosedCount) / traps.length : 0;

  const totalSteamLossLbHr = traps.reduce((a, t) => a + t.steamLossLbHr, 0);
  const totalAnnualSteamLossLb = totalSteamLossLbHr * hours;

  const problems = traps.filter((t) => isProblem(t.entry.condition));
  const originalAnnualLoss = problems.reduce((a, t) => a + t.rawAnnualLossCost, 0);
  const remainingOpenLoss = problems
    .filter((t) => t.entry.status !== "Repaired")
    .reduce((a, t) => a + t.rawAnnualLossCost, 0);

  const potentialAnnualSavings = traps
    .filter((t) => t.entry.status !== "Repaired")
    .reduce((a, t) => a + t.annualSavings, 0);

  const totalRepairCost = traps
    .filter((t) => t.hasRepairCost)
    .reduce((a, t) => a + (t.entry.repairCost || 0), 0);

  // Overall payback: Open / Planned problem traps with valid annual savings.
  const paybackTraps = problems.filter(
    (t) => t.entry.status !== "Repaired" && t.annualSavings > 0 && t.hasRepairCost,
  );
  const paybackRepairCost = paybackTraps.reduce((a, t) => a + (t.entry.repairCost || 0), 0);
  const paybackSavings = paybackTraps.reduce((a, t) => a + t.annualSavings, 0);
  const overallPaybackMonths =
    paybackRepairCost > 0 && paybackSavings > 0 ? (paybackRepairCost / paybackSavings) * 12 : null;

  const summary: SurveySummary = {
    totalTraps: traps.length,
    goodCount: count("Good"),
    leakingCount,
    failedOpenCount,
    failedClosedCount,
    unknownCount: count("Unknown"),
    failureRate,
    totalSteamLossLbHr,
    totalAnnualSteamLossLb,
    originalAnnualLoss,
    remainingOpenLoss,
    potentialAnnualSavings,
    totalRepairCost,
    overallPaybackMonths,
    openCount: traps.filter((t) => t.entry.status === "Open").length,
    plannedCount: traps.filter((t) => t.entry.status === "Planned").length,
    repairedCount: traps.filter((t) => t.entry.status === "Repaired").length,
  };

  // Repair order: priority first, then highest annual savings. Good traps need no repair.
  const priorities = traps
    .filter((t) => t.entry.condition !== "Good")
    .sort((a, b) => {
      const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      return p !== 0 ? p : b.annualSavings - a.annualSavings;
    });

  return { traps, summary, priorities };
}

// ─── Copy Summary Text ────────────────────────────────────

function formatUSD(n: number): string {
  if (!Number.isFinite(n)) return "$0";
  return "$" + Math.round(n).toLocaleString("en-US");
}

function formatLb(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return Math.round(n).toLocaleString("en-US") + " lb";
}

export function buildSummaryText(s: SurveySettings, report: SurveyReport): string {
  const { summary, priorities } = report;
  const lines: string[] = ["Steam Trap Survey Summary", ""];

  if (s.projectName.trim()) lines.push(`Project: ${s.projectName.trim()}`);
  if (s.facility.trim()) lines.push(`Facility: ${s.facility.trim()}`);
  if (s.surveyDate.trim()) lines.push(`Survey Date: ${s.surveyDate.trim()}`);
  if (s.technician.trim()) lines.push(`Technician: ${s.technician.trim()}`);
  lines.push("");

  lines.push(`Total Traps: ${summary.totalTraps}`);
  lines.push(`Good: ${summary.goodCount}`);
  lines.push(`Leaking: ${summary.leakingCount}`);
  lines.push(`Failed Open: ${summary.failedOpenCount}`);
  lines.push(`Failed Closed: ${summary.failedClosedCount}`);
  lines.push(`Unknown: ${summary.unknownCount}`);
  lines.push(`Failure / Issue Rate: ${(summary.failureRate * 100).toFixed(1)}%`);
  lines.push("");
  lines.push(`Estimated Annual Steam Loss: ${formatLb(summary.totalAnnualSteamLossLb)}`);
  lines.push(`Estimated Annual Cost Loss: ${formatUSD(summary.originalAnnualLoss)}`);
  lines.push(`Remaining Open Loss: ${formatUSD(summary.remainingOpenLoss)}`);
  lines.push(`Potential Annual Savings: ${formatUSD(summary.potentialAnnualSavings)}`);
  lines.push(`Estimated Repair Cost: ${formatUSD(summary.totalRepairCost)}`);
  if (summary.overallPaybackMonths !== null) {
    lines.push(`Overall Payback: ${summary.overallPaybackMonths.toFixed(1)} months`);
  }
  lines.push("");
  lines.push("Repair Priorities:");
  lines.push("");

  priorities.forEach((t) => {
    lines.push(`${t.entry.id} — ${t.entry.location.trim() || "No location"}`);
    lines.push(`Condition: ${t.entry.condition}`);
    if (t.annualSavings > 0) lines.push(`Annual Savings: ${formatUSD(t.annualSavings)}`);
    if (t.hasRepairCost) {
      lines.push(`Repair Cost: ${formatUSD(t.entry.repairCost || 0)}`);
      if (t.paybackMonths !== null) {
        lines.push(
          `Payback: ${t.paybackMonths < 1 ? "Less than 1 month" : t.paybackMonths.toFixed(1) + " months"}`,
        );
      }
    }
    lines.push(`Priority: ${t.priority}`);
    lines.push("");
  });

  return lines.join("\n").trim();
}
