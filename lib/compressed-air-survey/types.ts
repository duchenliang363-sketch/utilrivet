// Compressed Air Leak Survey — P0 domain types.
// Vendor-neutral register → repair → re-test → verified closed.

export const CALCULATION_VERSION = "air-leak-survey-calc-v1";
export const PROJECT_SCHEMA_VERSION = 1;
export const STORE_KEY = "utilrivet.air-leak-survey.v1";

export type FlowUnit = "SCFM" | "CFM" | "L/s" | "m³/min";
export type PressureUnit = "psig" | "bar";

export type LeakStatus =
  | "Open"
  | "Planned"
  | "Awaiting Re-test"
  | "Verified Closed"
  | "Failed Re-test";

export type QuantificationMethod =
  | "Ultrasonic instrument"
  | "Flow meter"
  | "Technician estimate"
  | "Soap / visual"
  | "Other";

export type Confidence = "High" | "Medium" | "Low";

export type RepairAccess = "Easy" | "Moderate" | "Difficult" | "Restricted" | "Shutdown Required";

export type OperationalImpact = "Critical" | "High" | "Medium" | "Low" | "None";

export type Urgency = "Immediate" | "High" | "Medium" | "Low";

export type SuggestedAction =
  | "Tighten"
  | "Replace fitting"
  | "Replace hose"
  | "Replace component"
  | "Isolate"
  | "Other";

export type ComponentType =
  | "Coupling"
  | "Hose"
  | "Valve"
  | "Regulator"
  | "Filter"
  | "Dryer"
  | "Quick connect"
  | "Threaded fitting"
  | "Other";

export type RetestResult = "Pass" | "Fail";

export const FLOW_UNITS: FlowUnit[] = ["SCFM", "CFM", "L/s", "m³/min"];
export const PRESSURE_UNITS: PressureUnit[] = ["psig", "bar"];
export const LEAK_STATUSES: LeakStatus[] = [
  "Open",
  "Planned",
  "Awaiting Re-test",
  "Verified Closed",
  "Failed Re-test",
];
export const QUANTIFICATION_METHODS: QuantificationMethod[] = [
  "Ultrasonic instrument",
  "Flow meter",
  "Technician estimate",
  "Soap / visual",
  "Other",
];
export const CONFIDENCE_LEVELS: Confidence[] = ["High", "Medium", "Low"];
export const REPAIR_ACCESS_LEVELS: RepairAccess[] = [
  "Easy",
  "Moderate",
  "Difficult",
  "Restricted",
  "Shutdown Required",
];
export const OPERATIONAL_IMPACTS: OperationalImpact[] = ["Critical", "High", "Medium", "Low", "None"];
export const URGENCY_LEVELS: Urgency[] = ["Immediate", "High", "Medium", "Low"];
export const SUGGESTED_ACTIONS: SuggestedAction[] = [
  "Tighten",
  "Replace fitting",
  "Replace hose",
  "Replace component",
  "Isolate",
  "Other",
];
export const COMPONENT_TYPES: ComponentType[] = [
  "Coupling",
  "Hose",
  "Valve",
  "Regulator",
  "Filter",
  "Dryer",
  "Quick connect",
  "Threaded fitting",
  "Other",
];

export interface SurveySettings {
  projectName: string;
  facility: string;
  surveyDate: string;
  surveyedBy: string;
  hoursPerDay: number;
  daysPerYear: number;
  electricityRate: number; // $/kWh
  specificPower: number; // kW / 100 SCFM
  controlAdjustmentFactor: number; // 0–1+, compressor control
  savingsRealizationFraction: number; // 0–1
}

export interface RepairRecord {
  repairedBy: string;
  repairDate: string;
  actionTaken: string;
  actualRepairCost: number | null;
}

export interface RetestRecord {
  retestDate: string;
  testedBy: string;
  method: QuantificationMethod;
  postRepairFlow: number;
  flowUnit: FlowUnit;
  result: RetestResult;
}

export interface LeakEntry {
  id: string;
  tag: string;
  area: string;
  exactLocation: string;
  asset: string;
  component: ComponentType;
  problemDescription: string;
  pressure: number;
  pressureUnit: PressureUnit;
  baselineFlow: number;
  flowUnit: FlowUnit;
  quantificationMethod: QuantificationMethod;
  sourceReading: string;
  confidence: Confidence;
  photoDataUrl: string | null;
  suggestedAction: SuggestedAction;
  repairAccess: RepairAccess;
  operationalImpact: OperationalImpact;
  urgency: Urgency;
  estimatedRepairCost: number | null;
  notes: string;
  status: LeakStatus;
  repair: RepairRecord | null;
  retest: RetestRecord | null;
}

export interface EstimatedOpportunity {
  kind: "Estimated Opportunity";
  scfm: number;
  leakPowerKW: number;
  annualEnergyKWh: number;
  annualCost: number;
  opportunity: number;
}

export interface VerifiedResult {
  kind: "Verified Result";
  baselineSCFM: number;
  postRepairSCFM: number;
  closedSCFM: number;
  leakPowerKW: number;
  annualEnergyKWh: number;
  annualCostAvoided: number;
}

export interface StillLeakingMeasurement {
  kind: "Re-tested / Reduced but Still Leaking";
  baselineSCFM: number;
  postRepairSCFM: number;
  measuredReductionSCFM: number;
  remainingSCFM: number;
  remainingOpportunity: number;
}

export interface LeakComputed {
  entry: LeakEntry;
  baselineSCFM: number;
  estimated: EstimatedOpportunity;
  verified: VerifiedResult | null;
  stillLeaking: StillLeakingMeasurement | null;
  hasEstimatedRepairCost: boolean;
  paybackMonths: number | null;
  actualPaybackMonths: number | null;
  inRepairQueue: boolean;
}

export interface SurveySummary {
  totalLeaks: number;
  totalBaselineSCFM: number;
  estimatedOpportunityTotal: number;
  verifiedResultTotal: number;
  remainingOpenOpportunity: number;
  awaitingRetestOpportunity: number;
  totalEstimatedRepairCost: number;
  totalActualRepairCost: number;
  overallPaybackMonths: number | null;
  openCount: number;
  plannedCount: number;
  awaitingRetestCount: number;
  verifiedClosedCount: number;
  failedRetestCount: number;
  calculationVersion: string;
  annualHours: number;
}

export interface RankedLeak {
  computed: LeakComputed;
  rank: number;
  whyAhead: string;
}

export interface SurveyReport {
  leaks: LeakComputed[];
  summary: SurveySummary;
  queue: RankedLeak[];
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
  leaks: LeakEntry[];
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
  surveyDate: "",
  surveyedBy: "",
  hoursPerDay: 16,
  daysPerYear: 250,
  electricityRate: 0.12,
  specificPower: 18,
  controlAdjustmentFactor: 1,
  savingsRealizationFraction: 1,
};

export function emptyLeak(id: string, tag: string): LeakEntry {
  return {
    id,
    tag,
    area: "",
    exactLocation: "",
    asset: "",
    component: "Other",
    problemDescription: "",
    pressure: 0,
    pressureUnit: "psig",
    baselineFlow: 0,
    flowUnit: "SCFM",
    quantificationMethod: "Ultrasonic instrument",
    sourceReading: "",
    confidence: "Medium",
    photoDataUrl: null,
    suggestedAction: "Tighten",
    repairAccess: "Moderate",
    operationalImpact: "Low",
    urgency: "Medium",
    estimatedRepairCost: null,
    notes: "",
    status: "Open",
    repair: null,
    retest: null,
  };
}
