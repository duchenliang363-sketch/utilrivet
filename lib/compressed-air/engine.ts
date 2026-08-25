// Compressed Air Leak Cost Calculator — Calculation Engine
// Pure client-side, no external API.

export type FlowUnit = "CFM" | "L/s" | "m³/min";

export interface LeakInputs {
  leakFlow: number;
  flowUnit: FlowUnit;
  hoursPerDay: number;
  daysPerYear: number;
  electricityRate: number;
  specificPower: number;
  repairCost: number;
  recoverablePercentage: number;
}

export interface LeakResult {
  annualHours: number;
  leakFlowCFM: number;
  leakPowerKW: number;
  annualEnergyKWh: number;
  annualCost: number;
  monthlyCost: number;
  annualSavings: number;
  paybackYears: number;
  paybackMonths: number;
}

// ─── Unit Conversion ───────────────────────────────────────

const LPS_TO_CFM = 2.11888;
const M3MIN_TO_CFM = 35.3147;

export function toCFM(value: number, unit: FlowUnit): number {
  switch (unit) {
    case "CFM":
      return value;
    case "L/s":
      return value * LPS_TO_CFM;
    case "m³/min":
      return value * M3MIN_TO_CFM;
  }
}

// ─── Validation ────────────────────────────────────────────

export function validateInputs(inputs: LeakInputs): string[] {
  const errors: string[] = [];
  if (inputs.leakFlow < 0) errors.push("Leak flow must be >= 0");
  if (inputs.hoursPerDay < 0 || inputs.hoursPerDay > 24) errors.push("Hours per day must be 0–24");
  if (inputs.daysPerYear < 0 || inputs.daysPerYear > 366) errors.push("Days per year must be 0–366");
  if (inputs.electricityRate < 0) errors.push("Electricity rate must be >= 0");
  if (inputs.specificPower <= 0) errors.push("Specific power must be > 0");
  if (inputs.repairCost < 0) errors.push("Repair cost must be >= 0");
  if (inputs.recoverablePercentage < 0 || inputs.recoverablePercentage > 100) errors.push("Recoverable leakage must be 0–100%");
  return errors;
}

// ─── Calculation ───────────────────────────────────────────

export function calculateLeakCost(inputs: LeakInputs): LeakResult {
  const leakFlowCFM = toCFM(inputs.leakFlow, inputs.flowUnit);
  const annualHours = inputs.hoursPerDay * inputs.daysPerYear;
  const leakPowerKW = (leakFlowCFM / 100) * inputs.specificPower;
  const annualEnergyKWh = leakPowerKW * annualHours;
  const annualCost = annualEnergyKWh * inputs.electricityRate;
  const monthlyCost = annualCost / 12;
  const annualSavings = annualCost * (inputs.recoverablePercentage / 100);

  let paybackYears = 0;
  let paybackMonths = 0;
  if (annualSavings > 0 && inputs.repairCost > 0) {
    paybackYears = inputs.repairCost / annualSavings;
    paybackMonths = paybackYears * 12;
  }

  return {
    annualHours,
    leakFlowCFM,
    leakPowerKW,
    annualEnergyKWh,
    annualCost,
    monthlyCost,
    annualSavings,
    paybackYears,
    paybackMonths,
  };
}
