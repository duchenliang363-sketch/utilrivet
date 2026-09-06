// Compressed Air Leak Survey — P0 engine surface.
// Per-leak energy math is implemented in calc.ts (SCFM + control + realization).
// This file is the stable import used by the UI.

export { CALCULATION_VERSION, DEFAULT_SETTINGS, emptyLeak } from "./types.ts";
export type {
  ComponentType,
  Confidence,
  FlowUnit,
  LeakComputed,
  LeakEntry,
  LeakStatus,
  OperationalImpact,
  QuantificationMethod,
  RankedLeak,
  RepairAccess,
  RepairRecord,
  RetestRecord,
  StillLeakingMeasurement,
  SuggestedAction,
  SurveyProject,
  SurveyReport,
  SurveySettings,
  SurveySummary,
  Urgency,
} from "./types.ts";
export {
  COMPONENT_TYPES,
  CONFIDENCE_LEVELS,
  FLOW_UNITS,
  LEAK_STATUSES,
  OPERATIONAL_IMPACTS,
  PRESSURE_UNITS,
  QUANTIFICATION_METHODS,
  REPAIR_ACCESS_LEVELS,
  SUGGESTED_ACTIONS,
  URGENCY_LEVELS,
} from "./types.ts";

export {
  annualHoursOf,
  buildSurveyReport,
  computeLeak,
  toSCFM,
  validateLeak,
  validateSettings,
  validateSurvey,
} from "./calc.ts";

export { applyPlan, applyRepairCompleted, applyRetest, canEnterVerifiedClosed, meetsCloseCondition, returnFailedToQueue } from "./status.ts";
export { explainWhyAhead, rankRepairQueue } from "./queue.ts";
export {
  MemoryStore,
  browserStore,
  createEmptyProject,
  createSurveyStore,
  nextTag,
} from "./persist.ts";
export {
  buildManagementReport,
  buildRepairWorkPack,
  exportProjectJson,
  exportRegisterCsv,
  importProjectJson,
} from "./export.ts";
export { buildDemoProject } from "./demo.ts";
export { filterRegister, uniqueAreas } from "./register.ts";
export type { RegisterFilter, RegisterSortKey } from "./register.ts";
