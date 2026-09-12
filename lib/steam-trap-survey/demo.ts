import { CALCULATION_VERSION, PROJECT_SCHEMA_VERSION, emptyTrap, statusForDiagnosis, type TrapEntry, type SurveyProject } from "./types.ts";
import { appendHistory } from "./status.ts";

function T(over: Partial<TrapEntry> & Pick<TrapEntry, "tag" | "diagnosis">): TrapEntry {
  const base = emptyTrap(`demo-${over.tag}`, over.tag);
  const diagnosis = over.diagnosis;
  const status = over.status ?? statusForDiagnosis(diagnosis);
  const entry: TrapEntry = {
    ...base,
    area: "Boiler House",
    location: `Header ${over.tag}`,
    application: "Drip leg",
    trapType: "Thermodynamic",
    operatingPressure: 125,
    surveyDate: "2026-09-12",
    surveyor: "UtilRivet Demo",
    testMethod: "Ultrasound",
    steamLoss: 12,
    lossInputKind: "assumed",
    recommendedAction: "Repair",
    ...over,
    diagnosis,
    status,
    id: over.id ?? `demo-${over.tag}`,
  };
  if (entry.history.length === 0) {
    return appendHistory(entry, {
      at: "2026-09-12T12:00:00.000Z",
      kind: diagnosis === "Good" || diagnosis === "Not Testable" ? "Survey" : "Finding",
      summary: `Survey recorded ${diagnosis}`,
      notes: entry.notes,
    });
  }
  return entry;
}

export function buildDemoProject(): SurveyProject {
  const traps: TrapEntry[] = [
    T({ tag: "T-001", diagnosis: "Good", steamLoss: 0, location: "Main header drip — north", application: "Drip leg", notes: "Cycle sound normal" }),
    T({ tag: "T-002", diagnosis: "Failed Open", steamLoss: 18, lossInputKind: "measured", location: "Boiler outlet drip", application: "Drip leg", recommendedAction: "Repair", instrumentReading: "continuous blow", notes: "Trap A — finding ready for close-out" }),
    T({ tag: "T-003", diagnosis: "Failed Closed", steamLoss: 0, location: "Economizer drip", application: "Drip leg", recommendedAction: "Replace", notes: "Cold downstream; no recoverable steam loss entered" }),
    T({ tag: "T-004", diagnosis: "Leaking", steamLoss: 9, lossInputKind: "known", location: "Process coil return", application: "Tracer", recommendedAction: "Replace", notes: "Trap B — finding ready for replace path" }),
    T({ tag: "T-005", diagnosis: "Not Testable", steamLoss: 0, location: "Mezzanine drip — no access", application: "Drip leg", testMethod: "Visual", notes: "Scaffold required" }),
    T({ tag: "T-006", diagnosis: "Misapplied / Wrong Application", steamLoss: 4, lossInputKind: "assumed", location: "Superheat drip", application: "Wrong TD on superheat", recommendedAction: "Replace", trapType: "Thermodynamic" }),
    T({ tag: "T-007", diagnosis: "Other Issue", steamLoss: 2, lossInputKind: "assumed", location: "Blowdown tank drip", application: "Drip leg", recommendedAction: "Investigate" }),
    T({ tag: "T-008", diagnosis: "Leaking", status: "Planned", steamLoss: 11, location: "Unit heater return", application: "Heater", recommendedAction: "Repair" }),
    T({ tag: "T-009", diagnosis: "Failed Open", steamLoss: 7, location: "PRV station drip", application: "Drip leg", recommendedAction: "Repair", trapType: "Inverted Bucket" }),
    T({ tag: "T-010", diagnosis: "Leaking", steamLoss: 6, location: "Kitchen kettle jacket", application: "Jacket", recommendedAction: "Repair", trapType: "Float & Thermostatic", lossInputKind: "measured" }),
  ];

  const stamp = "2026-09-12T12:00:00.000Z";
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: "demo-food-plant",
    createdAt: stamp,
    updatedAt: stamp,
    lastSavedAt: stamp,
    settings: {
      projectName: "Demo Food Plant Steam Trap Survey",
      facility: "Demo Food Plant",
      site: "Boiler House",
      surveyDate: "2026-09-12",
      surveyedBy: "UtilRivet Demo",
      hoursPerDay: 16,
      daysPerYear: 300,
      steamCostPer1000Lb: 12,
    },
    traps,
    nextTagNumber: 11,
  };
}

export const DEMO_CALCULATION_VERSION = CALCULATION_VERSION;
