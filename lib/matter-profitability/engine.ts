// Fixed-Fee Matter Profitability Calculator — Matter Engine
// Pure client-side. Mathematical estimates for internal business analysis only.

export type Currency = "USD" | "GBP" | "EUR" | "CAD" | "AUD";

export interface TeamMember {
  id: number;
  role: string;
  hours: number;
  hourlyCost: number; // internal cost per hour, NOT the billed rate
}

export interface OtherCost {
  id: number;
  description: string;
  amount: number;
}

export interface MatterInputs {
  matterName: string;
  fixedFee: number;
  currency: Currency;
  team: TeamMember[];
  otherCosts: OtherCost[];
  targetMarginPct: number; // 0–90
}

export interface MatterResult {
  totalHours: number;
  laborCost: number;
  otherCost: number;
  totalCost: number;
  profit: number;
  profitMarginPct: number | null; // null when fixed fee = 0
  effectiveHourlyRate: number | null; // null when total hours = 0
  profitPerHour: number | null; // null when total hours = 0
  laborPctOfFee: number | null;
  otherPctOfFee: number | null;
  profitPctOfFee: number | null;
  targetMarginFee: number | null; // null when margin >= 100%
  roundedFee: number | null; // rounded to nearest 10 for quoting convenience
  feeDifference: number | null; // targetMarginFee - fixedFee
}

// ─── Validation ───────────────────────────────────────────

function isBad(n: number): boolean {
  return !Number.isFinite(n) || Number.isNaN(n);
}

export function validateMatter(m: MatterInputs): string[] {
  const errors: string[] = [];
  if (isBad(m.fixedFee) || m.fixedFee < 0) {
    errors.push("Fixed fee must be 0 or more.");
  }
  if (isBad(m.targetMarginPct) || m.targetMarginPct < 0 || m.targetMarginPct > 90) {
    errors.push("Target profit margin must be between 0% and 90%.");
  }
  m.team.forEach((t) => {
    if (isBad(t.hours) || t.hours < 0) {
      errors.push(`${label(t.role)}: hours must be 0 or more.`);
    }
    if (isBad(t.hourlyCost) || t.hourlyCost < 0) {
      errors.push(`${label(t.role)}: internal cost per hour must be 0 or more.`);
    }
  });
  m.otherCosts.forEach((c) => {
    if (isBad(c.amount) || c.amount < 0) {
      errors.push(`${label(c.description)}: amount must be 0 or more.`);
    }
  });
  return errors;
}

function label(s: string): string {
  return s.trim() || "Unnamed row";
}

// ─── Calculation ──────────────────────────────────────────

export function computeMatter(m: MatterInputs): MatterResult {
  const fixedFee = isBad(m.fixedFee) || m.fixedFee < 0 ? 0 : m.fixedFee;
  const targetMarginPct = Math.min(90, Math.max(0, isBad(m.targetMarginPct) ? 0 : m.targetMarginPct));

  const totalHours = m.team.reduce((a, t) => a + (isBad(t.hours) || t.hours < 0 ? 0 : t.hours), 0);
  const laborCost = m.team.reduce(
    (a, t) =>
      a +
      (isBad(t.hours) || t.hours < 0 ? 0 : t.hours) * (isBad(t.hourlyCost) || t.hourlyCost < 0 ? 0 : t.hourlyCost),
    0
  );
  const otherCost = m.otherCosts.reduce((a, c) => a + (isBad(c.amount) || c.amount < 0 ? 0 : c.amount), 0);
  const totalCost = laborCost + otherCost;
  const profit = fixedFee - totalCost;

  const profitMarginPct = fixedFee > 0 ? (profit / fixedFee) * 100 : null;
  const effectiveHourlyRate = totalHours > 0 ? fixedFee / totalHours : null;
  const profitPerHour = totalHours > 0 ? profit / totalHours : null;

  const laborPctOfFee = fixedFee > 0 ? (laborCost / fixedFee) * 100 : null;
  const otherPctOfFee = fixedFee > 0 ? (otherCost / fixedFee) * 100 : null;
  const profitPctOfFee = fixedFee > 0 ? (profit / fixedFee) * 100 : null;

  // Required fee so that (fee - cost) / fee = target margin:
  // fee = totalCost / (1 - targetMargin)
  const targetMarginFee = totalCost / (1 - targetMarginPct / 100);
  const roundedFee = Math.ceil(targetMarginFee / 10) * 10;

  return {
    totalHours,
    laborCost,
    otherCost,
    totalCost,
    profit,
    profitMarginPct,
    effectiveHourlyRate,
    profitPerHour,
    laborPctOfFee,
    otherPctOfFee,
    profitPctOfFee,
    targetMarginFee,
    roundedFee,
    feeDifference: targetMarginFee - fixedFee,
  };
}

// ─── Copy Summary Text ────────────────────────────────────

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  GBP: "£",
  EUR: "€",
  CAD: "C$",
  AUD: "A$",
};

export function currencySymbol(c: Currency): string {
  return CURRENCY_SYMBOLS[c] ?? "$";
}

export function buildSummaryText(m: MatterInputs, r: MatterResult): string {
  const sym = currencySymbol(m.currency);
  const money = (n: number) => {
    const rounded = Math.round(n);
    return (rounded < 0 ? "-" : "") + sym + Math.abs(rounded).toLocaleString("en-US");
  };
  const pct = (n: number | null) => (n === null ? "—" : `${n.toFixed(1)}%`);

  const lines: string[] = ["Matter Profitability Review", ""];
  if (m.matterName.trim()) lines.push(`Matter: ${m.matterName.trim()}`);
  lines.push(`Fixed Fee: ${money(m.fixedFee)} (${m.currency})`);
  lines.push(`Total Hours: ${r.totalHours.toLocaleString("en-US", { maximumFractionDigits: 1 })}`);
  lines.push(`Labor Cost: ${money(r.laborCost)}`);
  lines.push(`Other Costs: ${money(r.otherCost)}`);
  lines.push(`Total Cost: ${money(r.totalCost)}`);
  lines.push(`Profit: ${money(r.profit)}`);
  lines.push(`Profit Margin: ${pct(r.profitMarginPct)}`);
  lines.push(
    `Effective Hourly Rate: ${r.effectiveHourlyRate === null ? "—" : sym + r.effectiveHourlyRate.toFixed(2) + "/hr"}`
  );
  lines.push(`Target Margin: ${Math.min(90, Math.max(0, m.targetMarginPct))}%`);
  lines.push(`Target-Margin Fee: ${r.targetMarginFee === null ? "—" : money(r.targetMarginFee)}`);
  return lines.join("\n");
}
