import { CALCULATION_VERSION, PROJECT_SCHEMA_VERSION, type SurveyProject, type SurveyReport } from "./types.ts";

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
      kind: "utilrivet-air-leak-survey",
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
  const parsed = JSON.parse(json) as { project?: SurveyProject; schemaVersion?: number };
  const project = parsed.project ?? (parsed as unknown as SurveyProject);
  if (!project || typeof project !== "object" || !Array.isArray(project.leaks) || !project.settings) {
    throw new Error("This file is not a UtilRivet air leak survey backup.");
  }
  return project;
}

export function exportRegisterCsv(report: SurveyReport): string {
  const headers = [
    "Tag",
    "Area",
    "Exact Location",
    "Asset/Equipment",
    "Component",
    "Problem Description",
    "Pressure",
    "Pressure Unit",
    "Baseline Flow",
    "Flow Unit",
    "Baseline SCFM",
    "Quantification Method",
    "Source Reading",
    "Confidence",
    "Suggested Action",
    "Repair Access",
    "Operational Impact",
    "Urgency",
    "Status",
    "Estimated Opportunity",
    "Verified Result",
    "Verified Closed SCFM",
    "Post-repair Flow",
    "Measured Flow Reduction",
    "Remaining Flow",
    "Remaining Estimated Opportunity",
    "Estimated Repair Cost",
    "Actual Repair Cost",
    "Repaired By",
    "Repair Date",
    "Action Taken",
    "Re-test Date",
    "Tested By",
    "Re-test Method",
    "Re-test Result",
    "Calculation Version",
  ];

  const rows = report.leaks.map((l) => {
    const e = l.entry;
    return [
      e.tag,
      e.area,
      e.exactLocation,
      e.asset,
      e.component,
      e.problemDescription,
      e.pressure,
      e.pressureUnit,
      e.baselineFlow,
      e.flowUnit,
      l.baselineSCFM,
      e.quantificationMethod,
      e.sourceReading,
      e.confidence,
      e.suggestedAction,
      e.repairAccess,
      e.operationalImpact,
      e.urgency,
      e.status,
      l.estimated.opportunity.toFixed(2),
      l.verified ? l.verified.annualCostAvoided.toFixed(2) : "",
      l.verified ? l.verified.closedSCFM : "",
      e.retest ? e.retest.postRepairFlow : "",
      l.stillLeaking ? l.stillLeaking.measuredReductionSCFM : "",
      l.stillLeaking ? l.stillLeaking.remainingSCFM : "",
      l.stillLeaking ? l.stillLeaking.remainingOpportunity.toFixed(2) : "",
      e.estimatedRepairCost ?? "",
      e.repair?.actualRepairCost ?? "",
      e.repair?.repairedBy ?? "",
      e.repair?.repairDate ?? "",
      e.repair?.actionTaken ?? "",
      e.retest?.retestDate ?? "",
      e.retest?.testedBy ?? "",
      e.retest?.method ?? "",
      e.retest?.result ?? "",
      CALCULATION_VERSION,
    ].map(csvCell);
  });

  return [headers.map(csvCell).join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function buildRepairWorkPack(project: SurveyProject, report: SurveyReport): string {
  const lines: string[] = [
    "Compressed Air Leak Survey — Repair Work Pack",
    "",
    `Project: ${project.settings.projectName || "Untitled"}`,
    `Facility: ${project.settings.facility || "—"}`,
    `Survey date: ${project.settings.surveyDate || "—"}`,
    `Calculation version: ${CALCULATION_VERSION}`,
    "",
    "This pack lists leaks currently in the repair queue, including Failed Re-test items that still need work.",
    "Figures below are Estimated Opportunity. Verified Result is not used for leaks that are still leaking.",
    "",
  ];

  if (report.queue.length === 0) {
    lines.push("No leaks are currently in the repair queue.");
    return lines.join("\n");
  }

  for (const item of report.queue) {
    const e = item.computed.entry;
    lines.push(`${item.rank}. ${e.tag} — ${e.area || "No area"} / ${e.exactLocation || "No exact location"}`);
    lines.push(`   Asset/Equipment: ${e.asset || "—"}`);
    lines.push(`   Component: ${e.component}`);
    lines.push(`   Problem: ${e.problemDescription || "—"}`);
    lines.push(`   Pressure: ${e.pressure} ${e.pressureUnit}`);
    lines.push(`   Baseline flow: ${e.baselineFlow} ${e.flowUnit} (${num(item.computed.baselineSCFM)} SCFM)`);
    lines.push(`   Suggested action: ${e.suggestedAction}`);
    lines.push(`   Repair access: ${e.repairAccess}`);
    lines.push(`   Operational impact: ${e.operationalImpact}`);
    lines.push(`   Urgency: ${e.urgency}`);
    lines.push(`   Estimated Opportunity: ${money(item.computed.estimated.opportunity)} / year`);
    if (item.computed.stillLeaking) {
      const sl = item.computed.stillLeaking;
      lines.push(`   Status note: Failed Re-test — still leaking, still in the repair queue`);
      lines.push(`   Baseline flow: ${num(sl.baselineSCFM)} SCFM`);
      lines.push(`   Post-repair flow: ${num(sl.postRepairSCFM)} SCFM`);
      lines.push(`   Measured flow reduction: ${num(sl.measuredReductionSCFM)} SCFM`);
      lines.push(`   Remaining flow: ${num(sl.remainingSCFM)} SCFM`);
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
    "Compressed Air Leak Survey — Management / Client Report",
    "",
    `Project: ${s.projectName || "Untitled"}`,
    `Facility: ${s.facility || "—"}`,
    `Survey date: ${s.surveyDate || "—"}`,
    `Surveyed by: ${s.surveyedBy || "—"}`,
    `Last saved: ${project.lastSavedAt}`,
    `Calculation version: ${CALCULATION_VERSION}`,
    "",
    "Calculation basis",
    `  Specific power: ${s.specificPower} kW / 100 SCFM`,
    `  Annual hours: ${num(sum.annualHours, 0)} (${s.hoursPerDay} h/day × ${s.daysPerYear} days/year)`,
    `  Electricity rate: $${s.electricityRate}/kWh`,
    `  Compressor control adjustment factor: ${s.controlAdjustmentFactor}`,
    `  Savings realization fraction: ${s.savingsRealizationFraction}`,
    "",
    "These two figures are not interchangeable:",
    `  Estimated Opportunity (all leaks, baseline): ${money(sum.estimatedOpportunityTotal)} / year`,
    `  Verified Result (Verified Closed only, post-repair flow = 0): ${money(sum.verifiedResultTotal)} / year`,
    "",
    `Remaining open opportunity (Open / Planned / Failed Re-test): ${money(sum.remainingOpenOpportunity)} / year`,
    `Awaiting re-test opportunity: ${money(sum.awaitingRetestOpportunity)} / year`,
    "",
    `Status: ${sum.openCount} Open · ${sum.plannedCount} Planned · ${sum.awaitingRetestCount} Awaiting Re-test · ${sum.verifiedClosedCount} Verified Closed · ${sum.failedRetestCount} Failed Re-test`,
    "",
    "Leak register",
    "",
  ];

  for (const l of report.leaks) {
    const e = l.entry;
    lines.push(`${e.tag}  ${e.status}`);
    lines.push(`  ${e.area || "—"} / ${e.exactLocation || "—"} / ${e.asset || "—"}`);
    lines.push(`  Baseline: ${num(l.baselineSCFM)} SCFM`);
    lines.push(`  Estimated Opportunity: ${money(l.estimated.opportunity)} / year`);
    if (l.verified) {
      lines.push(
        `  Verified Result: ${money(l.verified.annualCostAvoided)} / year (Verified Closed; post-repair flow 0 SCFM)`,
      );
    } else if (l.stillLeaking) {
      const sl = l.stillLeaking;
      lines.push(`  Re-tested / Reduced but Still Leaking`);
      lines.push(`  Baseline flow: ${num(sl.baselineSCFM)} SCFM`);
      lines.push(`  Post-repair flow: ${num(sl.postRepairSCFM)} SCFM`);
      lines.push(`  Measured flow reduction: ${num(sl.measuredReductionSCFM)} SCFM`);
      lines.push(`  Remaining flow: ${num(sl.remainingSCFM)} SCFM`);
      lines.push(`  Remaining estimated opportunity: ${money(sl.remainingOpportunity)} / year`);
    } else {
      lines.push("  Re-test: not yet recorded");
    }
    lines.push("");
  }

  lines.push("This report is a planning and close-out record. It is not a certified energy audit.");
  return lines.join("\n").trim();
}
