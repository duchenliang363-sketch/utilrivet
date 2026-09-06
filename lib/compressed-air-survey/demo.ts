import { CALCULATION_VERSION, PROJECT_SCHEMA_VERSION, emptyLeak, type LeakEntry, type SurveyProject } from "./types.ts";

function L(over: Partial<LeakEntry> & Pick<LeakEntry, "tag">): LeakEntry {
  return {
    ...emptyLeak(`demo-${over.tag}`, over.tag),
    area: "Packaging",
    exactLocation: `Location ${over.tag}`,
    asset: `EQ-${over.tag}`,
    component: "Coupling",
    problemDescription: `Leak ${over.tag}`,
    pressure: 100,
    pressureUnit: "psig",
    baselineFlow: 8,
    flowUnit: "SCFM",
    quantificationMethod: "Ultrasonic instrument",
    sourceReading: "instrument SCFM",
    confidence: "Medium",
    suggestedAction: "Tighten",
    repairAccess: "Moderate",
    operationalImpact: "Medium",
    urgency: "Medium",
    estimatedRepairCost: 75,
    ...over,
    id: over.id ?? `demo-${over.tag}`,
  };
}

const repair = (who: string, date: string, action: string, cost: number) => ({
  repairedBy: who,
  repairDate: date,
  actionTaken: action,
  actualRepairCost: cost,
});

const retest = (who: string, date: string, flow: number, result: "Pass" | "Fail") => ({
  retestDate: date,
  testedBy: who,
  method: "Ultrasonic instrument" as const,
  postRepairFlow: flow,
  flowUnit: "SCFM" as const,
  result,
});

export function buildDemoProject(): SurveyProject {
  const leaks: LeakEntry[] = [
    L({ tag: "L-001", area: "Compressor Room", exactLocation: "West header union", asset: "C-101 discharge", component: "Coupling", problemDescription: "Union weep under load", pressure: 120, baselineFlow: 14, repairAccess: "Easy", operationalImpact: "High", urgency: "Immediate", suggestedAction: "Tighten", sourceReading: "14 SCFM gun", confidence: "High" }),
    L({ tag: "L-002", area: "Compressor Room", exactLocation: "Dryer inlet flange", asset: "DRY-2", component: "Valve", problemDescription: "Stem leak", pressure: 115, baselineFlow: 9, repairAccess: "Moderate", operationalImpact: "Medium", urgency: "High", suggestedAction: "Replace component", status: "Planned" }),
    L({ tag: "L-003", area: "Packaging", exactLocation: "Line 3 regulator", asset: "PKG-03", component: "Regulator", problemDescription: "Gauge port leak", pressure: 90, baselineFlow: 6, repairAccess: "Easy", operationalImpact: "Low", urgency: "Medium", suggestedAction: "Replace fitting", status: "Open" }),
    L({ tag: "L-004", area: "Packaging", exactLocation: "Case sealer hose", asset: "PKG-07", component: "Hose", problemDescription: "Cracked hose at bend", pressure: 85, baselineFlow: 18, repairAccess: "Easy", operationalImpact: "High", urgency: "High", suggestedAction: "Replace hose", status: "Awaiting Re-test", repair: repair("M. Ortiz", "2026-08-28", "Replaced hose", 65) }),
    L({ tag: "L-005", area: "Assembly", exactLocation: "Bay 2 quick connect", asset: "ASM-12", component: "Quick connect", problemDescription: "Worn nipple", pressure: 95, baselineFlow: 11, repairAccess: "Moderate", operationalImpact: "Medium", urgency: "Medium", suggestedAction: "Replace fitting", status: "Verified Closed", repair: repair("J. Lee", "2026-08-20", "Replaced coupler", 40), retest: retest("A. Chen", "2026-08-21", 0, "Pass") }),
    L({ tag: "L-006", area: "Assembly", exactLocation: "Torque tool drop", asset: "ASM-04", component: "Hose", problemDescription: "Fitting thread leak", pressure: 100, baselineFlow: 4, repairAccess: "Difficult", operationalImpact: "Low", urgency: "Low", suggestedAction: "Tighten", status: "Failed Re-test", repair: repair("J. Lee", "2026-08-22", "Tightened threads", 15), retest: retest("A. Chen", "2026-08-23", 3.5, "Fail") }),
    L({ tag: "L-007", area: "Warehouse", exactLocation: "Dock leveler feed", asset: "WH-02", component: "Threaded fitting", problemDescription: "NPT joint leak", pressure: 80, baselineFlow: 7, repairAccess: "Restricted", operationalImpact: "None", urgency: "Low", suggestedAction: "Replace fitting" }),
    L({ tag: "L-008", area: "Warehouse", exactLocation: "Stretch wrapper", asset: "WH-11", component: "Valve", problemDescription: "Solenoid exhaust leak", pressure: 88, baselineFlow: 5, repairAccess: "Moderate", operationalImpact: "Low", urgency: "Medium", suggestedAction: "Replace component", status: "Planned" }),
    L({ tag: "L-009", area: "Paint Booth", exactLocation: "Booth air manifold", asset: "PB-01", component: "Filter", problemDescription: "Bowl o-ring leak", pressure: 75, baselineFlow: 3, repairAccess: "Shutdown Required", operationalImpact: "Critical", urgency: "Immediate", suggestedAction: "Replace component" }),
    L({ tag: "L-010", area: "Paint Booth", exactLocation: "Gun hose reel", asset: "PB-04", component: "Hose", problemDescription: "Reel swivel leak", pressure: 78, baselineFlow: 12, repairAccess: "Difficult", operationalImpact: "High", urgency: "High", suggestedAction: "Replace hose", status: "Open" }),
    L({ tag: "L-011", area: "Utilities", exactLocation: "Receiver drain", asset: "RCV-1", component: "Valve", problemDescription: "Auto drain stuck open", pressure: 110, baselineFlow: 22, repairAccess: "Easy", operationalImpact: "Critical", urgency: "Immediate", suggestedAction: "Replace component", quantificationMethod: "Flow meter", sourceReading: "22 SCFM meter" }),
    L({ tag: "L-012", area: "Utilities", exactLocation: "Main header tee", asset: "HDR-A", component: "Coupling", problemDescription: "Flange weep", pressure: 105, baselineFlow: 8, repairAccess: "Shutdown Required", operationalImpact: "High", urgency: "Low", status: "Open" }),
    L({ tag: "L-013", area: "Packaging", exactLocation: "Labeler filter", asset: "PKG-15", component: "Filter", problemDescription: "Drain cock leak", pressure: 92, baselineFlow: 2.5, repairAccess: "Easy", operationalImpact: "None", urgency: "Low", suggestedAction: "Tighten", status: "Verified Closed", repair: repair("S. Patel", "2026-08-18", "Replaced drain cock", 22), retest: retest("A. Chen", "2026-08-19", 0.2, "Pass") }),
    L({ tag: "L-014", area: "Assembly", exactLocation: "Robot EOAT", asset: "RBT-2", component: "Quick connect", problemDescription: "Tool changer leak", pressure: 102, baselineFlow: 16, repairAccess: "Restricted", operationalImpact: "Critical", urgency: "High", suggestedAction: "Replace fitting", status: "Planned" }),
    L({ tag: "L-015", area: "Compressor Room", exactLocation: "Aftercooler drain", asset: "C-102", component: "Dryer", problemDescription: "Trap bypass", pressure: 118, baselineFlow: 10, repairAccess: "Moderate", operationalImpact: "Medium", urgency: "Medium", suggestedAction: "Isolate", quantificationMethod: "Technician estimate", sourceReading: "est. 10 SCFM", confidence: "Low", status: "Awaiting Re-test", repair: repair("M. Ortiz", "2026-09-01", "Rebuilt drain", 90) }),
    L({ tag: "L-016", area: "Warehouse", exactLocation: "Mezzanine drop", asset: "WH-20", component: "Threaded fitting", problemDescription: "Bushing leak", pressure: 82, baselineFlow: 1.5, repairAccess: "Difficult", operationalImpact: "None", urgency: "Low", suggestedAction: "Tighten" }),
    L({ tag: "L-017", area: "Paint Booth", exactLocation: "Pressure regulator cluster", asset: "PB-08", component: "Regulator", problemDescription: "Diaphragm leak", pressure: 70, baselineFlow: 13, repairAccess: "Moderate", operationalImpact: "High", urgency: "High", suggestedAction: "Replace component", status: "Failed Re-test", repair: repair("S. Patel", "2026-08-25", "Replaced regulator", 180), retest: retest("A. Chen", "2026-08-26", 6, "Fail") }),
    L({ tag: "L-018", area: "Assembly", exactLocation: "Press air blast", asset: "PRS-1", component: "Valve", problemDescription: "Seat leak when closed", pressure: 98, baselineFlow: 19, repairAccess: "Easy", operationalImpact: "Medium", urgency: "Immediate", suggestedAction: "Replace component", status: "Open" }),
    L({ tag: "L-019", area: "Utilities", exactLocation: "Filter-regulator bank", asset: "FR-4", component: "Filter", problemDescription: "Sight glass crack", pressure: 100, baselineFlow: 4.5, repairAccess: "Easy", operationalImpact: "Low", urgency: "Medium", suggestedAction: "Replace component", status: "Planned" }),
    L({ tag: "L-020", area: "Packaging", exactLocation: "Palletizer rotary union", asset: "PKG-22", component: "Coupling", problemDescription: "Union seal worn", pressure: 87, baselineFlow: 15, repairAccess: "Shutdown Required", operationalImpact: "Critical", urgency: "High", suggestedAction: "Replace fitting", status: "Open", quantificationMethod: "Soap / visual", sourceReading: "soap confirmed; 15 SCFM from meter later", confidence: "Medium" }),
    L({ tag: "L-021", area: "Assembly", exactLocation: "Overhead header drip leg", asset: "ASM-HDR", component: "Other", problemDescription: "Cap leak", pressure: 96, baselineFlow: 3.2, flowUnit: "L/s", repairAccess: "Restricted", operationalImpact: "Low", urgency: "Low", suggestedAction: "Tighten", status: "Open" }),
  ];

  const stamp = "2026-09-06T12:00:00.000Z";
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: "demo-plant-a",
    createdAt: stamp,
    updatedAt: stamp,
    lastSavedAt: stamp,
    settings: {
      projectName: "Demo Packaging Plant Leak Survey",
      facility: "Demo Manufacturing — Plant A",
      surveyDate: "2026-09-06",
      surveyedBy: "UtilRivet Demo",
      hoursPerDay: 16,
      daysPerYear: 250,
      electricityRate: 0.12,
      specificPower: 18,
      controlAdjustmentFactor: 1,
      savingsRealizationFraction: 0.8,
    },
    leaks,
    nextTagNumber: 22,
  };
}

export const DEMO_CALCULATION_VERSION = CALCULATION_VERSION;
