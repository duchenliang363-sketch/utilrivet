// Condensate Return Savings Calculator — Calculation Engine
// Pure client-side. Estimates are for preliminary energy and cost
// analysis only, not precision thermal design.

export type FlowUnit = "lb/hr" | "kg/hr";
export type TempUnit = "°F" | "°C";

export interface CondensateReturnInputs {
  steamProduction: number;
  flowUnit: FlowUnit;
  currentReturnRate: number; // %
  targetReturnRate: number; // %
  hoursPerDay: number;
  daysPerYear: number;
  condensateTemp: number;
  tempUnit: TempUnit;
  makeupWaterTemp: number;
  boilerEfficiency: number; // %
  fuelCost: number; // $/MMBtu
  waterCost: number; // $/1,000 gal (optional, 0 = omitted)
  sewerCost: number; // $/1,000 gal (optional, 0 = omitted)
  projectCost: number; // $ (optional, 0 = omitted)
}

export interface CondensateReturnResult {
  steamFlowLbHr: number;
  annualHours: number;
  annualSteamLb: number;
  additionalCondensateLb: number;
  waterSavedGal: number;
  recoveredHeatMMBtu: number;
  fuelEnergySavedMMBtu: number;
  fuelSavingsUSD: number;
  waterSavingsUSD: number;
  sewerSavingsUSD: number;
  totalAnnualSavingsUSD: number;
  paybackMonths: number | null;
}

// ─── Unit Conversion ──────────────────────────────────────

const KG_TO_LB = 2.20462;
const LB_PER_GAL = 8.34;

export function toLbHr(value: number, unit: FlowUnit): number {
  return unit === "kg/hr" ? value * KG_TO_LB : value;
}

export function fromLbHr(valueLbHr: number, unit: FlowUnit): number {
  return unit === "kg/hr" ? valueLbHr / KG_TO_LB : valueLbHr;
}

export function toFahrenheit(value: number, unit: TempUnit): number {
  return unit === "°C" ? (value * 9) / 5 + 32 : value;
}

// ─── Validation ───────────────────────────────────────────

function isBad(n: number): boolean {
  return !Number.isFinite(n) || Number.isNaN(n);
}

export function validateInputs(i: CondensateReturnInputs): string[] {
  const errors: string[] = [];

  if (isBad(i.steamProduction) || i.steamProduction < 0) {
    errors.push("Steam production must be 0 or greater.");
  }
  if (isBad(i.currentReturnRate) || i.currentReturnRate < 0 || i.currentReturnRate > 100) {
    errors.push("Current condensate return rate must be between 0 and 100%.");
  }
  if (isBad(i.targetReturnRate) || i.targetReturnRate < 0 || i.targetReturnRate > 100) {
    errors.push("Target condensate return rate must be between 0 and 100%.");
  } else if (!isBad(i.currentReturnRate) && i.targetReturnRate < i.currentReturnRate) {
    errors.push("Target return rate must be greater than or equal to the current return rate.");
  }
  if (isBad(i.hoursPerDay) || i.hoursPerDay < 0 || i.hoursPerDay > 24) {
    errors.push("Operating hours per day must be between 0 and 24.");
  }
  if (isBad(i.daysPerYear) || i.daysPerYear < 0 || i.daysPerYear > 366) {
    errors.push("Operating days per year must be between 0 and 366.");
  }

  const condensateF = toFahrenheit(i.condensateTemp, i.tempUnit);
  const makeupF = toFahrenheit(i.makeupWaterTemp, i.tempUnit);

  if (isBad(i.condensateTemp)) {
    errors.push("Condensate temperature is required.");
  }
  if (isBad(i.makeupWaterTemp)) {
    errors.push("Makeup water temperature is required.");
  }
  if (!isBad(i.condensateTemp) && !isBad(i.makeupWaterTemp) && condensateF <= makeupF) {
    errors.push("Condensate temperature must be higher than makeup water temperature for meaningful savings. Please check your values.");
  }

  if (isBad(i.boilerEfficiency) || i.boilerEfficiency <= 0 || i.boilerEfficiency > 100) {
    errors.push("Boiler efficiency must be greater than 0 and at most 100%.");
  }
  if (isBad(i.fuelCost) || i.fuelCost < 0) {
    errors.push("Fuel cost cannot be negative.");
  }
  if (isBad(i.waterCost) || i.waterCost < 0) {
    errors.push("Water cost cannot be negative.");
  }
  if (isBad(i.sewerCost) || i.sewerCost < 0) {
    errors.push("Sewer cost cannot be negative.");
  }
  if (isBad(i.projectCost) || i.projectCost < 0) {
    errors.push("Project cost cannot be negative.");
  }

  return errors;
}

// ─── Core Calculation ─────────────────────────────────────

export function calculateCondensateReturnSavings(i: CondensateReturnInputs): CondensateReturnResult {
  const steamLbHr = toLbHr(i.steamProduction, i.flowUnit);
  const condensateF = toFahrenheit(i.condensateTemp, i.tempUnit);
  const makeupF = toFahrenheit(i.makeupWaterTemp, i.tempUnit);
  const annualHours = i.hoursPerDay * i.daysPerYear;

  // Annual steam production
  const annualSteamLb = steamLbHr * annualHours;

  // Additional condensate returned
  const returnRateIncrease = (i.targetReturnRate - i.currentReturnRate) / 100;
  const additionalCondensateLb = Math.max(0, annualSteamLb * returnRateIncrease);

  // Water saved (using water density: 8.34 lb / US gallon)
  const waterSavedGal = additionalCondensateLb / LB_PER_GAL;

  // Recovered sensible heat (simplified model: 1 Btu/lb·°F)
  const temperatureDifference = Math.max(0, condensateF - makeupF);
  const recoveredHeatBtu = additionalCondensateLb * temperatureDifference;
  const recoveredHeatMMBtu = recoveredHeatBtu / 1_000_000;

  // Fuel energy saved (accounting for boiler efficiency)
  const boilerEfficiencyDecimal = i.boilerEfficiency / 100;
  const fuelEnergySavedMMBtu =
    boilerEfficiencyDecimal > 0 ? recoveredHeatMMBtu / boilerEfficiencyDecimal : 0;

  // Cost savings
  const fuelSavings = fuelEnergySavedMMBtu * i.fuelCost;
  const waterSavings = (waterSavedGal / 1000) * i.waterCost;
  const sewerSavings = (waterSavedGal / 1000) * i.sewerCost;

  // Total annual savings
  const totalAnnualSavings = fuelSavings + waterSavings + sewerSavings;

  // Payback period (if project cost provided)
  let paybackMonths: number | null = null;
  if (i.projectCost > 0 && totalAnnualSavings > 0) {
    const paybackYears = i.projectCost / totalAnnualSavings;
    paybackMonths = paybackYears * 12;
  }

  return {
    steamFlowLbHr: steamLbHr,
    annualHours,
    annualSteamLb,
    additionalCondensateLb,
    waterSavedGal,
    recoveredHeatMMBtu,
    fuelEnergySavedMMBtu,
    fuelSavingsUSD: fuelSavings,
    waterSavingsUSD: waterSavings,
    sewerSavingsUSD: sewerSavings,
    totalAnnualSavingsUSD: totalAnnualSavings,
    paybackMonths,
  };
}
