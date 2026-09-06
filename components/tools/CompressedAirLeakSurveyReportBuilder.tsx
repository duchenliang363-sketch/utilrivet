"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SectionCard from "@/components/SectionCard";
import EmptyState from "@/components/EmptyState";
import {
  CALCULATION_VERSION,
  COMPONENT_TYPES,
  CONFIDENCE_LEVELS,
  DEFAULT_SETTINGS,
  FLOW_UNITS,
  LEAK_STATUSES,
  OPERATIONAL_IMPACTS,
  PRESSURE_UNITS,
  QUANTIFICATION_METHODS,
  REPAIR_ACCESS_LEVELS,
  SUGGESTED_ACTIONS,
  URGENCY_LEVELS,
  applyPlan,
  applyRepairCompleted,
  applyRetest,
  browserStore,
  buildDemoProject,
  buildManagementReport,
  buildRepairWorkPack,
  buildSurveyReport,
  createSurveyStore,
  emptyLeak,
  exportProjectJson,
  exportRegisterCsv,
  filterRegister,
  importProjectJson,
  nextTag,
  returnFailedToQueue,
  uniqueAreas,
  validateSurvey,
  type ComponentType,
  type Confidence,
  type FlowUnit,
  type LeakEntry,
  type LeakStatus,
  type OperationalImpact,
  type QuantificationMethod,
  type RegisterSortKey,
  type RepairAccess,
  type SuggestedAction,
  type SurveyProject,
  type SurveySettings,
  type Urgency,
} from "@/lib/compressed-air-survey/engine";

type View = "project" | "capture" | "register" | "queue" | "reports";
type PressureUnit = "psig" | "bar";

const inputClass = "field-input";
const labelClass = "field-label";

function formatCurrency(n: number): string {
  if (!Number.isFinite(n)) return "$0";
  return "$" + Math.round(n).toLocaleString("en-US");
}

function formatNumber(n: number, decimals = 1): string {
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-US", { maximumFractionDigits: decimals });
}

function formatSavedAt(iso: string): string {
  if (!iso) return "Not saved yet";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function StatusBadge({ status }: { status: LeakStatus }) {
  const styles: Record<LeakStatus, string> = {
    Open: "bg-gray-50 text-gray-700 border-gray-200",
    Planned: "bg-blue-50 text-blue-700 border-blue-200",
    "Awaiting Re-test": "bg-amber-50 text-amber-800 border-amber-200",
    "Verified Closed": "bg-green-50 text-green-700 border-green-200",
    "Failed Re-test": "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold tracking-wide border px-2 py-0.5 rounded ${styles[status]}`}>
      {status}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function leakFormState(entry: LeakEntry) {
  return { ...entry };
}

export default function CompressedAirLeakSurveyReportBuilder() {
  const storeRef = useRef<ReturnType<typeof createSurveyStore> | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [project, setProject] = useState<SurveyProject | null>(null);
  const [projects, setProjects] = useState<SurveyProject[]>([]);
  const [view, setView] = useState<View>("project");
  const [form, setForm] = useState<LeakEntry>(emptyLeak("new", "L-001"));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeakStatus | "">("");
  const [accessFilter, setAccessFilter] = useState<RepairAccess | "">("");
  const [sortKey, setSortKey] = useState<RegisterSortKey>("tag");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [repairBy, setRepairBy] = useState("");
  const [repairDate, setRepairDate] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [actualCost, setActualCost] = useState("");
  const [retestDate, setRetestDate] = useState("");
  const [testedBy, setTestedBy] = useState("");
  const [retestMethod, setRetestMethod] = useState<QuantificationMethod>("Ultrasonic instrument");
  const [postFlow, setPostFlow] = useState("");
  const [workflowError, setWorkflowError] = useState("");
  const [copied, setCopied] = useState("");

  const refreshList = () => {
    const store = storeRef.current;
    if (!store) return;
    setProjects(store.listProjects());
  };

  useEffect(() => {
    const store = createSurveyStore(browserStore());
    storeRef.current = store;
    let active = store.getActive();
    if (!active) active = store.createProject();
    setProject(active);
    setProjects(store.listProjects());
    setForm(emptyLeak("new", nextTag(active.nextTagNumber)));
    setReady(true);
  }, []);

  const commit = (mutator: (p: SurveyProject) => SurveyProject) => {
    const store = storeRef.current;
    if (!store) return;
    const next = store.updateActive(mutator);
    setProject(next);
    refreshList();
    return next;
  };

  const report = useMemo(
    () => (project ? buildSurveyReport(project.settings, project.leaks) : null),
    [project],
  );
  const errors = project ? validateSurvey(project.settings, project.leaks) : [];
  const areas = project ? uniqueAreas(project.leaks) : [];
  const registerRows = project
    ? filterRegister(project.leaks, {
        query,
        area: areaFilter,
        status: statusFilter,
        access: accessFilter,
        sortKey,
        sortDir,
      })
    : [];
  const selected = project?.leaks.find((l) => l.id === selectedId) ?? null;
  const selectedComputed = report?.leaks.find((l) => l.entry.id === selectedId) ?? null;

  const patchSettings = <K extends keyof SurveySettings>(key: K, value: SurveySettings[K]) => {
    commit((p) => ({ ...p, settings: { ...p.settings, [key]: value } }));
  };

  const patchForm = (patch: Partial<LeakEntry>) => setForm((prev) => ({ ...prev, ...patch }));

  const resetForm = (nextNumber?: number) => {
    const n = nextNumber ?? project?.nextTagNumber ?? 1;
    setEditingId(null);
    setForm(emptyLeak("new", nextTag(n)));
    if (photoRef.current) photoRef.current.value = "";
  };

  const handleSaveLeak = () => {
    if (!project) return;
    if (editingId) {
      commit((p) => ({
        ...p,
        leaks: p.leaks.map((l) => (l.id === editingId ? { ...form, id: editingId } : l)),
      }));
      setView("register");
      resetForm(project.nextTagNumber);
      return;
    }
    const id = `leak-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    commit((p) => ({
      ...p,
      leaks: [...p.leaks, { ...form, id, tag: form.tag.trim() || nextTag(p.nextTagNumber) }],
      nextTagNumber: p.nextTagNumber + 1,
    }));
    resetForm((project.nextTagNumber ?? 1) + 1);
  };

  const handleEdit = (entry: LeakEntry) => {
    setEditingId(entry.id);
    setForm(leakFormState(entry));
    setSelectedId(entry.id);
    setView("capture");
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this leak from the register?")) return;
    commit((p) => ({ ...p, leaks: p.leaks.filter((l) => l.id !== id) }));
    if (selectedId === id) setSelectedId(null);
  };

  const handlePhoto = (file: File | null) => {
    if (!file) {
      patchForm({ photoDataUrl: null });
      return;
    }
    if (file.size > 1_200_000) {
      window.alert("Photo is too large for browser storage. Use an image under 1.2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => patchForm({ photoDataUrl: typeof reader.result === "string" ? reader.result : null });
    reader.readAsDataURL(file);
  };

  const handleNewProject = () => {
    const store = storeRef.current;
    if (!store) return;
    const created = store.createProject({ ...DEFAULT_SETTINGS });
    setProject(created);
    refreshList();
    resetForm(1);
    setView("project");
  };

  const handleSwitch = (id: string) => {
    const store = storeRef.current;
    if (!store) return;
    const next = store.setActiveProject(id);
    setProject(next);
    resetForm(next.nextTagNumber);
    setSelectedId(null);
  };

  const handleDeleteProject = () => {
    if (!project) return;
    if (!window.confirm("Delete this survey project from this browser?")) return;
    const store = storeRef.current;
    if (!store) return;
    store.deleteProject(project.id);
    let active = store.getActive();
    if (!active) active = store.createProject();
    setProject(active);
    refreshList();
    resetForm(active.nextTagNumber);
  };

  const handleLoadDemo = () => {
    const store = storeRef.current;
    if (!store) return;
    const imported = store.importProject(buildDemoProject());
    setProject(imported);
    refreshList();
    resetForm(imported.nextTagNumber);
    setView("register");
  };

  const handleExportJson = () => {
    if (!project) return;
    downloadText(`${slugName(project)}.json`, exportProjectJson(project), "application/json");
  };

  const handleImportFile = async (file: File | null) => {
    if (!file) return;
    try {
      const imported = importProjectJson(await file.text());
      const store = storeRef.current;
      if (!store) return;
      const next = store.importProject(imported);
      setProject(next);
      refreshList();
      resetForm(next.nextTagNumber);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Import failed.");
    }
  };

  const runWorkflow = (fn: () => void) => {
    try {
      setWorkflowError("");
      fn();
    } catch (err) {
      setWorkflowError(err instanceof Error ? err.message : "Workflow step failed.");
    }
  };

  const updateLeak = (id: string, next: LeakEntry) => {
    commit((p) => ({ ...p, leaks: p.leaks.map((l) => (l.id === id ? next : l)) }));
    setSelectedId(id);
  };

  if (!ready || !project || !report) {
    return <p className="text-sm text-muted">Loading survey project…</p>;
  }

  const summary = report.summary;
  const fileBase = slugName(project);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="text-sm font-semibold text-foreground">{project.settings.projectName.trim() || "Untitled survey project"}</div>
          <div className="text-xs text-muted">Last saved: {formatSavedAt(project.lastSavedAt)}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={project.id}
            onChange={(e) => handleSwitch(e.target.value)}
            className="field-select min-w-[12rem]"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.settings.projectName.trim() || "Untitled project"}
              </option>
            ))}
          </select>
          <button onClick={handleNewProject} className="btn btn-secondary btn-sm">New project</button>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 print:hidden">
        {(
          [
            ["project", "Project"],
            ["capture", "Capture"],
            ["register", "Register"],
            ["queue", "Repair Queue"],
            ["reports", "Reports"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`btn btn-sm ${view === id ? "btn-primary" : "btn-secondary"}`}
          >
            {label}
          </button>
        ))}
      </nav>

      {errors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 print:hidden">
          <ul className="space-y-1">
            {errors.map((err) => (
              <li key={err} className="text-sm text-red-700">{err}</li>
            ))}
          </ul>
        </div>
      )}

      {view === "project" && (
        <SectionCard title="Project Setup" description="Browser-local project. Refresh keeps the data. Projects do not share leaks.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Project name">
              <input value={project.settings.projectName} onChange={(e) => patchSettings("projectName", e.target.value)} className={inputClass} placeholder="Plant A — Leak Survey" />
            </Field>
            <Field label="Customer / facility">
              <input value={project.settings.facility} onChange={(e) => patchSettings("facility", e.target.value)} className={inputClass} placeholder="ABC Manufacturing" />
            </Field>
            <Field label="Survey date">
              <input type="date" value={project.settings.surveyDate} onChange={(e) => patchSettings("surveyDate", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Surveyed by">
              <input value={project.settings.surveyedBy} onChange={(e) => patchSettings("surveyedBy", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Hours / day">
              <input type="number" min={0} max={24} value={project.settings.hoursPerDay} onChange={(e) => patchSettings("hoursPerDay", parseFloat(e.target.value) || 0)} className={inputClass} />
            </Field>
            <Field label="Days / year">
              <input type="number" min={0} max={366} value={project.settings.daysPerYear} onChange={(e) => patchSettings("daysPerYear", parseFloat(e.target.value) || 0)} className={inputClass} />
            </Field>
            <Field label="Electricity rate ($/kWh)">
              <input type="number" min={0} step="0.01" value={project.settings.electricityRate} onChange={(e) => patchSettings("electricityRate", parseFloat(e.target.value) || 0)} className={inputClass} />
            </Field>
            <Field label="Specific power (kW / 100 SCFM)">
              <input type="number" min={0.01} step="0.1" value={project.settings.specificPower} onChange={(e) => patchSettings("specificPower", parseFloat(e.target.value) || 0)} className={inputClass} />
            </Field>
            <Field label="Compressor control adjustment factor">
              <input type="number" min={0} step="0.05" value={project.settings.controlAdjustmentFactor} onChange={(e) => patchSettings("controlAdjustmentFactor", parseFloat(e.target.value) || 0)} className={inputClass} />
            </Field>
            <Field label="Savings realization fraction (0–1)">
              <input type="number" min={0} max={1} step="0.05" value={project.settings.savingsRealizationFraction} onChange={(e) => patchSettings("savingsRealizationFraction", parseFloat(e.target.value) || 0)} className={inputClass} />
            </Field>
          </div>
          <p className="field-help">
            Annual hours: {formatNumber(summary.annualHours, 0)}. Calculation version: {CALCULATION_VERSION}.
            CFM is treated as SCFM. This tool does not convert dB to flow — enter the flow the instrument or technician provided.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={handleLoadDemo} className="btn btn-secondary btn-sm">Load 21-leak demo project</button>
            <button onClick={handleExportJson} className="btn btn-secondary btn-sm">JSON backup</button>
            <button onClick={() => importRef.current?.click()} className="btn btn-secondary btn-sm">Import JSON</button>
            <button onClick={handleDeleteProject} className="btn btn-danger btn-sm">Delete project</button>
            <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={(e) => handleImportFile(e.target.files?.[0] ?? null)} />
          </div>
        </SectionCard>
      )}

      {view === "capture" && (
        <SectionCard
          title={editingId ? `Edit ${form.tag}` : "Field Leak Capture"}
          description="Enter the handover fields while you are at the leak. Source reading is stored as-is; it is never converted from dB to CFM."
          actions={
            editingId ? (
              <button onClick={() => resetForm()} className="btn btn-ghost btn-sm">Cancel edit</button>
            ) : null
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tag">
              <input value={form.tag} onChange={(e) => patchForm({ tag: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Area">
              <input value={form.area} onChange={(e) => patchForm({ area: e.target.value })} className={inputClass} placeholder="Packaging" />
            </Field>
            <Field label="Exact location">
              <input value={form.exactLocation} onChange={(e) => patchForm({ exactLocation: e.target.value })} className={inputClass} placeholder="Line 3, west header union" />
            </Field>
            <Field label="Asset / equipment">
              <input value={form.asset} onChange={(e) => patchForm({ asset: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Component">
              <select value={form.component} onChange={(e) => patchForm({ component: e.target.value as ComponentType })} className="field-select">
                {COMPONENT_TYPES.map((v) => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Suggested action">
              <select value={form.suggestedAction} onChange={(e) => patchForm({ suggestedAction: e.target.value as SuggestedAction })} className="field-select">
                {SUGGESTED_ACTIONS.map((v) => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Problem description">
                <textarea value={form.problemDescription} onChange={(e) => patchForm({ problemDescription: e.target.value })} className="field-textarea" rows={2} />
              </Field>
            </div>
            <Field label="Pressure">
              <div className="flex gap-2">
                <input type="number" min={0} step="any" value={form.pressure} onChange={(e) => patchForm({ pressure: parseFloat(e.target.value) || 0 })} className={"flex-1 " + inputClass} />
                <select value={form.pressureUnit} onChange={(e) => patchForm({ pressureUnit: e.target.value as PressureUnit })} className="field-select w-24">
                  {PRESSURE_UNITS.map((v) => <option key={v}>{v}</option>)}
                </select>
              </div>
            </Field>
            <Field label="Baseline flow">
              <div className="flex gap-2">
                <input type="number" min={0} step="any" value={form.baselineFlow} onChange={(e) => patchForm({ baselineFlow: parseFloat(e.target.value) || 0 })} className={"flex-1 " + inputClass} />
                <select value={form.flowUnit} onChange={(e) => patchForm({ flowUnit: e.target.value as FlowUnit })} className="field-select w-28">
                  {FLOW_UNITS.map((v) => <option key={v}>{v}</option>)}
                </select>
              </div>
            </Field>
            <Field label="Quantification method">
              <select value={form.quantificationMethod} onChange={(e) => patchForm({ quantificationMethod: e.target.value as QuantificationMethod })} className="field-select">
                {QUANTIFICATION_METHODS.map((v) => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Source reading">
              <input value={form.sourceReading} onChange={(e) => patchForm({ sourceReading: e.target.value })} className={inputClass} placeholder="As shown on the instrument" />
            </Field>
            <Field label="Confidence">
              <select value={form.confidence} onChange={(e) => patchForm({ confidence: e.target.value as Confidence })} className="field-select">
                {CONFIDENCE_LEVELS.map((v) => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Repair access">
              <select value={form.repairAccess} onChange={(e) => patchForm({ repairAccess: e.target.value as RepairAccess })} className="field-select">
                {REPAIR_ACCESS_LEVELS.map((v) => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Operational impact">
              <select value={form.operationalImpact} onChange={(e) => patchForm({ operationalImpact: e.target.value as OperationalImpact })} className="field-select">
                {OPERATIONAL_IMPACTS.map((v) => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Urgency">
              <select value={form.urgency} onChange={(e) => patchForm({ urgency: e.target.value as Urgency })} className="field-select">
                {URGENCY_LEVELS.map((v) => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Estimated repair cost ($)">
              <input type="number" min={0} step="1" value={form.estimatedRepairCost ?? ""} onChange={(e) => patchForm({ estimatedRepairCost: e.target.value === "" ? null : Math.max(0, parseFloat(e.target.value) || 0) })} className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Photo">
                <input ref={photoRef} type="file" accept="image/*" capture="environment" onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)} className="text-sm" />
                {form.photoDataUrl && <img src={form.photoDataUrl} alt="Leak photo" className="mt-2 max-h-40 rounded-lg border border-border" />}
              </Field>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={handleSaveLeak} className="btn btn-primary">{editingId ? "Save changes" : "Add to register"}</button>
            {!editingId && <button onClick={() => resetForm()} className="btn btn-secondary">Clear form</button>}
          </div>
        </SectionCard>
      )}

      {view === "register" && (
        <SectionCard title="Leak Register" description="Search, sort, filter, and edit records. Status only changes through Repair Queue close-out.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 print:hidden mb-4">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tag, area, location, asset…" className={inputClass} />
            <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="field-select">
              <option value="">All areas</option>
              {areas.map((a) => <option key={a}>{a}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as LeakStatus | "")} className="field-select">
              <option value="">All statuses</option>
              {LEAK_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={accessFilter} onChange={(e) => setAccessFilter(e.target.value as RepairAccess | "")} className="field-select">
              <option value="">All access</option>
              {REPAIR_ACCESS_LEVELS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <div className="flex gap-2">
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as RegisterSortKey)} className="field-select">
                <option value="tag">Sort: Tag</option>
                <option value="area">Sort: Area</option>
                <option value="status">Sort: Status</option>
                <option value="flow">Sort: Flow</option>
                <option value="access">Sort: Access</option>
              </select>
              <button onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))} className="btn btn-secondary btn-sm">{sortDir === "asc" ? "Asc" : "Desc"}</button>
            </div>
          </div>

          {registerRows.length === 0 ? (
            <EmptyState
              title="No leaks in this view."
              hint="Capture a leak or load the demo project."
              action={<button onClick={() => setView("capture")} className="btn btn-primary btn-sm">Capture leak</button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted border-b border-border">
                    <th className="py-2 pr-3">Tag</th>
                    <th className="py-2 pr-3">Area</th>
                    <th className="py-2 pr-3">Location</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">SCFM</th>
                    <th className="py-2 pr-3">Estimated Opportunity</th>
                    <th className="py-2 pr-3">Verified Result</th>
                    <th className="py-2 pr-3 print:hidden"></th>
                  </tr>
                </thead>
                <tbody>
                  {registerRows.map((entry) => {
                    const computed = report.leaks.find((l) => l.entry.id === entry.id);
                    return (
                      <tr key={entry.id} className="border-b border-border/70">
                        <td className="py-2 pr-3 font-medium">{entry.tag}</td>
                        <td className="py-2 pr-3">{entry.area || "—"}</td>
                        <td className="py-2 pr-3">{entry.exactLocation || "—"}</td>
                        <td className="py-2 pr-3"><StatusBadge status={entry.status} /></td>
                        <td className="py-2 pr-3">{formatNumber(computed?.baselineSCFM ?? 0)}</td>
                        <td className="py-2 pr-3">{formatCurrency(computed?.estimated.opportunity ?? 0)}</td>
                        <td className="py-2 pr-3">{computed?.verified ? formatCurrency(computed.verified.annualCostAvoided) : "—"}</td>
                        <td className="py-2 pr-3 print:hidden whitespace-nowrap">
                          <button onClick={() => handleEdit(entry)} className="btn btn-ghost btn-sm">Edit</button>
                          <button onClick={() => { setSelectedId(entry.id); setView("queue"); }} className="btn btn-ghost btn-sm">Close-out</button>
                          <button onClick={() => handleDelete(entry.id)} className="btn btn-danger btn-sm">Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {view === "queue" && (
        <div className="space-y-6">
          <div className="result-card">
            <h2 className="result-label">Estimated Opportunity</h2>
            <div className="flex items-baseline gap-2">
              <span className="result-number">{formatCurrency(summary.estimatedOpportunityTotal)}</span>
              <span className="text-sm text-muted">/ year · baseline, not verified</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
              <span>Verified Result: <span className="font-medium text-foreground">{formatCurrency(summary.verifiedResultTotal)}</span></span>
              <span>Remaining open: <span className="font-medium text-foreground">{formatCurrency(summary.remainingOpenOpportunity)}</span></span>
              <span>{summary.openCount} Open · {summary.plannedCount} Planned · {summary.awaitingRetestCount} Awaiting Re-test · {summary.verifiedClosedCount} Verified Closed · {summary.failedRetestCount} Failed Re-test</span>
            </div>
          </div>

          <SectionCard title="Repair Queue" description="Order: Urgency → Operational Impact → Repair Access → Annual Cost Opportunity → Payback. Each row states why it sits here.">
            {report.queue.length === 0 ? (
              <EmptyState title="Repair queue is empty." hint="Open, Planned, and Failed Re-test leaks appear here." />
            ) : (
              <ol className="divide-y divide-border rounded-xl border border-border bg-background">
                {report.queue.map((item) => {
                  const e = item.computed.entry;
                  return (
                    <li key={e.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-semibold text-muted">{item.rank}.</span>
                          <span className="text-sm font-medium">{e.tag}</span>
                          <span className="text-sm text-muted truncate">{e.area} · {e.exactLocation || "No exact location"}</span>
                          <StatusBadge status={e.status} />
                        </div>
                        <button onClick={() => setSelectedId(e.id)} className="btn btn-secondary btn-sm print:hidden">Select</button>
                      </div>
                      <p className="mt-1 pl-5 text-xs text-muted">{item.whyAhead}</p>
                      <div className="mt-1 pl-5 flex flex-wrap gap-x-4 text-xs text-muted">
                        <span>Impact: {e.operationalImpact}</span>
                        <span>Access: {e.repairAccess}</span>
                        <span>Estimated Opportunity: {formatCurrency(item.computed.estimated.opportunity)}</span>
                        <span>Payback: {item.computed.paybackMonths === null ? "—" : `${item.computed.paybackMonths.toFixed(1)} mo`}</span>
                        {item.computed.stillLeaking && (
                          <span>
                            Still leaking — remaining {formatNumber(item.computed.stillLeaking.remainingSCFM)} SCFM · remaining opportunity {formatCurrency(item.computed.stillLeaking.remainingOpportunity)}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </SectionCard>

          <SectionCard title="Repair / Re-test" description="Verified Closed requires a completed re-test. Failed re-test returns the leak to this queue.">
            {!selected ? (
              <p className="text-sm text-muted">Select a leak from the queue or register.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{selected.tag}</span>
                  <StatusBadge status={selected.status} />
                  <span className="text-sm text-muted">{selected.exactLocation}</span>
                </div>
                {selectedComputed && (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="result-tile">
                        <div className="result-tile-label">Estimated Opportunity</div>
                        <div className="result-tile-value">{formatCurrency(selectedComputed.estimated.opportunity)}</div>
                      </div>
                      <div className="result-tile">
                        <div className="result-tile-label">
                          {selectedComputed.verified
                            ? "Verified Result"
                            : selectedComputed.stillLeaking
                              ? "Remaining estimated opportunity"
                              : "Verified Result"}
                        </div>
                        <div className="result-tile-value">
                          {selectedComputed.verified
                            ? formatCurrency(selectedComputed.verified.annualCostAvoided)
                            : selectedComputed.stillLeaking
                              ? formatCurrency(selectedComputed.stillLeaking.remainingOpportunity)
                              : "Not re-tested"}
                        </div>
                      </div>
                    </div>
                    {selectedComputed.stillLeaking && (
                      <p className="text-xs text-muted">
                        Re-tested / Reduced but Still Leaking — baseline {formatNumber(selectedComputed.stillLeaking.baselineSCFM)} SCFM · post-repair {formatNumber(selectedComputed.stillLeaking.postRepairSCFM)} SCFM · measured reduction {formatNumber(selectedComputed.stillLeaking.measuredReductionSCFM)} SCFM · remaining {formatNumber(selectedComputed.stillLeaking.remainingSCFM)} SCFM. This is not a Verified Result and is not Verified Closed.
                      </p>
                    )}
                  </div>
                )}

                {selected.status === "Open" || selected.status === "Failed Re-test" ? (
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => runWorkflow(() => updateLeak(selected.id, applyPlan(selected)))} className="btn btn-primary">Move to Planned</button>
                    {selected.status === "Failed Re-test" && (
                      <button onClick={() => runWorkflow(() => updateLeak(selected.id, returnFailedToQueue(selected)))} className="btn btn-secondary">Return to Open</button>
                    )}
                  </div>
                ) : null}

                {selected.status === "Planned" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Repaired by">
                      <input value={repairBy} onChange={(e) => setRepairBy(e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Repair date">
                      <input type="date" value={repairDate} onChange={(e) => setRepairDate(e.target.value)} className={inputClass} />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Action taken">
                        <input value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} className={inputClass} />
                      </Field>
                    </div>
                    <Field label="Actual repair cost ($)">
                      <input type="number" min={0} value={actualCost} onChange={(e) => setActualCost(e.target.value)} className={inputClass} />
                    </Field>
                    <div className="flex items-end">
                      <button
                        onClick={() =>
                          runWorkflow(() =>
                            updateLeak(
                              selected.id,
                              applyRepairCompleted(selected, {
                                repairedBy: repairBy,
                                repairDate,
                                actionTaken,
                                actualRepairCost: actualCost === "" ? null : Math.max(0, parseFloat(actualCost) || 0),
                              }),
                            ),
                          )
                        }
                        className="btn btn-primary"
                      >
                        Mark repair completed
                      </button>
                    </div>
                  </div>
                )}

                {selected.status === "Awaiting Re-test" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Re-test date">
                      <input type="date" value={retestDate} onChange={(e) => setRetestDate(e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Tested by">
                      <input value={testedBy} onChange={(e) => setTestedBy(e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Method">
                      <select value={retestMethod} onChange={(e) => setRetestMethod(e.target.value as QuantificationMethod)} className="field-select">
                        {QUANTIFICATION_METHODS.map((v) => <option key={v}>{v}</option>)}
                      </select>
                    </Field>
                    <Field label={`Post-repair flow (${selected.flowUnit})`}>
                      <input type="number" min={0} step="any" value={postFlow} onChange={(e) => setPostFlow(e.target.value)} className={inputClass} />
                    </Field>
                    <div className="sm:col-span-2 flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          runWorkflow(() =>
                            updateLeak(
                              selected.id,
                              applyRetest(selected, {
                                retestDate,
                                testedBy,
                                method: retestMethod,
                                postRepairFlow: parseFloat(postFlow) || 0,
                                flowUnit: selected.flowUnit,
                                result: "Pass",
                              }),
                            ),
                          )
                        }
                        className="btn btn-primary"
                      >
                        Pass — Verified Closed
                      </button>
                      <button
                        onClick={() =>
                          runWorkflow(() =>
                            updateLeak(
                              selected.id,
                              applyRetest(selected, {
                                retestDate,
                                testedBy,
                                method: retestMethod,
                                postRepairFlow: parseFloat(postFlow) || 0,
                                flowUnit: selected.flowUnit,
                                result: "Fail",
                              }),
                            ),
                          )
                        }
                        className="btn btn-secondary"
                      >
                        Fail — return path
                      </button>
                    </div>
                  </div>
                )}

                {selected.status === "Verified Closed" && (
                  <p className="text-sm text-muted">Verified Closed: re-test recorded post-repair flow of 0. Verified Result is shown above and is not mixed into Estimated Opportunity.</p>
                )}
                {selected.status === "Failed Re-test" && (
                  <p className="text-sm text-muted">Failed Re-test: still leaking and still in the repair queue. Re-test measurements above are not a Verified Result.</p>
                )}

                {selected.repair && (
                  <p className="text-xs text-muted">Repair: {selected.repair.repairDate} · {selected.repair.repairedBy} · {selected.repair.actionTaken} · {selected.repair.actualRepairCost == null ? "cost not entered" : formatCurrency(selected.repair.actualRepairCost)}</p>
                )}
                {selected.retest && (
                  <p className="text-xs text-muted">Re-test: {selected.retest.retestDate} · {selected.retest.testedBy} · {selected.retest.method} · {selected.retest.postRepairFlow} {selected.retest.flowUnit} · {selected.retest.result}</p>
                )}
                {workflowError && <p className="text-sm text-red-700">{workflowError}</p>}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {view === "reports" && (
        <SectionCard title="Reports / Export" description="Estimate and Verified stay labeled separately in every output.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
            <div className="result-tile">
              <div className="result-tile-label">Estimated Opportunity</div>
              <div className="result-tile-value">{formatCurrency(summary.estimatedOpportunityTotal)}</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Verified Result</div>
              <div className="result-tile-value">{formatCurrency(summary.verifiedResultTotal)}</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Total leaks</div>
              <div className="result-tile-value">{summary.totalLeaks}</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Baseline SCFM</div>
              <div className="result-tile-value">{formatNumber(summary.totalBaselineSCFM)}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              onClick={() => {
                const text = buildRepairWorkPack(project, report);
                downloadText(`${fileBase}-work-pack.txt`, text, "text/plain");
                navigator.clipboard?.writeText(text).then(() => setCopied("work")).catch(() => undefined);
              }}
              className="btn btn-primary"
            >
              {copied === "work" ? "Work pack copied" : "Repair Work Pack"}
            </button>
            <button
              onClick={() => {
                const text = buildManagementReport(project, report);
                downloadText(`${fileBase}-management-report.txt`, text, "text/plain");
                window.print();
              }}
              className="btn btn-secondary"
            >
              Management / Client Report
            </button>
            <button onClick={() => downloadText(`${fileBase}-register.csv`, exportRegisterCsv(report), "text/csv")} className="btn btn-secondary">
              CSV Register
            </button>
            <button onClick={handleExportJson} className="btn btn-secondary">JSON Backup</button>
          </div>
          <pre className="mt-4 max-h-[28rem] overflow-auto rounded-xl border border-border bg-surface p-4 text-xs whitespace-pre-wrap">
            {buildManagementReport(project, report)}
          </pre>
        </SectionCard>
      )}

      <div className="hidden print:block text-sm whitespace-pre-wrap">{buildManagementReport(project, report)}</div>

      <div className="print:hidden">
        <h2 className="text-lg font-semibold text-foreground mb-3">How It Works</h2>
        <ol className="space-y-2 text-sm text-muted">
          <li>1. Set up the survey project. It saves automatically in this browser.</li>
          <li>2. Capture each leak with the handover fields, then review the register.</li>
          <li>3. Use Estimated Opportunity for planning. Verified Result appears only for Verified Closed leaks (post-repair flow of 0).</li>
          <li>4. Work the repair queue in the stated order, complete the repair, then re-test.</li>
          <li>5. Export the work pack, management report, CSV register, or JSON backup.</li>
        </ol>
      </div>

      <div className="text-xs text-muted border-t border-border pt-4">
        Estimated Opportunity and Verified Result are different figures. This tool does not convert ultrasonic dB to CFM.
        Data stays in this browser unless you export it. Calculation version {CALCULATION_VERSION}.
      </div>
    </div>
  );
}

function slugName(project: SurveyProject): string {
  const base = project.settings.projectName.trim() || "air-leak-survey";
  return base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "air-leak-survey";
}
