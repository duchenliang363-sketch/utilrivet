// Boiler Blowdown Cost & Savings Calculator — Calculation Engine
// Pure client-side. Estimates are for preliminary energy and cost
// analysis only, not precision engineering design.

export type FlowUnit = "lb/hr" | "kg/hr";
export type PressureUnit = "psi" | "bar";
export type TempUnit = "°F" | "°C";

export interface BlowdownInputs {
  steamProduction: number;
  flowUnit: FlowUnit;
  currentBlowdownRate: number; // %
  targetBlowdownRate: number; // %
  hoursPerDay: number;
  daysPerYear: number;
  boilerPressure: number;
  pressureUnit: PressureUnit;
  feedwaterTemp: number;
  tempUnit: TempUnit;
  boilerEfficiency: number; // %
  fuelCost: number; // $/MMBtu
  waterCost: number; // $/1,000 gal (optional, 0 = omitted)
}

export interface BlowdownResult {
  steamFlowLbHr: number;
  satTempF: number;
  currentBlowdownLbHr: number;
  targetBlowdownLbHr: number;
  blowdownReductionLbHr: number;
  annualHours: number;
  annualWaterSavedGal: number;
  annualHeatSavedMMBtu: number;
  annualFuelSavedMMBtu: number;
  fuelSavingsUSD: number;
  waterSavingsUSD: number;
  totalAnnualSavingsUSD: number;
}

// ─── Unit Conversion ──────────────────────────────────────

const KG_TO_LB = 2.20462;
const BAR_TO_PSI = 14.5038;
const LB_PER_GAL = 8.34;

export function toLbHr(value: number, unit: FlowUnit): number {
  return unit === "kg/hr" ? value * KG_TO_LB : value;
}

export function fromLbHr(valueLbHr: number, unit: FlowUnit): number {
  return unit === "kg/hr" ? valueLbHr / KG_TO_LB : valueLbHr;
}

export function toPSI(value: number, unit: PressureUnit): number {
  return unit === "bar" ? value * BAR_TO_PSI : value;
}

export function toFahrenheit(value: number, unit: TempUnit): number {
  return unit === "°C" ? (value * 9) / 5 + 32 : value;
}

// ─── Saturation Temperature (approximate steam table) ─────

// Approximate saturated steam temperature by gauge pressure.
const SAT_TEMP_TABLE: Array<[number, number]> = [
  [0, 212],
  [15, 250],
  [50, 298],
  [100, 338],
  [150, 366],
  [200, 388],
  [250, 406],
  [300, 422],
  [400, 448],
  [500, 470],
  [600, 489],
  [800, 522],
  [1000, 545],
];

export function saturationTempF(pressurePSI: number): number {
  const p = Math.max(0, Math.min(pressurePSI, 1000));
  const table = SAT_TEMP_TABLE;
  if (p <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    if (p <= table[i][0]) {
      const [p0, t0] = table[i - 1];
      const [p1, t1] = table[i];
      return t0 + ((t1 - t0) * (p - p0)) / (p1 - p0);
    }
  }
  return table[table.length - 1][1];
}

// ─── Validation ───────────────────────────────────────────

function isBad(n: number): boolean {
  return !Number.isFinite(n) || Number.isNaN(n);
}

export function validateInputs(i: BlowdownInputs): string[] {
  const errors: string[] = [];

  if (isBad(i.steamProduction) || i.steamProduction <= 0) {
    errors.push("Steam production must be greater than 0.");
  }
  if (isBad(i.currentBlowdownRate) || i.currentBlowdownRate <= 0) {
    errors.push("Current blowdown rate must be greater than 0.");
  } else if (i.currentBlowdownRate >= 100) {
    errors.push("Current blowdown rate must be below 100%.");
  }
  if (isBad(i.targetBlowdownRate) || i.targetBlowdownRate < 0) {
    errors.push("Target blowdown rate cannot be negative.");
  } else if (i.targetBlowdownRate >= i.currentBlowdownRate) {
    errors.push("Target blowdown rate must be lower than the current blowdown rate.");
  }
  if (isBad(i.hoursPerDay) || i.hoursPerDay < 0 || i.hoursPerDay > 24) {
    errors.push("Operating hours per day must be between 0 and 24.");
  }
  if (isBad(i.daysPerYear) || i.daysPerYear < 0 || i.daysPerYear > 366) {
    errors.push("Operating days per year must be between 0 and 366.");
  }

  const pressurePSI = toPSI(i.boilerPressure, i.pressureUnit);
  if (isBad(i.boilerPressure) || i.boilerPressure <= 0) {
    errors.push("Boiler pressure must be greater than 0.");
  } else if (pressurePSI > 1000) {
    errors.push("Boiler pressure must be 1000 psi (≈ 69 bar) or below.");
  }

  const feedF = toFahrenheit(i.feedwaterTemp, i.tempUnit);
  if (isBad(i.feedwaterTemp) || feedF < 32) {
    errors.push("Feedwater temperature must be at least 32°F (0°C).");
  } else if (!isBad(i.boilerPressure) && i.boilerPressure > 0 && pressurePSI <= 1000) {
    if (feedF >= saturationTempF(pressurePSI)) {
      errors.push("Feedwater temperature must be below the saturation temperature at the boiler pressure.");
    }
  }

  if (isBad(i.boilerEfficiency) || i.boilerEfficiency <= 0 || i.boilerEfficiency > 100) {
    errors.push("Boiler efficiency must be greater than 0 and at most 100%.");
  }
  if (isBad(i.fuelCost) || i.fuelCost < 0) {
    errors.push("Fuel cost cannot be negative.");
  }
  if (isBad(i.waterCost) || i.waterCost < 0) {
    errors.push("Water + sewer cost cannot be negative.");
  }

  return errors;
}

// ─── Core Calculation ─────────────────────────────────────

export function calculateBlowdownSavings(i: BlowdownInputs): BlowdownResult {
  const steamLbHr = toLbHr(i.steamProduction, i.flowUnit);
  const pressurePSI = toPSI(i.boilerPressure, i.pressureUnit);
  const feedF = toFahrenheit(i.feedwaterTemp, i.tempUnit);
  const satF = saturationTempF(pressurePSI);
  const annualHours = i.hoursPerDay * i.daysPerYear;

  // Blowdown flow from steam output:
  // blowdown = steam × rate / (100 − rate)
  const currentLbHr = (steamLbHr * i.currentBlowdownRate) / (100 - i.currentBlowdownRate);
  const targetLbHr = (steamLbHr * i.targetBlowdownRate) / (100 - i.targetBlowdownRate);
  const reductionLbHr = Math.max(0, currentLbHr - targetLbHr);

  // Heat carried away by blowdown, relative to feedwater.
  // Enthalpy of saturated liquid ≈ (Tsat − 32) BTU/lb.
  const deltaH = Math.max(0, satF - feedF); // BTU/lb
  const annualHeatBTU = reductionLbHr * deltaH * annualHours;
  const annualHeatMMBtu = annualHeatBTU / 1_000_000;

  const efficiency = i.boilerEfficiency / 100;
  const annualFuelMMBtu = efficiency > 0 ? annualHeatMMBtu / efficiency : 0;
  const fuelSavings = annualFuelMMBtu * i.fuelCost;

  const annualWaterGal = (reductionLbHr * annualHours) / LB_PER_GAL;
  const waterSavings = (annualWaterGal / 1000) * i.waterCost;

  const total = fuelSavings + waterSavings;

  return {
    steamFlowLbHr: steamLbHr,
    satTempF: satF,
    currentBlowdownLbHr: currentLbHr,
    targetBlowdownLbHr: targetLbHr,
    blowdownReductionLbHr: reductionLbHr,
    annualHours,
    annualWaterSavedGal: annualWaterGal,
    annualHeatSavedMMBtu: annualHeatMMBtu,
    annualFuelSavedMMBtu: annualFuelMMBtu,
    fuelSavingsUSD: fuelSavings,
    waterSavingsUSD: waterSavings,
    totalAnnualSavingsUSD: total,
  };
}
