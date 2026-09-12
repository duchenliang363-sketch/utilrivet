"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SectionCard from "@/components/SectionCard";
import EmptyState from "@/components/EmptyState";
import {
  CALCULATION_VERSION,
  DEFAULT_SETTINGS,
  DIAGNOSES,
  LOSS_CALCULATION_METHOD,
  LOSS_INPUT_KINDS,
  LOSS_UNITS,
  PRESSURE_UNITS,
  RECOMMENDED_ACTIONS,
  TEST_METHODS,
  TRAP_STATUSES,
  TRAP_TYPES,
  applyFinding,
  applyPlan,
  applyRepairCompleted,
  applyRetest,
  browserStore,
  buildDemoProject,
  buildFindingsReport,
  buildManagementReport,
  buildRepairWorkPack,
  buildSurveyReport,
  createSurveyStore,
  emptyTrap,
  exportProjectJson,
  exportRegisterCsv,
  filterRegister,
  importProjectJson,
  nextTag,
  returnFailedToQueue,
  uniqueAreas,
  validateSurvey,
  type LossInputKind,
  type LossUnit,
  type PressureUnit,
  type RecommendedAction,
  type RegisterSortKey,
  type SurveyProject,
  type SurveySettings,
  type TestMethod,
  type TrapDiagnosis,
  type TrapEntry,
  type TrapStatus,
  type TrapType,
} from "@/lib/steam-trap-survey/engine";

type View = "project" | "survey" | "register" | "queue" | "reports";

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

function StatusBadge({ status }: { status: TrapStatus }) {
  const styles: Record<TrapStatus, string> = {
    Good: "bg-green-50 text-green-700 border-green-200",
    "Open Finding": "bg-gray-50 text-gray-700 border-gray-200",
    Planned: "bg-blue-50 text-blue-700 border-blue-200",
    "Awaiting Re-test": "bg-amber-50 text-amber-800 border-amber-200",
    "Verified Closed": "bg-green-50 text-green-800 border-green-200",
    "Failed Re-test": "bg-red-50 text-red-700 border-red-200",
    "Not Testable": "bg-slate-50 text-slate-600 border-slate-200",
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

export default function SteamTrapSurveyReportBuilder() {
  const storeRef = useRef<ReturnType<typeof createSurveyStore> | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [project, setProject] = useState<SurveyProject | null>(null);
  const [projects, setProjects] = useState<SurveyProject[]>([]);
  const [view, setView] = useState<View>("project");
  const [form, setForm] = useState<TrapEntry>(emptyTrap("new", "T-001"));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<TrapStatus | "">("");
  const [sortKey, setSortKey] = useState<RegisterSortKey>("tag");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [repairBy, setRepairBy] = useState("");
  const [repairDate, setRepairDate] = useState("");
  const [actionKind, setActionKind] = useState<RecommendedAction>("Repair");
  const [actionTaken, setActionTaken] = useState("");
  const [actualCost, setActualCost] = useState("");
  const [retestDate, setRetestDate] = useState("");
  const [testedBy, setTestedBy] = useState("");
  const [retestMethod, setRetestMethod] = useState<TestMethod>("Ultrasound");
  const [remainingLoss, setRemainingLoss] = useState("");
  const [retestNotes, setRetestNotes] = useState("");
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
    setForm(emptyTrap("new", nextTag(active.nextTagNumber)));
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
    () => (project ? buildSurveyReport(project.settings, project.traps) : null),
    [project],
  );
  const errors = project ? validateSurvey(project.settings, project.traps) : [];
  const areas = project ? uniqueAreas(project.traps) : [];
  const registerRows = project
    ? filterRegister(project.traps, {
        query,
        area: areaFilter,
        status: statusFilter,
        sortKey,
        sortDir,
      })
    : [];
  const selected = project?.traps.find((t) => t.id === selectedId) ?? null;
  const selectedComputed = report?.traps.find((t) => t.entry.id === selectedId) ?? null;

  const patchSettings = <K extends keyof SurveySettings>(key: K, value: SurveySettings[K]) => {
    commit((p) => ({ ...p, settings: { ...p.settings, [key]: value } }));
  };

  const patchForm = (patch: Partial<TrapEntry>) => setForm((prev) => ({ ...prev, ...patch }));

  const resetForm = (nextNumber?: number) => {
    const n = nextNumber ?? project?.nextTagNumber ?? 1;
    setEditingId(null);
    setForm(emptyTrap("new", nextTag(n)));
  };

  const handleSaveTrap = () => {
    if (!project) return;
    if (editingId) {
      commit((p) => ({
        ...p,
        traps: p.traps.map((t) =>
          t.id === editingId
            ? {
                ...form,
                id: editingId,
                tag: form.tag.trim() || t.tag,
                status: t.status,
                repair: t.repair,
                retest: t.retest,
                history: t.history,
              }
            : t,
        ),
      }));
      setView("register");
      resetForm(project.nextTagNumber);
      return;
    }
    const recorded = applyFinding({ ...form, tag: form.tag.trim() || nextTag(project.nextTagNumber) });
    const id = `trap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    commit((p) => ({
      ...p,
      traps: [...p.traps, { ...recorded, id }],
      nextTagNumber: p.nextTagNumber + 1,
    }));
    resetForm((project.nextTagNumber ?? 1) + 1);
  };

  const handleEdit = (entry: TrapEntry) => {
    setEditingId(entry.id);
    setForm({ ...entry });
    setSelectedId(entry.id);
    setView("survey");
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this trap from the register?")) return;
    commit((p) => ({ ...p, traps: p.traps.filter((t) => t.id !== id) }));
    if (selectedId === id) setSelectedId(null);
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

  const updateTrap = (id: string, next: TrapEntry) => {
    commit((p) => ({ ...p, traps: p.traps.map((t) => (t.id === id ? next : t)) }));
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
          <div className="text-sm font-semibold text-foreground">{project.settings.projectName.trim() || "Untitled steam trap survey"}</div>
          <div className="text-xs text-muted">Last saved: {formatSavedAt(project.lastSavedAt)}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={project.id} onChange={(e) => handleSwitch(e.target.value)} className="field-select min-w-[12rem]">
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
            ["survey", "Survey"],
            ["register", "Register"],
            ["queue", "Repair Queue"],
            ["reports", "Reports"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} onClick={() => setView(id)} className={`btn btn-sm ${view === id ? "btn-primary" : "btn-secondary"}`}>
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
        <SectionCard title="Project Setup" description="Browser-local project. Refresh keeps the data. You diagnose the trap; this tool keeps evidence and closure.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Project name">
              <input value={project.settings.projectName} onChange={(e) => patchSettings("projectName", e.target.value)} className={inputClass} placeholder="Demo Food Plant Steam Trap Survey" />
            </Field>
            <Field label="Client / facility">
              <input value={project.settings.facility} onChange={(e) => patchSettings("facility", e.target.value)} className={inputClass} placeholder="Demo Food Plant" />
            </Field>
            <Field label="Site">
              <input value={project.settings.site} onChange={(e) => patchSettings("site", e.target.value)} className={inputClass} placeholder="Boiler House" />
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
            <Field label="Steam cost ($ / 1,000 lb)">
              <input type="number" min={0} step="0.1" value={project.settings.steamCostPer1000Lb} onChange={(e) => patchSettings("steamCostPer1000Lb", parseFloat(e.target.value) || 0)} className={inputClass} />
            </Field>
          </div>
          <p className="field-help">
            Annual hours: {formatNumber(summary.annualHours, 0)}. {LOSS_CALCULATION_METHOD} Version {CALCULATION_VERSION}.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={handleLoadDemo} className="btn btn-secondary btn-sm">Load 10-trap demo (Food Plant)</button>
            <button onClick={handleExportJson} className="btn btn-secondary btn-sm">JSON backup</button>
            <button onClick={() => importRef.current?.click()} className="btn btn-secondary btn-sm">Import JSON</button>
            <button onClick={handleDeleteProject} className="btn btn-danger btn-sm">Delete project</button>
            <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={(e) => handleImportFile(e.target.files?.[0] ?? null)} />
          </div>
        </SectionCard>
      )}

      {view === "survey" && (
        <SectionCard
          title={editingId ? `Edit ${form.tag}` : "Trap Survey / Finding"}
          description="Enter identity, test evidence, and your diagnosis. The tool does not decide Good or Failed from temperature or ultrasound."
          actions={editingId ? <button onClick={() => resetForm()} className="btn btn-ghost btn-sm">Cancel edit</button> : null}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tag / Trap ID">
              <input value={form.tag} onChange={(e) => patchForm({ tag: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Area">
              <input value={form.area} onChange={(e) => patchForm({ area: e.target.value })} className={inputClass} placeholder="Boiler House" />
            </Field>
            <Field label="Location">
              <input value={form.location} onChange={(e) => patchForm({ location: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Application">
              <input value={form.application} onChange={(e) => patchForm({ application: e.target.value })} className={inputClass} placeholder="Drip leg" />
            </Field>
            <Field label="Manufacturer (optional)">
              <input value={form.manufacturer} onChange={(e) => patchForm({ manufacturer: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Model (optional)">
              <input value={form.model} onChange={(e) => patchForm({ model: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Trap type">
              <select value={form.trapType} onChange={(e) => patchForm({ trapType: e.target.value as TrapType })} className="field-select">
                {TRAP_TYPES.map((v) => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Size (optional)">
              <input value={form.size} onChange={(e) => patchForm({ size: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Operating pressure">
              <div className="flex gap-2">
                <input type="number" min={0} step="any" value={form.operatingPressure} onChange={(e) => patchForm({ operatingPressure: parseFloat(e.target.value) || 0 })} className={"flex-1 " + inputClass} />
                <select value={form.pressureUnit} onChange={(e) => patchForm({ pressureUnit: e.target.value as PressureUnit })} className="field-select w-24">
                  {PRESSURE_UNITS.map((v) => <option key={v}>{v}</option>)}
                </select>
              </div>
            </Field>
            <Field label="Survey date">
              <input type="date" value={form.surveyDate} onChange={(e) => patchForm({ surveyDate: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Surveyor">
              <input value={form.surveyor} onChange={(e) => patchForm({ surveyor: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Test method">
              <select value={form.testMethod} onChange={(e) => patchForm({ testMethod: e.target.value as TestMethod })} className="field-select">
                {TEST_METHODS.map((v) => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Temperature (optional)">
              <input value={form.temperature} onChange={(e) => patchForm({ temperature: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Ultrasound / instrument reading (optional)">
              <input value={form.instrumentReading} onChange={(e) => patchForm({ instrumentReading: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Diagnosis (human)">
              <select value={form.diagnosis} onChange={(e) => patchForm({ diagnosis: e.target.value as TrapDiagnosis })} className="field-select">
                {DIAGNOSES.map((v) => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Recommended action">
              <select value={form.recommendedAction} onChange={(e) => patchForm({ recommendedAction: e.target.value as RecommendedAction })} className="field-select">
                {RECOMMENDED_ACTIONS.map((v) => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Estimated steam loss">
              <div className="flex gap-2">
                <input type="number" min={0} step="any" value={form.steamLoss} onChange={(e) => patchForm({ steamLoss: parseFloat(e.target.value) || 0 })} className={"flex-1 " + inputClass} />
                <select value={form.lossUnit} onChange={(e) => patchForm({ lossUnit: e.target.value as LossUnit })} className="field-select w-24">
                  {LOSS_UNITS.map((v) => <option key={v}>{v}</option>)}
                </select>
              </div>
            </Field>
            <Field label="Loss input kind">
              <select value={form.lossInputKind} onChange={(e) => patchForm({ lossInputKind: e.target.value as LossInputKind })} className="field-select">
                {LOSS_INPUT_KINDS.map((v) => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Estimated repair / replace cost ($)">
              <input type="number" min={0} value={form.estimatedRepairCost ?? ""} onChange={(e) => patchForm({ estimatedRepairCost: e.target.value === "" ? null : Math.max(0, parseFloat(e.target.value) || 0) })} className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes / evidence">
                <textarea value={form.notes} onChange={(e) => patchForm({ notes: e.target.value })} className="field-textarea" rows={2} />
              </Field>
            </div>
          </div>
          <p className="field-help mt-3">Only Leaking and Failed Open count toward Estimated Opportunity. Failed Closed / Good / Not Testable do not invent a steam-loss formula.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={handleSaveTrap} className="btn btn-primary">{editingId ? "Save changes" : "Add to register"}</button>
            {!editingId && <button onClick={() => resetForm()} className="btn btn-secondary">Clear form</button>}
          </div>
        </SectionCard>
      )}

      {view === "register" && (
        <SectionCard title="Trap Register" description="Search and filter traps. Status only changes through Repair Queue close-out.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:hidden mb-4">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tag, area, location…" className={inputClass} />
            <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="field-select">
              <option value="">All areas</option>
              {areas.map((a) => <option key={a}>{a}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TrapStatus | "")} className="field-select">
              <option value="">All statuses</option>
              {TRAP_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <div className="flex gap-2">
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as RegisterSortKey)} className="field-select">
                <option value="tag">Sort: Tag</option>
                <option value="area">Sort: Area</option>
                <option value="status">Sort: Status</option>
                <option value="diagnosis">Sort: Diagnosis</option>
              </select>
              <button onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))} className="btn btn-secondary btn-sm">{sortDir === "asc" ? "Asc" : "Desc"}</button>
            </div>
          </div>
          {registerRows.length === 0 ? (
            <EmptyState
              title="No traps in this view."
              hint="Record a finding or load the demo project."
              action={<button onClick={() => setView("survey")} className="btn btn-primary btn-sm">Survey a trap</button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted border-b border-border">
                    <th className="py-2 pr-3">Tag</th>
                    <th className="py-2 pr-3">Location</th>
                    <th className="py-2 pr-3">Diagnosis</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Estimated Opportunity</th>
                    <th className="py-2 pr-3">Verified Result</th>
                    <th className="py-2 pr-3 print:hidden"></th>
                  </tr>
                </thead>
                <tbody>
                  {registerRows.map((entry) => {
                    const computed = report.traps.find((t) => t.entry.id === entry.id);
                    return (
                      <tr key={entry.id} className="border-b border-border/70">
                        <td className="py-2 pr-3 font-medium">{entry.tag}</td>
                        <td className="py-2 pr-3">{entry.location || "—"}</td>
                        <td className="py-2 pr-3">{entry.diagnosis}</td>
                        <td className="py-2 pr-3"><StatusBadge status={entry.status} /></td>
                        <td className="py-2 pr-3">{formatCurrency(computed?.estimated.annualCost ?? 0)}</td>
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
              <span>{summary.openFindingCount} Open Finding · {summary.plannedCount} Planned · {summary.awaitingRetestCount} Awaiting Re-test · {summary.verifiedClosedCount} Verified Closed · {summary.failedRetestCount} Failed Re-test</span>
            </div>
          </div>

          <SectionCard title="Repair Queue" description="Only traps that need action. Order: estimated annual loss, then tag.">
            {report.queue.length === 0 ? (
              <EmptyState title="Repair queue is empty." hint="Open Finding, Planned, and Failed Re-test traps appear here." />
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
                          <span className="text-sm text-muted truncate">{e.location || "No location"}</span>
                          <StatusBadge status={e.status} />
                        </div>
                        <button onClick={() => setSelectedId(e.id)} className="btn btn-secondary btn-sm print:hidden">Select</button>
                      </div>
                      <div className="mt-1 pl-5 flex flex-wrap gap-x-4 text-xs text-muted">
                        <span>Diagnosis: {e.diagnosis}</span>
                        <span>Action: {e.recommendedAction}</span>
                        <span>Estimated annual loss: {formatCurrency(item.computed.estimated.annualCost)}</span>
                        {item.computed.stillLosing && (
                          <span>Still losing — remaining opportunity {formatCurrency(item.computed.stillLosing.remainingOpportunity)}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </SectionCard>

          <SectionCard title="Repair / Replace / Re-test" description="Verified Closed requires a Pass re-test with remaining steam loss of 0. Failed Re-test is not a Verified Result.">
            {!selected ? (
              <p className="text-sm text-muted">Select a trap from the queue or register.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{selected.tag}</span>
                  <StatusBadge status={selected.status} />
                  <span className="text-sm text-muted">{selected.diagnosis} · {selected.location}</span>
                </div>
                {selectedComputed && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="result-tile">
                      <div className="result-tile-label">Estimated Opportunity</div>
                      <div className="result-tile-value">{formatCurrency(selectedComputed.estimated.annualCost)}</div>
                    </div>
                    <div className="result-tile">
                      <div className="result-tile-label">{selectedComputed.verified ? "Verified Result" : selectedComputed.stillLosing ? "Remaining estimated opportunity" : "Verified Result"}</div>
                      <div className="result-tile-value">
                        {selectedComputed.verified
                          ? formatCurrency(selectedComputed.verified.annualCostAvoided)
                          : selectedComputed.stillLosing
                            ? formatCurrency(selectedComputed.stillLosing.remainingOpportunity)
                            : "Not re-tested"}
                      </div>
                    </div>
                  </div>
                )}

                {selected.status === "Open Finding" || selected.status === "Failed Re-test" ? (
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => runWorkflow(() => updateTrap(selected.id, applyPlan(selected)))} className="btn btn-primary">Move to Planned</button>
                    {selected.status === "Failed Re-test" && (
                      <button onClick={() => runWorkflow(() => updateTrap(selected.id, returnFailedToQueue(selected)))} className="btn btn-secondary">Return to Open Finding</button>
                    )}
                  </div>
                ) : null}

                {selected.status === "Planned" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Performed by">
                      <input value={repairBy} onChange={(e) => setRepairBy(e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Action date">
                      <input type="date" value={repairDate} onChange={(e) => setRepairDate(e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Action">
                      <select value={actionKind} onChange={(e) => setActionKind(e.target.value as RecommendedAction)} className="field-select">
                        {RECOMMENDED_ACTIONS.map((v) => <option key={v}>{v}</option>)}
                      </select>
                    </Field>
                    <Field label="Actual cost ($)">
                      <input type="number" min={0} value={actualCost} onChange={(e) => setActualCost(e.target.value)} className={inputClass} />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Notes">
                        <input value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} className={inputClass} />
                      </Field>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() =>
                          runWorkflow(() =>
                            updateTrap(
                              selected.id,
                              applyRepairCompleted(selected, {
                                repairedBy: repairBy,
                                repairDate,
                                actionKind,
                                actionTaken,
                                actualRepairCost: actualCost === "" ? null : Math.max(0, parseFloat(actualCost) || 0),
                              }),
                            ),
                          )
                        }
                        className="btn btn-primary"
                      >
                        Record action — Awaiting Re-test
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
                      <select value={retestMethod} onChange={(e) => setRetestMethod(e.target.value as TestMethod)} className="field-select">
                        {TEST_METHODS.map((v) => <option key={v}>{v}</option>)}
                      </select>
                    </Field>
                    <Field label={`Remaining steam loss (${selected.lossUnit})`}>
                      <input type="number" min={0} step="any" value={remainingLoss} onChange={(e) => setRemainingLoss(e.target.value)} className={inputClass} />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Evidence / notes">
                        <input value={retestNotes} onChange={(e) => setRetestNotes(e.target.value)} className={inputClass} />
                      </Field>
                    </div>
                    <div className="sm:col-span-2 flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          runWorkflow(() =>
                            updateTrap(
                              selected.id,
                              applyRetest(selected, {
                                retestDate,
                                testedBy,
                                method: retestMethod,
                                remainingSteamLoss: parseFloat(remainingLoss) || 0,
                                lossUnit: selected.lossUnit,
                                result: "Pass",
                                notes: retestNotes,
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
                            updateTrap(
                              selected.id,
                              applyRetest(selected, {
                                retestDate,
                                testedBy,
                                method: retestMethod,
                                remainingSteamLoss: parseFloat(remainingLoss) || 0,
                                lossUnit: selected.lossUnit,
                                result: "Fail",
                                notes: retestNotes,
                              }),
                            ),
                          )
                        }
                        className="btn btn-secondary"
                      >
                        Fail — Failed Re-test
                      </button>
                    </div>
                  </div>
                )}

                {selected.status === "Verified Closed" && (
                  <p className="text-sm text-muted">Verified Closed after Pass with remaining steam loss 0. Repair is not treated as verified savings by itself.</p>
                )}
                {selected.status === "Failed Re-test" && (
                  <p className="text-sm text-muted">Failed Re-test is not Verified Closed. Return to Open Finding and work it again.</p>
                )}

                {selected.history.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">History</div>
                    <ul className="space-y-1 text-xs text-muted">
                      {selected.history.map((event, index) => (
                        <li key={`${event.at}-${index}`}>{event.kind}: {event.summary}{event.notes ? ` — ${event.notes}` : ""}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {workflowError && <p className="text-sm text-red-700">{workflowError}</p>}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {view === "reports" && (
        <SectionCard title="Reports / Export" description="Estimated Opportunity and Verified Result stay labeled separately.">
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
              <div className="result-tile-label">Traps surveyed</div>
              <div className="result-tile-value">{summary.totalTraps}</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Verified Closed</div>
              <div className="result-tile-value">{summary.verifiedClosedCount}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              onClick={() => {
                const text = buildFindingsReport(project, report);
                downloadText(`${fileBase}-findings.txt`, text, "text/plain");
                navigator.clipboard?.writeText(text).then(() => setCopied("findings")).catch(() => undefined);
              }}
              className="btn btn-secondary"
            >
              {copied === "findings" ? "Findings copied" : "Survey / Findings Report"}
            </button>
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
          <li>1. Set up the survey project. It saves in this browser.</li>
          <li>2. Survey each trap. You enter the diagnosis — the tool does not auto-call Good or Failed from a reading.</li>
          <li>3. Findings enter the repair queue. Record Repair or Replace, then re-test.</li>
          <li>4. Pass with remaining steam loss 0 becomes Verified Closed. Fail returns to the queue.</li>
          <li>5. Export findings, work pack, management report, CSV, or JSON backup.</li>
        </ol>
      </div>

      <div className="text-xs text-muted border-t border-border pt-4">
        Estimated Opportunity and Verified Result are different figures. Loss is a labeled estimate from the steam loss rate you entered.
        Data stays in this browser unless you export it. {CALCULATION_VERSION}.
      </div>
    </div>
  );
}

function slugName(project: SurveyProject): string {
  const base = project.settings.projectName.trim() || "steam-trap-survey";
  return base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "steam-trap-survey";
}
