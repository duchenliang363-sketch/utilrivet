"use client";

import { useMemo, useRef, useState } from "react";
import {
  CONDITIONS,
  TRAP_TYPES,
  buildSummaryText,
  buildSurveyReport,
  validateSurvey,
  type LossUnit,
  type PressureUnit,
  type Priority,
  type RepairStatus,
  type SurveySettings,
  type TrapCondition,
  type TrapComputed,
  type TrapEntry,
  type TrapType,
} from "@/lib/steam-trap-survey/engine";
import SectionCard from "@/components/SectionCard";
import EmptyState from "@/components/EmptyState";

const DEFAULT_SETTINGS: SurveySettings = {
  projectName: "",
  facility: "",
  surveyDate: "",
  technician: "",
  hoursPerDay: 16,
  daysPerYear: 300,
  steamCostPer1000Lb: 12,
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
    "Inspection Required": "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold tracking-wide border px-2 py-0.5 rounded ${styles[priority]}`}>
      {priority}
    </span>
  );
}

const inputClass = "field-input";
const labelClass = "field-label";

// ─── Trap Card ─────────────────────────────────────────────

function TrapCard({
  computed,
  onChange,
  onDelete,
}: {
  computed: TrapComputed;
  onChange: (patch: Partial<TrapEntry>) => void;
  onDelete: () => void;
}) {
  const trap = computed.entry;
  return (
    <div className="rounded-xl border border-border bg-background p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">{trap.id}</span>
          {computed.priority !== null ? (
            <PriorityBadge priority={computed.priority} />
          ) : (
            <span className="text-[11px] font-semibold text-muted">
              {trap.status === "Repaired" ? "Completed" : "No Repair Required"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <select
            value={trap.status}
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
        <span className="hidden print:inline text-xs text-muted">Status: {trap.status}</span>
      </div>

      {/* Inputs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 print:hidden">
        <div>
          <label className={labelClass}>Location</label>
          <input
            value={trap.location}
            onChange={(e) => onChange({ location: e.target.value })}
            placeholder="Main header — Line 2"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Equipment / Area (optional)</label>
          <input
            value={trap.equipment}
            onChange={(e) => onChange({ equipment: e.target.value })}
            placeholder="Packaging Line"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Trap Type</label>
          <select
            value={trap.trapType}
            onChange={(e) => onChange({ trapType: e.target.value as TrapType })}
            className={inputClass}
          >
            {TRAP_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Steam Pressure</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="any"
              value={trap.pressure}
              onChange={(e) => onChange({ pressure: parseFloat(e.target.value) || 0 })}
              className={"flex-1 " + inputClass}
            />
            <select
              value={trap.pressureUnit}
              onChange={(e) => onChange({ pressureUnit: e.target.value as PressureUnit })}
              className="field-select w-24 shrink-0"
            >
              <option value="psi">psi</option>
              <option value="bar">bar</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Condition / Status</label>
          <select
            value={trap.condition}
            onChange={(e) => onChange({ condition: e.target.value as TrapCondition })}
            className={inputClass}
          >
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>{c === "Failed Open" ? "Failed Open / Blowing" : c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Estimated Steam Loss</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="any"
              value={trap.steamLoss}
              onChange={(e) => onChange({ steamLoss: parseFloat(e.target.value) || 0 })}
              className={"flex-1 " + inputClass}
            />
            <select
              value={trap.lossUnit}
              onChange={(e) => onChange({ lossUnit: e.target.value as LossUnit })}
              className="field-select w-24 shrink-0"
            >
              <option value="lb/hr">lb/hr</option>
              <option value="kg/hr">kg/hr</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Estimated Repair Cost ($, optional)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={trap.repairCost ?? ""}
            onChange={(e) => onChange({ repairCost: e.target.value === "" ? null : Math.max(0, parseFloat(e.target.value) || 0) })}
            placeholder="—"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Notes (optional)</label>
          <input
            value={trap.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Blowing steam, audible hiss"
            className={inputClass}
          />
        </div>
      </div>

      <p className="text-[11px] text-muted print:hidden">
        Enter the measured or estimated steam loss from your inspection method or survey equipment.
      </p>

      {/* Condition notes */}
      {trap.condition === "Good" && trap.steamLoss > 0 && (
        <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1">
          A trap marked Good is not included in recoverable steam loss.
        </p>
      )}
      {trap.condition === "Failed Closed" && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
          Potential production / process issue — steam loss cost is not estimated automatically.
        </p>
      )}
      {trap.condition === "Unknown" && (
        <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1">
          Inspection required — entered steam loss is not counted as recoverable until the condition is confirmed.
        </p>
      )}

      {/* Computed values */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 border-t border-border pt-3">
        <div>
          <div className="text-[11px] text-muted">Condition</div>
          <div className="text-sm font-medium text-foreground">{trap.condition}</div>
        </div>
        <div>
          <div className="text-[11px] text-muted">Steam Pressure</div>
          <div className="text-sm font-medium text-foreground">{formatNumber(trap.pressure)} {trap.pressureUnit}</div>
        </div>
        <div>
          <div className="text-[11px] text-muted">Entered Steam Loss</div>
          <div className="text-sm font-medium text-foreground">{formatNumber(trap.steamLoss)} {trap.lossUnit}</div>
        </div>
        <div>
          <div className="text-[11px] text-muted">Recoverable Annual Steam Loss</div>
          <div className="text-sm font-medium text-foreground">{formatNumber(computed.annualSteamLossLb, 0)} lb</div>
        </div>
        <div>
          <div className="text-[11px] text-muted">Recoverable Annual Cost Loss</div>
          <div className="text-sm font-medium text-foreground">{formatCurrency(computed.annualLossCost)}</div>
        </div>
        <div>
          <div className="text-[11px] text-muted">{computed.paybackMonths !== null ? "Est. Payback" : "Repair Cost"}</div>
          <div className="text-sm font-medium text-foreground">
            {computed.paybackMonths !== null
              ? formatPayback(computed.paybackMonths)
              : computed.hasRepairCost
                ? formatCurrency(trap.repairCost || 0)
                : "Not provided"}
          </div>
        </div>
      </div>

      {/* Print-only details */}
      <div className="hidden print:block text-xs text-muted">
        {[
          `Type: ${trap.trapType}`,
          trap.location.trim() && `Location: ${trap.location.trim()}`,
          trap.equipment.trim() && `Equipment: ${trap.equipment.trim()}`,
          trap.notes.trim() && `Notes: ${trap.notes.trim()}`,
        ]
          .filter(Boolean)
          .join("  ·  ")}
        {computed.hasRepairCost && `  ·  Repair Cost: ${formatCurrency(trap.repairCost || 0)}`}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────

export default function SteamTrapSurveyReportBuilder() {
  const [settings, setSettings] = useState<SurveySettings>({ ...DEFAULT_SETTINGS });
  const [traps, setTraps] = useState<TrapEntry[]>([]);
  const [nextId, setNextId] = useState(1);
  const [copied, setCopied] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const report = useMemo(() => buildSurveyReport(settings, traps), [settings, traps]);
  const errors = validateSurvey(settings, traps);
  const annualHours = settings.hoursPerDay * settings.daysPerYear;

  const updateSetting = <K extends keyof SurveySettings>(key: K, value: SurveySettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddTrap = () => {
    setTraps((prev) => [
      ...prev,
      {
        id: `T-${String(nextId).padStart(3, "0")}`,
        location: "",
        equipment: "",
        trapType: "Thermodynamic",
        pressure: 0,
        pressureUnit: "psi",
        condition: "Unknown",
        steamLoss: 0,
        lossUnit: "lb/hr",
        repairCost: null,
        notes: "",
        status: "Open",
      },
    ]);
    setNextId((n) => n + 1);
  };

  const handleUpdateTrap = (id: string, patch: Partial<TrapEntry>) => {
    setTraps((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const handleDeleteTrap = (id: string) => {
    setTraps((prev) => prev.filter((t) => t.id !== id));
  };

  const handleExample = () => {
    setSettings({
      ...DEFAULT_SETTINGS,
      projectName: "Demo Steam Trap Survey",
      facility: "Demo Manufacturing Plant",
      surveyDate: new Date().toISOString().slice(0, 10),
    });
    setTraps([
      { id: "T-001", location: "Boiler Room Header", equipment: "", trapType: "Thermodynamic", pressure: 100, pressureUnit: "psi", condition: "Good", steamLoss: 0, lossUnit: "lb/hr", repairCost: null, notes: "", status: "Open" },
      { id: "T-002", location: "Packaging Line", equipment: "Packaging Line", trapType: "Float & Thermostatic", pressure: 80, pressureUnit: "psi", condition: "Leaking", steamLoss: 18, lossUnit: "lb/hr", repairCost: 120, notes: "", status: "Open" },
      { id: "T-003", location: "Process Heater", equipment: "", trapType: "Inverted Bucket", pressure: 100, pressureUnit: "psi", condition: "Failed Open", steamLoss: 35, lossUnit: "lb/hr", repairCost: 250, notes: "", status: "Open" },
      { id: "T-004", location: "Dryer Line", equipment: "", trapType: "Thermodynamic", pressure: 90, pressureUnit: "psi", condition: "Leaking", steamLoss: 12, lossUnit: "lb/hr", repairCost: 95, notes: "", status: "Planned" },
      { id: "T-005", location: "Washdown Area", equipment: "", trapType: "Thermostatic", pressure: 60, pressureUnit: "psi", condition: "Failed Closed", steamLoss: 0, lossUnit: "lb/hr", repairCost: 180, notes: "", status: "Open" },
      { id: "T-006", location: "Line 3 Header", equipment: "", trapType: "Unknown", pressure: 75, pressureUnit: "psi", condition: "Unknown", steamLoss: 0, lossUnit: "lb/hr", repairCost: null, notes: "", status: "Open" },
    ]);
    setNextId(7);
    setTimeout(() => {
      summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleClear = () => {
    if (!window.confirm("Clear all steam trap entries and restore default settings?")) return;
    setTraps([]);
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
        <div className="text-xl font-bold text-foreground mt-1">Steam Trap Survey Report</div>
        <div className="text-sm text-muted mt-2 space-y-0.5">
          {settings.projectName.trim() && <div>Project: {settings.projectName}</div>}
          {settings.facility.trim() && <div>Facility: {settings.facility}</div>}
          {settings.surveyDate.trim() && <div>Survey Date: {settings.surveyDate}</div>}
          {settings.technician.trim() && <div>Technician: {settings.technician}</div>}
        </div>
      </div>

      {/* Survey Information */}
      <SectionCard title="Survey Information" className="print:hidden">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelClass}>Project Name (optional)</label>
              <input
                value={settings.projectName}
                onChange={(e) => updateSetting("projectName", e.target.value)}
                placeholder="Plant Steam Trap Survey"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Customer / Facility (optional)</label>
              <input
                value={settings.facility}
                onChange={(e) => updateSetting("facility", e.target.value)}
                placeholder="Demo Manufacturing"
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
            <div>
              <label className={labelClass}>Survey Technician (optional)</label>
              <input
                value={settings.technician}
                onChange={(e) => updateSetting("technician", e.target.value)}
                placeholder="J. Smith"
                className={inputClass}
              />
            </div>
        </div>
      </SectionCard>

      {/* Survey Settings */}
      <SectionCard title="Survey Settings" className="print:hidden">
        <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Operating Hours / Day</label>
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
              <label className={labelClass}>Operating Days / Year</label>
              <input
                type="number"
                min="0"
                max="366"
                value={settings.daysPerYear}
                onChange={(e) => updateSetting("daysPerYear", parseFloat(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Steam Cost ($ / 1,000 lb)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.steamCostPer1000Lb}
                onChange={(e) => updateSetting("steamCostPer1000Lb", parseFloat(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
          </div>
          <p className="text-[13px] text-muted mt-4">
            Annual Operating Hours: <span className="font-medium text-foreground">{formatNumber(annualHours, 0)} h</span> ({settings.hoursPerDay} h/day × {settings.daysPerYear} days/year). Steam cost is entered directly as $/1,000 lb of steam.
          </p>
      </SectionCard>

      {/* Print-only assumptions */}
      <div className="hidden print:block text-sm text-muted">
        Assumptions: {formatNumber(annualHours, 0)} annual operating hours ({settings.hoursPerDay} h/day × {settings.daysPerYear} days/year), steam cost ${settings.steamCostPer1000Lb} / 1,000 lb.
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

      {/* Steam Trap Entries */}
      <SectionCard
        title="Steam Trap Entries"
        actions={
          <button onClick={handleAddTrap} className="btn btn-primary btn-sm print:hidden">
            + Add Steam Trap
          </button>
        }
      >
        {traps.length === 0 ? (
          <EmptyState
            title="No steam traps added yet."
            hint="Add a steam trap manually or try the example survey."
            action={
              <button onClick={handleExample} className="btn btn-secondary btn-sm">
                Try Example
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {report.traps.map((c) => (
              <TrapCard
                key={c.entry.id}
                computed={c}
                onChange={(patch) => handleUpdateTrap(c.entry.id, patch)}
                onDelete={() => handleDeleteTrap(c.entry.id)}
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
      {traps.length > 0 && (
        <div ref={summaryRef} className="space-y-6">
          <div className="result-card">
            <h2 className="result-label">Original Recoverable Annual Cost Loss</h2>
            <div className="flex items-baseline gap-2">
              <span className="result-number">{formatCurrency(summary.originalAnnualLoss)}</span>
              <span className="text-sm text-muted">/ year</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span className="text-muted">Remaining Recoverable Annual Cost Loss: <span className="font-medium text-foreground">{formatCurrency(summary.remainingOpenLoss)}</span></span>
              <span className="text-muted">Status: <span className="font-medium text-foreground">{summary.openCount} Open · {summary.plannedCount} Planned · {summary.repairedCount} Repaired</span></span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm border-t border-border pt-3">
              <span className="text-muted">Total Traps Surveyed: <span className="font-medium text-foreground">{summary.totalTraps}</span></span>
              <span className="text-muted">Good: <span className="font-medium text-foreground">{summary.goodCount}</span></span>
              <span className="text-muted">Leaking: <span className="font-medium text-foreground">{summary.leakingCount}</span></span>
              <span className="text-muted">Failed Open: <span className="font-medium text-foreground">{summary.failedOpenCount}</span></span>
              <span className="text-muted">Failed Closed: <span className="font-medium text-foreground">{summary.failedClosedCount}</span></span>
              <span className="text-muted">Unknown: <span className="font-medium text-foreground">{summary.unknownCount}</span></span>
              <span className="text-muted">Failure / Issue Rate: <span className="font-medium text-red-700">{(summary.failureRate * 100).toFixed(1)}%</span></span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="result-tile">
              <div className="result-tile-label">Original Recoverable Steam Loss</div>
              <div className="result-tile-value">{formatNumber(summary.totalSteamLossLbHr)} lb/hr</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Original Recoverable Annual Steam Loss</div>
              <div className="result-tile-value">{formatNumber(summary.totalAnnualSteamLossLb, 0)} lb/year</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Remaining Potential Savings</div>
              <div className="result-tile-value text-green-700">{formatCurrency(summary.potentialAnnualSavings)}</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Remaining Repair Cost</div>
              <div className="result-tile-value">{formatCurrency(summary.remainingRepairCost)}</div>
            </div>
            {summary.overallPaybackMonths !== null && (
              <div className="result-tile">
                <div className="result-tile-label">Overall Remaining Payback</div>
                <div className="result-tile-value">{formatPayback(summary.overallPaybackMonths)}</div>
              </div>
            )}
          </div>

          {/* Repair Priorities */}
          <SectionCard
            title="Repair Priorities"
            description="Open and Planned issues only. Order: HIGH → MEDIUM → LOW → Unrated → Inspection Required."
          >
            {report.priorities.length === 0 ? (
              <p className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted">
                No open repair or inspection issues remain.
              </p>
            ) : (
              <ol className="rounded-xl border border-border bg-background divide-y divide-border">
                {report.priorities.map((t, i) => (
                  <li key={t.entry.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-semibold text-muted shrink-0">{i + 1}.</span>
                        <span className="text-sm font-medium text-foreground">{t.entry.id}</span>
                        <span className="text-sm text-muted truncate">{t.entry.location.trim() || "No location"}</span>
                      </div>
                      {t.priority !== null && <PriorityBadge priority={t.priority} />}
                    </div>
                    <div className="mt-1 pl-5 flex flex-wrap gap-x-5 gap-y-0.5 text-xs text-muted">
                      <span>Condition: <span className="font-medium text-foreground">{t.entry.condition}</span></span>
                      {t.annualSavings > 0 && (
                        <span>Annual Savings: <span className="font-medium text-green-700">{formatCurrency(t.annualSavings)}</span></span>
                      )}
                      <span>Repair Cost: <span className="font-medium text-foreground">{t.hasRepairCost ? formatCurrency(t.entry.repairCost || 0) : "Not provided"}</span></span>
                      {t.paybackMonths !== null && (
                        <span>Payback: <span className="font-medium text-foreground">{formatPayback(t.paybackMonths)}</span></span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>

          {report.completed.length > 0 && (
            <SectionCard
              title="Completed / Repaired"
              description="Closed potential savings are original survey estimates, not verified savings."
            >
              <div className="rounded-xl border border-border bg-background divide-y divide-border">
                {report.completed.map((t) => (
                  <div key={t.entry.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{t.entry.id}</span>
                      <span className="text-sm text-muted">{t.entry.location.trim() || "No location"}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-5 gap-y-0.5 text-xs text-muted">
                      <span>Condition: <span className="font-medium text-foreground">{t.entry.condition}</span></span>
                      {t.annualSavings > 0 && (
                        <span>Closed Potential Savings: <span className="font-medium text-green-700">{formatCurrency(t.annualSavings)}</span></span>
                      )}
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
          <li>1. Add the steam traps inspected during the survey.</li>
          <li>2. Record each trap&apos;s condition, estimated steam loss and repair cost.</li>
          <li>3. Review annual losses, repair priorities and the survey summary — then copy or print the report.</li>
        </ol>
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-muted border-t border-border pt-4">
        This report provides preliminary steam loss and cost estimates for maintenance planning. Actual steam loss depends on trap design, orifice size, differential pressure, operating condition, installation and measurement method. Estimated steam loss should be based on measured or appropriately estimated survey data.
      </div>
    </div>
  );
}
