// Steam Trap Survey — Validation P0 types.
// Mirrors Air Leak persist / close-out semantics. Does not auto-diagnose traps.

export const CALCULATION_VERSION = "steam-trap-survey-estimate-v1";
export const PROJECT_SCHEMA_VERSION = 1;
export const STORE_KEY = "utilrivet.steam-trap-survey.v1";

export const LOSS_CALCULATION_METHOD =
  "User-entered steam loss rate × annual operating hours × steam cost per 1,000 lb. Not computed from trap type, temperature, or ultrasound. Estimate only.";

export type PressureUnit = "psi" | "bar";
export type LossUnit = "lb/hr" | "kg/hr";
export type LossInputKind = "measured" | "known" | "assumed";

export type TrapType =
  | "Thermodynamic"
  | "Inverted Bucket"
  | "Float & Thermostatic"
  | "Thermostatic"
  | "Bimetallic"
  | "Disc"
  | "Other"
  | "Unknown";

export type TrapDiagnosis =
  | "Good"
  | "Failed Open"
  | "Failed Closed"
  | "Leaking"
  | "Not Testable"
  | "Misapplied / Wrong Application"
  | "Other Issue";

export type TrapStatus =
  | "Good"
  | "Open Finding"
  | "Planned"
  | "Awaiting Re-test"
  | "Verified Closed"
  | "Failed Re-test"
  | "Not Testable";

export type RecommendedAction = "Repair" | "Replace" | "Investigate" | "Retest";

export type TestMethod =
  | "Temperature"
  | "Ultrasound"
  | "Visual"
  | "Listening stick"
  | "Other";

export type RetestResult = "Pass" | "Fail";

export type HistoryKind = "Survey" | "Finding" | "Repair" | "Replacement" | "Re-test" | "Closure";

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
export const DIAGNOSES: TrapDiagnosis[] = [
  "Good",
  "Failed Open",
  "Failed Closed",
  "Leaking",
  "Not Testable",
  "Misapplied / Wrong Application",
  "Other Issue",
];
export const TRAP_STATUSES: TrapStatus[] = [
  "Good",
  "Open Finding",
  "Planned",
  "Awaiting Re-test",
  "Verified Closed",
  "Failed Re-test",
  "Not Testable",
];
export const RECOMMENDED_ACTIONS: RecommendedAction[] = ["Repair", "Replace", "Investigate", "Retest"];
export const TEST_METHODS: TestMethod[] = ["Temperature", "Ultrasound", "Visual", "Listening stick", "Other"];
export const PRESSURE_UNITS: PressureUnit[] = ["psi", "bar"];
export const LOSS_UNITS: LossUnit[] = ["lb/hr", "kg/hr"];
export const LOSS_INPUT_KINDS: LossInputKind[] = ["measured", "known", "assumed"];

export interface SurveySettings {
  projectName: string;
  facility: string;
  site: string;
  surveyDate: string;
  surveyedBy: string;
  hoursPerDay: number;
  daysPerYear: number;
  steamCostPer1000Lb: number;
}

export interface RepairRecord {
  repairedBy: string;
  repairDate: string;
  actionKind: RecommendedAction;
  actionTaken: string;
  actualRepairCost: number | null;
}

export interface RetestRecord {
  retestDate: string;
  testedBy: string;
  method: TestMethod;
  remainingSteamLoss: number;
  lossUnit: LossUnit;
  result: RetestResult;
  notes: string;
}

export interface TrapHistoryEvent {
  at: string;
  kind: HistoryKind;
  summary: string;
  notes: string;
}

export interface TrapEntry {
  id: string;
  tag: string;
  area: string;
  location: string;
  application: string;
  manufacturer: string;
  model: string;
  trapType: TrapType;
  size: string;
  operatingPressure: number;
  pressureUnit: PressureUnit;
  surveyDate: string;
  surveyor: string;
  testMethod: TestMethod;
  temperature: string;
  instrumentReading: string;
  notes: string;
  diagnosis: TrapDiagnosis;
  recommendedAction: RecommendedAction;
  steamLoss: number;
  lossUnit: LossUnit;
  lossInputKind: LossInputKind;
  estimatedRepairCost: number | null;
  status: TrapStatus;
  repair: RepairRecord | null;
  retest: RetestRecord | null;
  history: TrapHistoryEvent[];
}

export interface EstimatedOpportunity {
  kind: "Estimated Opportunity";
  steamLossLbHr: number;
  annualSteamLb: number;
  annualCost: number;
  method: string;
  inputKind: LossInputKind;
}

export interface VerifiedResult {
  kind: "Verified Result";
  baselineLbHr: number;
  remainingLbHr: number;
  annualCostAvoided: number;
}

export interface StillLosingMeasurement {
  kind: "Re-tested / Reduced but Still Losing";
  baselineLbHr: number;
  remainingLbHr: number;
  remainingOpportunity: number;
}

export interface TrapComputed {
  entry: TrapEntry;
  estimated: EstimatedOpportunity;
  verified: VerifiedResult | null;
  stillLosing: StillLosingMeasurement | null;
  hasEstimatedRepairCost: boolean;
  paybackMonths: number | null;
  inRepairQueue: boolean;
}

export interface SurveySummary {
  totalTraps: number;
  goodCount: number;
  failedOpenCount: number;
  failedClosedCount: number;
  leakingCount: number;
  notTestableCount: number;
  misappliedCount: number;
  otherIssueCount: number;
  findingsCount: number;
  estimatedOpportunityTotal: number;
  verifiedResultTotal: number;
  remainingOpenOpportunity: number;
  awaitingRetestOpportunity: number;
  repairReplaceCount: number;
  openFindingCount: number;
  plannedCount: number;
  awaitingRetestCount: number;
  verifiedClosedCount: number;
  failedRetestCount: number;
  calculationVersion: string;
  calculationMethod: string;
  annualHours: number;
}

export interface RankedTrap {
  computed: TrapComputed;
  rank: number;
  whyAhead: string;
}

export interface SurveyReport {
  traps: TrapComputed[];
  summary: SurveySummary;
  queue: RankedTrap[];
  settings: SurveySettings;
  calculationVersion: string;
}

export interface SurveyProject {
  schemaVersion: number;
  id: string;
  createdAt: string;
  updatedAt: string;
  lastSavedAt: string;
  settings: SurveySettings;
  traps: TrapEntry[];
  nextTagNumber: number;
}

export interface SurveyStoreState {
  schemaVersion: number;
  calculationVersion: string;
  activeProjectId: string | null;
  projects: Record<string, SurveyProject>;
}

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const DEFAULT_SETTINGS: SurveySettings = {
  projectName: "",
  facility: "",
  site: "",
  surveyDate: "",
  surveyedBy: "",
  hoursPerDay: 16,
  daysPerYear: 300,
  steamCostPer1000Lb: 12,
};

export function statusForDiagnosis(diagnosis: TrapDiagnosis): TrapStatus {
  if (diagnosis === "Good") return "Good";
  if (diagnosis === "Not Testable") return "Not Testable";
  return "Open Finding";
}

export function emptyTrap(id: string, tag: string): TrapEntry {
  return {
    id,
    tag,
    area: "",
    location: "",
    application: "",
    manufacturer: "",
    model: "",
    trapType: "Unknown",
    size: "",
    operatingPressure: 0,
    pressureUnit: "psi",
    surveyDate: "",
    surveyor: "",
    testMethod: "Ultrasound",
    temperature: "",
    instrumentReading: "",
    notes: "",
    diagnosis: "Leaking",
    recommendedAction: "Repair",
    steamLoss: 0,
    lossUnit: "lb/hr",
    lossInputKind: "assumed",
    estimatedRepairCost: null,
    status: "Open Finding",
    repair: null,
    retest: null,
    history: [],
  };
}
