"use client";

import { useMemo, useRef, useState } from "react";
import {
  buildSurveyReport,
  buildSummaryText,
  validateSurvey,
  type LeakEntry,
  type Priority,
  type RepairStatus,
  type SurveyFlowUnit,
  type SurveySettings,
} from "@/lib/compressed-air-survey/engine";
import SectionCard from "@/components/SectionCard";
import EmptyState from "@/components/EmptyState";

const DEFAULT_SETTINGS: SurveySettings = {
  projectName: "",
  facility: "",
  surveyDate: "",
  hoursPerDay: 16,
  daysPerYear: 250,
  electricityRate: 0.12,
  specificPower: 18,
  recoverablePercentage: 100,
};

function formatCurrency(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "$0";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatNumber(n: number, decimals = 1): string {
  if (!isFinite(n) || isNaN(n)) return "0";
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

function formatPayback(months: number | null): string {
  if (months === null) return "—";
  if (months < 1) return "Less than 1 month";
  return `${months.toFixed(1)} months`;
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    HIGH: "bg-red-50 text-red-700 border-red-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
    LOW: "bg-gray-50 text-gray-600 border-gray-200",
    Unrated: "bg-gray-50 text-gray-400 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold tracking-wide border px-2 py-0.5 rounded ${styles[priority]}`}>
      {priority}
    </span>
  );
}

const inputClass = "field-input";
const labelClass = "field-label";

// ─── Leak Card ─────────────────────────────────────────────

function LeakCard({
  leak,
  computed,
  onChange,
  onDelete,
}: {
  leak: LeakEntry;
  computed: ReturnType<typeof buildSurveyReport>["leaks"][number];
  onChange: (patch: Partial<LeakEntry>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">{leak.id}</span>
          <PriorityBadge priority={computed.priority} />
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <select
            value={leak.status}
            onChange={(e) => onChange({ status: e.target.value as RepairStatus })}
            className="field-select w-28 text-xs"
          >
            <option value="Open">Open</option>
            <option value="Planned">Planned</option>
            <option value="Repaired">Repaired</option>
          </select>
          <button onClick={onDelete} className="btn btn-danger btn-sm shrink-0">
            Delete
          </button>
        </div>
        {/* Print-only status */}
        <span className="hidden print:inline text-xs text-muted">Status: {leak.status}</span>
      </div>

      {/* Inputs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 print:hidden">
        <div>
          <label className={labelClass}>Location</label>
          <input
            value={leak.location}
            onChange={(e) => onChange({ location: e.target.value })}
            placeholder="Line 3 coupling"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Equipment / Area (optional)</label>
          <input
            value={leak.equipment}
            onChange={(e) => onChange({ equipment: e.target.value })}
            placeholder="Packaging Line"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Leak Flow Rate</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="any"
              value={leak.flow}
              onChange={(e) => onChange({ flow: parseFloat(e.target.value) || 0 })}
              className={"flex-1 " + inputClass}
            />
            <select
              value={leak.flowUnit}
              onChange={(e) => onChange({ flowUnit: e.target.value as SurveyFlowUnit })}
              className="field-select w-24 shrink-0"
            >
              <option value="CFM">CFM</option>
              <option value="L/s">L/s</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Estimated Repair Cost ($, optional)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={leak.repairCost ?? ""}
            onChange={(e) => onChange({ repairCost: e.target.value === "" ? null : Math.max(0, parseFloat(e.target.value) || 0) })}
            placeholder="—"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Notes (optional)</label>
          <input
            value={leak.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Loose fitting near regulator"
            className={inputClass}
          />
        </div>
      </div>

      {/* Computed values */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 border-t border-border pt-3">
        <div>
          <div className="text-[11px] text-muted">Flow</div>
          <div className="text-sm font-medium text-foreground">{formatNumber(leak.flow)} {leak.flowUnit}</div>
        </div>
        <div>
          <div className="text-[11px] text-muted">Leak Power</div>
          <div className="text-sm font-medium text-foreground">{formatNumber(computed.leakPowerKW, 2)} kW</div>
        </div>
        <div>
          <div className="text-[11px] text-muted">Annual Energy Waste</div>
          <div className="text-sm font-medium text-foreground">{formatNumber(computed.annualEnergyKWh, 0)} kWh</div>
        </div>
        <div>
          <div className="text-[11px] text-muted">Annual Cost Loss</div>
          <div className="text-sm font-medium text-foreground">{formatCurrency(computed.annualCost)}</div>
        </div>
        <div>
          <div className="text-[11px] text-muted">Potential Savings</div>
          <div className="text-sm font-medium text-green-700">{formatCurrency(computed.annualSavings)}</div>
        </div>
        <div>
          <div className="text-[11px] text-muted">{computed.hasRepairCost ? "Est. Payback" : "Repair Cost"}</div>
          <div className="text-sm font-medium text-foreground">
            {computed.hasRepairCost ? formatPayback(computed.paybackMonths) : "Not provided"}
          </div>
        </div>
      </div>

      {/* Print-only details */}
      <div className="hidden print:block text-xs text-muted">
        {[
          leak.location.trim() && `Location: ${leak.location.trim()}`,
          leak.equipment.trim() && `Equipment: ${leak.equipment.trim()}`,
          leak.notes.trim() && `Notes: ${leak.notes.trim()}`,
        ]
          .filter(Boolean)
          .join("  ·  ")}
        {computed.hasRepairCost && `  ·  Repair Cost: ${formatCurrency(leak.repairCost || 0)}`}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────

export default function CompressedAirLeakSurveyReportBuilder() {
  const [settings, setSettings] = useState<SurveySettings>({ ...DEFAULT_SETTINGS });
  const [leaks, setLeaks] = useState<LeakEntry[]>([]);
  const [nextId, setNextId] = useState(1);
  const [copied, setCopied] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const report = useMemo(() => buildSurveyReport(settings, leaks), [settings, leaks]);
  const errors = validateSurvey(settings, leaks);
  const annualHours = settings.hoursPerDay * settings.daysPerYear;

  const updateSetting = <K extends keyof SurveySettings>(key: K, value: SurveySettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddLeak = () => {
    setLeaks((prev) => [
      ...prev,
      {
        id: `L-${String(nextId).padStart(3, "0")}`,
        location: "",
        equipment: "",
        flow: 0,
        flowUnit: "CFM",
        repairCost: null,
        notes: "",
        status: "Open",
      },
    ]);
    setNextId((n) => n + 1);
  };

  const handleUpdateLeak = (id: string, patch: Partial<LeakEntry>) => {
    setLeaks((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const handleDeleteLeak = (id: string) => {
    setLeaks((prev) => prev.filter((l) => l.id !== id));
  };

  const handleExample = () => {
    setSettings({
      ...DEFAULT_SETTINGS,
      projectName: "Packaging Plant Leak Survey",
      facility: "Demo Manufacturing",
      surveyDate: new Date().toISOString().slice(0, 10),
    });
    setLeaks([
      { id: "L-001", location: "Main line coupling", equipment: "", flow: 12, flowUnit: "CFM", repairCost: 80, notes: "", status: "Open" },
      { id: "L-002", location: "Packaging valve", equipment: "Packaging Line", flow: 6, flowUnit: "CFM", repairCost: 45, notes: "", status: "Open" },
      { id: "L-003", location: "Air dryer connection", equipment: "", flow: 18, flowUnit: "CFM", repairCost: 150, notes: "", status: "Planned" },
      { id: "L-004", location: "Assembly regulator", equipment: "Assembly Area", flow: 4, flowUnit: "CFM", repairCost: 30, notes: "", status: "Repaired" },
      { id: "L-005", location: "Line 2 quick connector", equipment: "", flow: 9, flowUnit: "CFM", repairCost: 60, notes: "", status: "Open" },
    ]);
    setNextId(6);
    setTimeout(() => {
      summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleClear = () => {
    if (!window.confirm("Clear all leak entries and restore default settings?")) return;
    setLeaks([]);
    setNextId(1);
    setSettings({ ...DEFAULT_SETTINGS });
  };

  const handleCopy = async () => {
    const text = buildSummaryText(settings, report);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const summary = report.summary;

  return (
    <div className="space-y-8">
      {/* Print-only report header */}
      <div className="hidden print:block">
        <div className="text-xs font-semibold tracking-widest text-muted uppercase">UtilRivet</div>
        <div className="text-xl font-bold text-foreground mt-1">Compressed Air Leak Survey Report</div>
        <div className="text-sm text-muted mt-2 space-y-0.5">
          {settings.projectName.trim() && <div>Project: {settings.projectName}</div>}
          {settings.facility.trim() && <div>Facility: {settings.facility}</div>}
          {settings.surveyDate.trim() && <div>Date: {settings.surveyDate}</div>}
        </div>
      </div>

      {/* Survey Settings */}
      <SectionCard title="Survey Settings" className="print:hidden">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelClass}>Project Name (optional)</label>
              <input
                value={settings.projectName}
                onChange={(e) => updateSetting("projectName", e.target.value)}
                placeholder="Plant A — Compressed Air Leak Survey"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Customer / Facility (optional)</label>
              <input
                value={settings.facility}
                onChange={(e) => updateSetting("facility", e.target.value)}
                placeholder="ABC Manufacturing"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Survey Date (optional)</label>
              <input
                type="date"
                value={settings.surveyDate}
                onChange={(e) => updateSetting("surveyDate", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Hours / day</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={settings.hoursPerDay}
                  onChange={(e) => updateSetting("hoursPerDay", parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Days / year</label>
                <input
                  type="number"
                  min="0"
                  max="366"
                  value={settings.daysPerYear}
                  onChange={(e) => updateSetting("daysPerYear", parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Electricity Rate ($/kWh)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.electricityRate}
                onChange={(e) => updateSetting("electricityRate", parseFloat(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Compressor Specific Power (kW / 100 CFM)</label>
              <input
                type="number"
                min="0.01"
                step="0.1"
                value={settings.specificPower}
                onChange={(e) => updateSetting("specificPower", parseFloat(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Recoverable Leakage (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.recoverablePercentage}
                onChange={(e) => updateSetting("recoverablePercentage", parseFloat(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
            <div className="flex items-end pb-1">
              <p className="text-xs text-muted">
                Annual Operating Hours: <span className="font-medium text-foreground">{formatNumber(annualHours, 0)} h</span>
              </p>
            </div>
          </div>
          <p className="text-[13px] text-muted mt-4">
            Specific power is the electrical power required to produce 100 CFM of compressed air. Use the actual specific power of the compressed air system when available.
          </p>
      </SectionCard>

      {/* Print-only settings */}
      <div className="hidden print:block text-sm text-muted">
        Assumptions: {formatNumber(annualHours, 0)} annual operating hours ({settings.hoursPerDay} h/day × {settings.daysPerYear} days/year), ${settings.electricityRate}/kWh, {settings.specificPower} kW / 100 CFM, {settings.recoverablePercentage}% recoverable.
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 print:hidden">
          <ul className="space-y-1">
            {errors.map((err, i) => (
              <li key={i} className="text-sm text-red-700">{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Leak Entries */}
      <SectionCard
        title="Leak Entries"
        actions={
          <button onClick={handleAddLeak} className="btn btn-primary btn-sm print:hidden">
            + Add Leak
          </button>
        }
      >
        {leaks.length === 0 ? (
          <EmptyState
            title="No leaks added yet."
            hint="Add a leak manually or try the example survey."
            action={
              <button onClick={handleExample} className="btn btn-secondary btn-sm">
                Try Example
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {report.leaks.map((c) => (
              <LeakCard
                key={c.entry.id}
                leak={c.entry}
                computed={c}
                onChange={(patch) => handleUpdateLeak(c.entry.id, patch)}
                onDelete={() => handleDeleteLeak(c.entry.id)}
              />
            ))}
          </div>
        )}

        {/* Action row */}
        <div className="flex flex-wrap items-center gap-3 mt-4 print:hidden">
          <button onClick={handleExample} className="btn btn-secondary btn-sm">
            Try Example
          </button>
          <button onClick={handleClear} className="btn btn-danger btn-sm">
            Clear Survey
          </button>
        </div>
      </SectionCard>

      {/* Survey Summary */}
      {leaks.length > 0 && (
        <div ref={summaryRef} className="space-y-6">
          <div className="result-card">
            <h2 className="result-label">Original Annual Loss</h2>
            <div className="flex items-baseline gap-2">
              <span className="result-number">{formatCurrency(summary.originalAnnualLoss)}</span>
              <span className="text-sm text-muted">/ year</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span className="text-muted">Closed Potential Savings: <span className="font-medium text-foreground">{formatCurrency(summary.closedPotentialSavings)}</span></span>
              <span className="text-muted">Remaining Annual Loss: <span className="font-medium text-foreground">{formatCurrency(summary.remainingOpenLoss)}</span></span>
              <span className="text-muted">Status: <span className="font-medium text-foreground">{summary.openCount} Open · {summary.plannedCount} Planned · {summary.repairedCount} Repaired</span></span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="result-tile">
              <div className="result-tile-label">Total Leaks</div>
              <div className="result-tile-value">{summary.totalLeaks}</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Total Leak Flow</div>
              <div className="result-tile-value">{formatNumber(summary.totalFlowCFM)} CFM</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Total Leak Power</div>
              <div className="result-tile-value">{formatNumber(summary.totalLeakPowerKW)} kW</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Annual Energy Waste</div>
              <div className="result-tile-value">{formatNumber(summary.totalAnnualEnergyKWh, 0)} kWh</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Remaining Potential Savings</div>
              <div className="result-tile-value text-green-700">{formatCurrency(summary.remainingPotentialSavings)}</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Remaining Repair Cost</div>
              <div className="result-tile-value">{formatCurrency(summary.remainingRepairCost)}</div>
            </div>
            {summary.overallRemainingPaybackMonths !== null && (
              <div className="result-tile">
                <div className="result-tile-label">Overall Remaining Payback</div>
                <div className="result-tile-value">{formatPayback(summary.overallRemainingPaybackMonths)}</div>
              </div>
            )}
          </div>

          {/* Repair Priorities */}
          <SectionCard
            title="Repair Priorities"
            description="Open and Planned leaks only. Order: repair priority first, then highest annual savings."
          >
            {report.priorities.length === 0 ? (
              <p className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted">
                No Open or Planned leaks remain.
              </p>
            ) : (
              <ol className="rounded-xl border border-border bg-background divide-y divide-border">
                {report.priorities.map((l, i) => (
                  <li key={l.entry.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-semibold text-muted shrink-0">{i + 1}.</span>
                        <span className="text-sm font-medium text-foreground">{l.entry.id}</span>
                        <span className="text-sm text-muted truncate">{l.entry.location.trim() || "No location"}</span>
                      </div>
                      <PriorityBadge priority={l.priority} />
                    </div>
                    <div className="mt-1 pl-5 flex flex-wrap gap-x-5 gap-y-0.5 text-xs text-muted">
                      <span>Annual Savings: <span className="font-medium text-green-700">{formatCurrency(l.annualSavings)}</span></span>
                      <span>Repair Cost: <span className="font-medium text-foreground">{l.hasRepairCost ? formatCurrency(l.entry.repairCost || 0) : "Not provided"}</span></span>
                      <span>Payback: <span className="font-medium text-foreground">{formatPayback(l.paybackMonths)}</span></span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>

          {report.completed.length > 0 && (
            <SectionCard
              title="Completed / Repaired"
              description="Closed potential savings are estimates from the original survey, not verified savings."
            >
              <div className="rounded-xl border border-border bg-background divide-y divide-border">
                {report.completed.map((l) => (
                  <div key={l.entry.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{l.entry.id}</span>
                      <span className="text-sm text-muted">{l.entry.location.trim() || "No location"}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-5 gap-y-0.5 text-xs text-muted">
                      <span>Original Annual Loss: <span className="font-medium text-foreground">{formatCurrency(l.annualCost)}</span></span>
                      <span>Closed Potential Savings: <span className="font-medium text-green-700">{formatCurrency(l.annualSavings)}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Copy / Print */}
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <button onClick={handleCopy} className="btn btn-primary">
              {copied ? "Copied ✓" : "Copy Summary"}
            </button>
            <button onClick={() => window.print()} className="btn btn-secondary">
              Print Report
            </button>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="print:hidden">
        <h2 className="text-lg font-semibold text-foreground mb-3">How It Works</h2>
        <ol className="space-y-2 text-sm text-muted">
          <li>1. Set your operating hours, electricity rate and compressor specific power.</li>
          <li>2. Add each leak found during the survey with its location, flow rate and repair cost.</li>
          <li>3. Review the survey summary and repair priorities, then copy or print the report.</li>
        </ol>
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-muted border-t border-border pt-4">
        This report provides estimated compressed air leak energy and cost values for maintenance planning. Actual savings depend on compressor performance, system controls, operating conditions, and measured leak flow.
      </div>
    </div>
  );
}
