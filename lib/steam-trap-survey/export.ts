import {
  CALCULATION_VERSION,
  LOSS_CALCULATION_METHOD,
  PROJECT_SCHEMA_VERSION,
  type SurveyProject,
  type SurveyReport,
} from "./types.ts";

function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function money(n: number): string {
  if (!Number.isFinite(n)) return "$0";
  return "$" + Math.round(n).toLocaleString("en-US");
}

function num(n: number, decimals = 1): string {
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-US", { maximumFractionDigits: decimals });
}

export function exportProjectJson(project: SurveyProject): string {
  return JSON.stringify(
    {
      kind: "utilrivet-steam-trap-survey",
      schemaVersion: PROJECT_SCHEMA_VERSION,
      calculationVersion: CALCULATION_VERSION,
      exportedAt: new Date().toISOString(),
      project,
    },
    null,
    2,
  );
}

export function importProjectJson(json: string): SurveyProject {
  const parsed = JSON.parse(json) as { kind?: string; project?: SurveyProject };
  const project = parsed.project ?? (parsed as unknown as SurveyProject);
  if (!project || typeof project !== "object" || !Array.isArray(project.traps) || !project.settings) {
    throw new Error("This file is not a UtilRivet steam trap survey backup.");
  }
  return project;
}

export function exportRegisterCsv(report: SurveyReport): string {
  const headers = [
    "Tag",
    "Area",
    "Location",
    "Application",
    "Manufacturer",
    "Model",
    "Trap Type",
    "Size",
    "Operating Pressure",
    "Pressure Unit",
    "Survey Date",
    "Surveyor",
    "Test Method",
    "Temperature",
    "Instrument Reading",
    "Diagnosis",
    "Recommended Action",
    "Status",
    "Steam Loss",
    "Loss Unit",
    "Loss Input Kind",
    "Estimated Opportunity",
    "Verified Result",
    "Remaining Steam Loss",
    "Remaining Opportunity",
    "Estimated Repair Cost",
    "Actual Repair Cost",
    "Action Kind",
    "Performed By",
    "Action Date",
    "Action Notes",
    "Re-test Date",
    "Re-test By",
    "Re-test Method",
    "Re-test Result",
    "Calculation Version",
    "Calculation Method",
  ];

  const rows = report.traps.map((t) => {
    const e = t.entry;
    return [
      e.tag,
      e.area,
      e.location,
      e.application,
      e.manufacturer,
      e.model,
      e.trapType,
      e.size,
      e.operatingPressure,
      e.pressureUnit,
      e.surveyDate,
      e.surveyor,
      e.testMethod,
      e.temperature,
      e.instrumentReading,
      e.diagnosis,
      e.recommendedAction,
      e.status,
      e.steamLoss,
      e.lossUnit,
      e.lossInputKind,
      t.estimated.annualCost.toFixed(2),
      t.verified ? t.verified.annualCostAvoided.toFixed(2) : "",
      e.retest ? e.retest.remainingSteamLoss : "",
      t.stillLosing ? t.stillLosing.remainingOpportunity.toFixed(2) : "",
      e.estimatedRepairCost ?? "",
      e.repair?.actualRepairCost ?? "",
      e.repair?.actionKind ?? "",
      e.repair?.repairedBy ?? "",
      e.repair?.repairDate ?? "",
      e.repair?.actionTaken ?? "",
      e.retest?.retestDate ?? "",
      e.retest?.testedBy ?? "",
      e.retest?.method ?? "",
      e.retest?.result ?? "",
      CALCULATION_VERSION,
      LOSS_CALCULATION_METHOD,
    ].map(csvCell);
  });

  return [headers.map(csvCell).join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function buildFindingsReport(project: SurveyProject, report: SurveyReport): string {
  const s = project.settings;
  const sum = report.summary;
  const lines: string[] = [
    "Steam Trap Survey — Survey / Findings Report",
    "",
    `Project: ${s.projectName || "Untitled"}`,
    `Client / facility: ${s.facility || "—"}`,
    `Site: ${s.site || "—"}`,
    `Survey date: ${s.surveyDate || "—"}`,
    `Surveyed by: ${s.surveyedBy || "—"}`,
    `Calculation version: ${CALCULATION_VERSION}`,
    "",
    "Loss estimate method",
    `  ${LOSS_CALCULATION_METHOD}`,
    `  Annual hours: ${num(sum.annualHours, 0)} (${s.hoursPerDay} h/day × ${s.daysPerYear} days/year)`,
    `  Steam cost: $${s.steamCostPer1000Lb} / 1,000 lb`,
    "  Diagnosis is entered by the surveyor. Temperature and ultrasound readings are evidence only.",
    "",
    `Total traps surveyed: ${sum.totalTraps}`,
    `Good: ${sum.goodCount}`,
    `Failed Open: ${sum.failedOpenCount}`,
    `Failed Closed: ${sum.failedClosedCount}`,
    `Leaking: ${sum.leakingCount}`,
    `Not Testable: ${sum.notTestableCount}`,
    `Misapplied: ${sum.misappliedCount}`,
    `Other Issue: ${sum.otherIssueCount}`,
    `Findings (not Good): ${sum.findingsCount}`,
    "",
    `Estimated Opportunity (recoverable Leaking / Failed Open, baseline): ${money(sum.estimatedOpportunityTotal)} / year`,
    `Verified Result (Verified Closed only): ${money(sum.verifiedResultTotal)} / year`,
    "",
  ];

  for (const t of report.traps) {
    const e = t.entry;
    lines.push(`${e.tag}  ${e.status}  ${e.diagnosis}`);
    lines.push(`  ${e.area || "—"} / ${e.location || "—"} / ${e.application || "—"}`);
    lines.push(`  Test: ${e.testMethod} · reading: ${e.instrumentReading || "—"} · temp: ${e.temperature || "—"}`);
    lines.push(`  Loss input (${e.lossInputKind}): ${e.steamLoss} ${e.lossUnit}`);
    lines.push(`  Estimated Opportunity: ${money(t.estimated.annualCost)} / year`);
    lines.push("");
  }

  lines.push("This is a survey record. It is not an automatic trap diagnosis and not a certified energy audit.");
  return lines.join("\n").trim();
}

export function buildRepairWorkPack(project: SurveyProject, report: SurveyReport): string {
  const lines: string[] = [
    "Steam Trap Survey — Repair Work Pack",
    "",
    `Project: ${project.settings.projectName || "Untitled"}`,
    `Facility: ${project.settings.facility || "—"}`,
    `Site: ${project.settings.site || "—"}`,
    `Survey date: ${project.settings.surveyDate || "—"}`,
    `Calculation version: ${CALCULATION_VERSION}`,
    "",
    "This pack lists traps currently in the repair queue, including Failed Re-test items that still need work.",
    "Figures below are Estimated Opportunity. Verified Result is not used for traps that are still failing.",
    "",
  ];

  if (report.queue.length === 0) {
    lines.push("No traps are currently in the repair queue.");
    return lines.join("\n");
  }

  for (const item of report.queue) {
    const e = item.computed.entry;
    lines.push(`${item.rank}. ${e.tag} — ${e.area || "No area"} / ${e.location || "No location"}`);
    lines.push(`   Diagnosis: ${e.diagnosis}`);
    lines.push(`   Recommended action: ${e.recommendedAction}`);
    lines.push(`   Status: ${e.status}`);
    lines.push(`   Estimated annual loss: ${money(item.computed.estimated.annualCost)} / year`);
    if (item.computed.stillLosing) {
      const sl = item.computed.stillLosing;
      lines.push(`   Status note: Failed Re-test — still losing steam, still in the repair queue`);
      lines.push(`   Remaining estimated opportunity: ${money(sl.remainingOpportunity)} / year`);
    }
    lines.push(`   Why this rank: ${item.whyAhead}`);
    lines.push("");
  }

  return lines.join("\n").trim();
}

export function buildManagementReport(project: SurveyProject, report: SurveyReport): string {
  const s = project.settings;
  const sum = report.summary;
  const lines: string[] = [
    "Steam Trap Survey — Management / Client Report",
    "",
    `Project: ${s.projectName || "Untitled"}`,
    `Client / facility: ${s.facility || "—"}`,
    `Site: ${s.site || "—"}`,
    `Survey date: ${s.surveyDate || "—"}`,
    `Surveyed by: ${s.surveyedBy || "—"}`,
    `Last saved: ${project.lastSavedAt}`,
    `Calculation version: ${CALCULATION_VERSION}`,
    "",
    "Calculation basis (estimate)",
    `  ${LOSS_CALCULATION_METHOD}`,
    `  Annual hours: ${num(sum.annualHours, 0)} (${s.hoursPerDay} h/day × ${s.daysPerYear} days/year)`,
    `  Steam cost: $${s.steamCostPer1000Lb} / 1,000 lb`,
    "  Main inputs: user-entered steam loss rate (labeled measured / known / assumed), hours, steam cost.",
    "",
    "These two figures are not interchangeable:",
    `  Estimated Opportunity: ${money(sum.estimatedOpportunityTotal)} / year`,
    `  Verified Result (Verified Closed only): ${money(sum.verifiedResultTotal)} / year`,
    "",
    `Remaining opportunity (Open Finding / Planned / Failed Re-test): ${money(sum.remainingOpenOpportunity)} / year`,
    `Awaiting re-test opportunity: ${money(sum.awaitingRetestOpportunity)} / year`,
    "",
    `Total traps surveyed: ${sum.totalTraps}`,
    `Good: ${sum.goodCount} · Failed / findings: ${sum.findingsCount}`,
    `Repair / Replace recorded: ${sum.repairReplaceCount}`,
    `Awaiting Re-test: ${sum.awaitingRetestCount}`,
    `Verified Closed: ${sum.verifiedClosedCount}`,
    `Failed Re-test: ${sum.failedRetestCount}`,
    "",
    "Trap register",
    "",
  ];

  for (const t of report.traps) {
    const e = t.entry;
    lines.push(`${e.tag}  ${e.status}  ${e.diagnosis}`);
    lines.push(`  ${e.area || "—"} / ${e.location || "—"}`);
    lines.push(`  Estimated Opportunity: ${money(t.estimated.annualCost)} / year (${e.lossInputKind} input)`);
    if (t.verified) {
      lines.push(`  Verified Result: ${money(t.verified.annualCostAvoided)} / year (Verified Closed; remaining loss 0)`);
    } else if (t.stillLosing) {
      lines.push(`  Re-tested / Reduced but Still Losing — remaining opportunity ${money(t.stillLosing.remainingOpportunity)} / year`);
    } else {
      lines.push("  Re-test: not yet recorded");
    }
    if (e.history.length) {
      lines.push(`  History: ${e.history.map((h) => h.kind).join(" → ")}`);
    }
    lines.push("");
  }

  lines.push("This report is a planning and close-out record. It is not a certified energy audit or an automatic trap diagnosis.");
  return lines.join("\n").trim();
}
