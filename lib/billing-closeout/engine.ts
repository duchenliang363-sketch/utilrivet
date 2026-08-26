// Service Job Billing Closeout Checker — Engine
// Pure client-side. Compares what happened on a completed service job with
// what has been billed, to surface potentially missed billing before invoicing.

export type Currency = "USD" | "CAD" | "GBP" | "EUR" | "AUD";

export interface LaborRow {
  id: number;
  role: string;
  hoursWorked: number;
  hoursBilled: number;
  billingRate: number; // per hour
}

export interface MaterialRow {
  id: number;
  material: string;
  quantityUsed: number;
  quantityBilled: number;
  pricePerUnit: number;
}

export const CHARGE_TYPES = [
  "Service / Diagnostic Fee",
  "Trip / Travel Charge",
  "After-Hours / Emergency Surcharge",
  "Disposal / Haul-Away Fee",
  "Equipment / Rental Charge",
  "Additional Approved Work",
  "Other",
] as const;

export type ChargeType = (typeof CHARGE_TYPES)[number];

export interface ChargeRow {
  id: number;
  chargeType: ChargeType;
  customLabel?: string; // only used when chargeType === "Other"
  expectedAmount: number;
  amountBilled: number;
}

export const DOCUMENTATION_ITEMS = [
  { key: "technicianNotes", label: "Technician notes complete" },
  { key: "customerApproval", label: "Customer approval recorded" },
  { key: "customerSignature", label: "Customer signature / completion acknowledgement available" },
  { key: "requiredPO", label: "Required PO / authorization available" },
  { key: "partsDocumented", label: "Parts / materials documented" },
  { key: "additionalWorkApproval", label: "Additional work approval documented" },
] as const;

export type DocumentationKey = (typeof DOCUMENTATION_ITEMS)[number]["key"];
export type DocumentationStatus = "Complete" | "Missing" | "Not Required";
export type DocumentationMap = Record<DocumentationKey, DocumentationStatus>;

export type BillingStatus = "READY TO INVOICE" | "NEEDS REVIEW";

export interface JobInputs {
  jobDescription: string;
  invoiceReference: string; // optional
  currency: Currency;
  labor: LaborRow[];
  materials: MaterialRow[];
  charges: ChargeRow[];
  documentation: DocumentationMap;
}

// ─── Row-level results ────────────────────────────────────

export interface LaborRowResult {
  missingHours: number; // max(worked - billed, 0)
  potentialUnbilled: number; // missingHours × billing rate
  overBilled: boolean; // billed > worked (review only, never counted)
}

export interface MaterialRowResult {
  missingQuantity: number; // max(used - billed, 0)
  potentialUnbilled: number; // missingQuantity × price per unit
  overBilled: boolean; // billed > used (review only, never counted)
}

export interface ChargeRowResult {
  potentialUnbilled: number; // max(expected - billed, 0)
  overBilled: boolean; // billed > expected (review only, never counted)
}

// ─── Validation ───────────────────────────────────────────

function isBad(n: number): boolean {
  return !Number.isFinite(n) || Number.isNaN(n);
}

function label(s: string): string {
  return s.trim() || "Unnamed row";
}

export function validateJob(j: JobInputs): string[] {
  const errors: string[] = [];
  j.labor.forEach((r) => {
    if (isBad(r.hoursWorked) || r.hoursWorked < 0) {
      errors.push(`${label(r.role)}: hours worked must be 0 or more.`);
    }
    if (isBad(r.hoursBilled) || r.hoursBilled < 0) {
      errors.push(`${label(r.role)}: hours billed must be 0 or more.`);
    }
    if (isBad(r.billingRate) || r.billingRate < 0) {
      errors.push(`${label(r.role)}: billing rate must be 0 or more.`);
    }
  });
  j.materials.forEach((r) => {
    if (isBad(r.quantityUsed) || r.quantityUsed < 0) {
      errors.push(`${label(r.material)}: quantity used must be 0 or more.`);
    }
    if (isBad(r.quantityBilled) || r.quantityBilled < 0) {
      errors.push(`${label(r.material)}: quantity billed must be 0 or more.`);
    }
    if (isBad(r.pricePerUnit) || r.pricePerUnit < 0) {
      errors.push(`${label(r.material)}: billing price per unit must be 0 or more.`);
    }
  });
  j.charges.forEach((r) => {
    const name = chargeLabel(r);
    if (isBad(r.expectedAmount) || r.expectedAmount < 0) {
      errors.push(`${name}: expected amount must be 0 or more.`);
    }
    if (isBad(r.amountBilled) || r.amountBilled < 0) {
      errors.push(`${name}: amount billed must be 0 or more.`);
    }
  });
  return errors;
}

export function chargeLabel(r: ChargeRow): string {
  return r.chargeType === "Other" && r.customLabel?.trim() ? r.customLabel.trim() : r.chargeType;
}

// ─── Row-level calculations ───────────────────────────────

function num(n: number): number {
  return isBad(n) || n < 0 ? 0 : n;
}

export function computeLaborRow(r: LaborRow): LaborRowResult {
  const worked = num(r.hoursWorked);
  const billed = num(r.hoursBilled);
  const rate = num(r.billingRate);
  const missingHours = Math.max(worked - billed, 0);
  return {
    missingHours,
    potentialUnbilled: missingHours * rate,
    overBilled: billed > worked,
  };
}

export function computeMaterialRow(r: MaterialRow): MaterialRowResult {
  const used = num(r.quantityUsed);
  const billed = num(r.quantityBilled);
  const price = num(r.pricePerUnit);
  const missingQuantity = Math.max(used - billed, 0);
  return {
    missingQuantity,
    potentialUnbilled: missingQuantity * price,
    overBilled: billed > used,
  };
}

export function computeChargeRow(r: ChargeRow): ChargeRowResult {
  const expected = num(r.expectedAmount);
  const billed = num(r.amountBilled);
  return {
    potentialUnbilled: Math.max(expected - billed, 0),
    overBilled: billed > expected,
  };
}

// ─── Job-level result ─────────────────────────────────────

export interface JobResult {
  labor: LaborRowResult[];
  materials: MaterialRowResult[];
  charges: ChargeRowResult[];
  potentialLabor: number;
  potentialMaterials: number;
  potentialCharges: number;
  potentialTotal: number; // potential labor + materials + additional charges
  missingBillingItems: number; // rows where potential unbilled amount > 0
  documentationIssues: number; // items marked Missing
  status: BillingStatus;
}

export function computeJob(j: JobInputs): JobResult {
  const labor = j.labor.map(computeLaborRow);
  const materials = j.materials.map(computeMaterialRow);
  const charges = j.charges.map(computeChargeRow);

  const potentialLabor = labor.reduce((a, r) => a + r.potentialUnbilled, 0);
  const potentialMaterials = materials.reduce((a, r) => a + r.potentialUnbilled, 0);
  const potentialCharges = charges.reduce((a, r) => a + r.potentialUnbilled, 0);
  const potentialTotal = potentialLabor + potentialMaterials + potentialCharges;

  const missingBillingItems =
    labor.filter((r) => r.potentialUnbilled > 0).length +
    materials.filter((r) => r.potentialUnbilled > 0).length +
    charges.filter((r) => r.potentialUnbilled > 0).length;

  const documentationIssues = DOCUMENTATION_ITEMS.filter(
    (d) => j.documentation[d.key] === "Missing"
  ).length;

  const status: BillingStatus =
    potentialTotal === 0 && documentationIssues === 0 ? "READY TO INVOICE" : "NEEDS REVIEW";

  return {
    labor,
    materials,
    charges,
    potentialLabor,
    potentialMaterials,
    potentialCharges,
    potentialTotal,
    missingBillingItems,
    documentationIssues,
    status,
  };
}

// ─── Copy Summary Text ────────────────────────────────────

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  CAD: "C$",
  GBP: "£",
  EUR: "€",
  AUD: "A$",
};

export function currencySymbol(c: Currency): string {
  return CURRENCY_SYMBOLS[c] ?? "$";
}

export function buildSummaryText(j: JobInputs, r: JobResult): string {
  const sym = currencySymbol(j.currency);
  const money = (n: number) => sym + Math.round(n).toLocaleString("en-US");

  const lines: string[] = ["Service Job Billing Closeout Review", ""];
  if (j.jobDescription.trim()) lines.push(`Job: ${j.jobDescription.trim()}`);
  lines.push(`Potential Unbilled Revenue: ${money(r.potentialTotal)}`);
  lines.push("");
  lines.push(`Potential Unbilled Labor: ${money(r.potentialLabor)}`);
  lines.push(`Potential Unbilled Materials: ${money(r.potentialMaterials)}`);
  lines.push(`Potential Unbilled Additional Charges: ${money(r.potentialCharges)}`);
  lines.push("");
  lines.push(`Missing Billing Items: ${r.missingBillingItems}`);
  lines.push(`Documentation Issues: ${r.documentationIssues}`);
  lines.push("");
  lines.push(`Status: ${r.status}`);
  return lines.join("\n");
}
