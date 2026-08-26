"use client";

import { useMemo, useState } from "react";
import {
  buildSummaryText,
  chargeLabel,
  computeJob,
  currencySymbol,
  validateJob,
  CHARGE_TYPES,
  DOCUMENTATION_ITEMS,
  type ChargeRow,
  type ChargeType,
  type Currency,
  type DocumentationKey,
  type DocumentationMap,
  type DocumentationStatus,
  type JobInputs,
  type LaborRow,
  type MaterialRow,
} from "@/lib/billing-closeout/engine";
import SectionCard from "@/components/SectionCard";
import EmptyState from "@/components/EmptyState";

const inputClass = "field-input";
const labelClass = "field-label";

const CURRENCIES: Currency[] = ["USD", "CAD", "GBP", "EUR", "AUD"];

const DEFAULT_DOCS: DocumentationMap = {
  technicianNotes: "Complete",
  customerApproval: "Complete",
  customerSignature: "Complete",
  requiredPO: "Not Required",
  partsDocumented: "Complete",
  additionalWorkApproval: "Complete",
};

const DEFAULT_LABOR: LaborRow[] = [{ id: 1, role: "", hoursWorked: 0, hoursBilled: 0, billingRate: 0 }];

function formatMoney(n: number, sym: string, decimals = 0): string {
  if (!Number.isFinite(n)) return `${sym}0`;
  const sign = n < 0 ? "-" : "";
  return (
    sign +
    sym +
    Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  );
}

function formatQty(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

// ─── Main Component ────────────────────────────────────────

export default function ServiceJobBillingCloseoutChecker() {
  const [jobDescription, setJobDescription] = useState("");
  const [invoiceReference, setInvoiceReference] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [labor, setLabor] = useState<LaborRow[]>(DEFAULT_LABOR.map((r) => ({ ...r })));
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [charges, setCharges] = useState<ChargeRow[]>([]);
  const [documentation, setDocumentation] = useState<DocumentationMap>({ ...DEFAULT_DOCS });
  const [nextId, setNextId] = useState(2);
  const [copied, setCopied] = useState(false);

  const inputs: JobInputs = useMemo(
    () => ({ jobDescription, invoiceReference, currency, labor, materials, charges, documentation }),
    [jobDescription, invoiceReference, currency, labor, materials, charges, documentation]
  );
  const result = useMemo(() => computeJob(inputs), [inputs]);
  const errors = validateJob(inputs);
  const sym = currencySymbol(currency);

  const hasData =
    labor.some((r) => r.hoursWorked > 0 || r.hoursBilled > 0 || r.billingRate > 0) ||
    materials.some((r) => r.quantityUsed > 0 || r.quantityBilled > 0 || r.pricePerUnit > 0) ||
    charges.some((r) => r.expectedAmount > 0 || r.amountBilled > 0);

  // Labor rows
  const addLaborRow = () => {
    setLabor((prev) => [...prev, { id: nextId, role: "", hoursWorked: 0, hoursBilled: 0, billingRate: 0 }]);
    setNextId((n) => n + 1);
  };
  const updateLaborRow = (id: number, patch: Partial<LaborRow>) => {
    setLabor((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };
  const deleteLaborRow = (id: number) => {
    setLabor((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  // Material rows
  const addMaterialRow = () => {
    setMaterials((prev) => [...prev, { id: nextId, material: "", quantityUsed: 0, quantityBilled: 0, pricePerUnit: 0 }]);
    setNextId((n) => n + 1);
  };
  const updateMaterialRow = (id: number, patch: Partial<MaterialRow>) => {
    setMaterials((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };
  const deleteMaterialRow = (id: number) => {
    setMaterials((prev) => prev.filter((r) => r.id !== id));
  };

  // Charge rows
  const addChargeRow = () => {
    setCharges((prev) => [...prev, { id: nextId, chargeType: "Service / Diagnostic Fee", expectedAmount: 0, amountBilled: 0 }]);
    setNextId((n) => n + 1);
  };
  const updateChargeRow = (id: number, patch: Partial<ChargeRow>) => {
    setCharges((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };
  const deleteChargeRow = (id: number) => {
    setCharges((prev) => prev.filter((r) => r.id !== id));
  };

  const setDocStatus = (key: DocumentationKey, status: DocumentationStatus) => {
    setDocumentation((prev) => ({ ...prev, [key]: status }));
  };

  const handleExample = () => {
    setJobDescription("Commercial AC Repair");
    setInvoiceReference("");
    setCurrency("USD");
    setLabor([{ id: 1, role: "Service Technician", hoursWorked: 5, hoursBilled: 4, billingRate: 150 }]);
    setMaterials([{ id: 2, material: "Replacement Valve", quantityUsed: 3, quantityBilled: 2, pricePerUnit: 85 }]);
    setCharges([
      { id: 3, chargeType: "After-Hours / Emergency Surcharge", expectedAmount: 85, amountBilled: 0 },
      { id: 4, chargeType: "Service / Diagnostic Fee", expectedAmount: 95, amountBilled: 95 },
    ]);
    setDocumentation({ ...DEFAULT_DOCS });
    setNextId(5);
  };

  const handleClear = () => {
    if (!window.confirm("Clear all job data and start over?")) return;
    setJobDescription("");
    setInvoiceReference("");
    setCurrency("USD");
    setLabor(DEFAULT_LABOR.map((r) => ({ ...r })));
    setMaterials([]);
    setCharges([]);
    setDocumentation({ ...DEFAULT_DOCS });
    setNextId(2);
  };

  const handleCopy = async () => {
    const text = buildSummaryText(inputs, result);
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

  // Items with potential missing billing, for the review list
  const missingItems: { label: string; amount: number }[] = [];
  labor.forEach((r, i) => {
    if (result.labor[i]?.potentialUnbilled > 0) {
      missingItems.push({ label: `Labor — ${r.role.trim() || "Unnamed row"}`, amount: result.labor[i].potentialUnbilled });
    }
  });
  materials.forEach((r, i) => {
    if (result.materials[i]?.potentialUnbilled > 0) {
      missingItems.push({ label: `Material — ${r.material.trim() || "Unnamed row"}`, amount: result.materials[i].potentialUnbilled });
    }
  });
  charges.forEach((r, i) => {
    if (result.charges[i]?.potentialUnbilled > 0) {
      missingItems.push({ label: chargeLabel(r), amount: result.charges[i].potentialUnbilled });
    }
  });
  const overBilledRows =
    result.labor.filter((r) => r.overBilled).length +
    result.materials.filter((r) => r.overBilled).length +
    result.charges.filter((r) => r.overBilled).length;

  return (
    <div className="space-y-8">
      {/* Print-only report header */}
      <div className="hidden print:block">
        <div className="text-xs font-semibold tracking-widest text-muted uppercase">UtilRivet</div>
        <div className="text-xl font-bold text-foreground mt-1">Service Job Billing Closeout Review</div>
        <div className="text-sm text-muted mt-2">
          {jobDescription.trim() && <div>Job: {jobDescription.trim()}</div>}
          {invoiceReference.trim() && <div>Reference: {invoiceReference.trim()}</div>}
          <div>Currency: {currency}</div>
        </div>
      </div>

      {/* Section 1 — Job Details */}
      <SectionCard title="Job Details" className="print:hidden">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="job-description" className={labelClass}>Job Description</label>
            <input
              id="job-description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="e.g. Commercial AC Repair"
              className={inputClass}
            />
            <p className="field-help">Avoid entering confidential customer information.</p>
          </div>
          <div>
            <label htmlFor="currency" className={labelClass}>Currency</label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="field-select"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="invoice-ref" className={labelClass}>Invoice / Job Reference (Optional)</label>
            <input
              id="invoice-ref"
              value={invoiceReference}
              onChange={(e) => setInvoiceReference(e.target.value)}
              placeholder="e.g. INV-2024-018"
              className={inputClass}
            />
          </div>
        </div>
      </SectionCard>

      {/* Section 2 — Labor Check */}
      <SectionCard
        title="Labor Check"
        description="Compare hours actually worked with hours billed, at the billing rate."
        actions={
          <button onClick={addLaborRow} className="btn btn-primary btn-sm print:hidden">
            + Add Labor Row
          </button>
        }
      >
        <div className="space-y-3">
          {labor.map((r, i) => {
            const rowResult = result.labor[i];
            return (
              <div key={r.id} className="rounded-xl border border-border bg-background p-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 print:hidden">
                  <div>
                    <label htmlFor={`labor-role-${r.id}`} className={labelClass}>Role / Description</label>
                    <input
                      id={`labor-role-${r.id}`}
                      value={r.role}
                      onChange={(e) => updateLaborRow(r.id, { role: e.target.value })}
                      placeholder="Service Technician"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor={`labor-worked-${r.id}`} className={labelClass}>Hours Worked</label>
                    <input
                      id={`labor-worked-${r.id}`}
                      type="number"
                      min="0"
                      step="0.5"
                      value={r.hoursWorked === 0 ? "" : r.hoursWorked}
                      onChange={(e) => updateLaborRow(r.id, { hoursWorked: Math.max(0, parseFloat(e.target.value) || 0) })}
                      placeholder="0"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor={`labor-billed-${r.id}`} className={labelClass}>Hours Billed</label>
                    <input
                      id={`labor-billed-${r.id}`}
                      type="number"
                      min="0"
                      step="0.5"
                      value={r.hoursBilled === 0 ? "" : r.hoursBilled}
                      onChange={(e) => updateLaborRow(r.id, { hoursBilled: Math.max(0, parseFloat(e.target.value) || 0) })}
                      placeholder="0"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor={`labor-rate-${r.id}`} className={labelClass}>Billing Rate</label>
                    <input
                      id={`labor-rate-${r.id}`}
                      type="number"
                      min="0"
                      step="any"
                      value={r.billingRate === 0 ? "" : r.billingRate}
                      onChange={(e) => updateLaborRow(r.id, { billingRate: Math.max(0, parseFloat(e.target.value) || 0) })}
                      placeholder="0"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <div className="text-[11px] text-muted">Potential Missing</div>
                      <div className={`text-sm font-medium ${rowResult?.potentialUnbilled > 0 ? "text-red-700" : "text-foreground"}`}>
                        {formatMoney(rowResult?.potentialUnbilled ?? 0, sym)}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteLaborRow(r.id)}
                      disabled={labor.length <= 1}
                      aria-label={`Delete labor row ${r.role.trim() || "row"}`}
                      className="btn btn-danger btn-sm shrink-0 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {rowResult?.overBilled && (
                  <p className="mt-2 text-[13px] text-amber-700 print:hidden">
                    Billed hours exceed recorded worked hours — review if needed.
                  </p>
                )}
                {/* Print-only row */}
                <div className="hidden print:flex justify-between text-sm">
                  <span>{r.role.trim() || "Labor"}</span>
                  <span className="text-muted">
                    Worked {formatQty(r.hoursWorked)} h · Billed {formatQty(r.hoursBilled)} h · Missing {formatMoney(rowResult?.potentialUnbilled ?? 0, sym)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Section 3 — Materials Check */}
      <SectionCard
        title="Materials Check"
        description="Compare quantities actually used on the job with quantities billed, at the billing price per unit."
        actions={
          <button onClick={addMaterialRow} className="btn btn-primary btn-sm print:hidden">
            + Add Material Row
          </button>
        }
      >
        {materials.length === 0 ? (
          <p className="text-[13px] text-muted print:hidden">No material rows added.</p>
        ) : (
          <div className="space-y-3">
            {materials.map((r, i) => {
              const rowResult = result.materials[i];
              return (
                <div key={r.id} className="rounded-xl border border-border bg-background p-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 print:hidden">
                    <div>
                      <label htmlFor={`mat-name-${r.id}`} className={labelClass}>Material / Part</label>
                      <input
                        id={`mat-name-${r.id}`}
                        value={r.material}
                        onChange={(e) => updateMaterialRow(r.id, { material: e.target.value })}
                        placeholder="Replacement Valve"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor={`mat-used-${r.id}`} className={labelClass}>Quantity Used</label>
                      <input
                        id={`mat-used-${r.id}`}
                        type="number"
                        min="0"
                        step="any"
                        value={r.quantityUsed === 0 ? "" : r.quantityUsed}
                        onChange={(e) => updateMaterialRow(r.id, { quantityUsed: Math.max(0, parseFloat(e.target.value) || 0) })}
                        placeholder="0"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor={`mat-billed-${r.id}`} className={labelClass}>Quantity Billed</label>
                      <input
                        id={`mat-billed-${r.id}`}
                        type="number"
                        min="0"
                        step="any"
                        value={r.quantityBilled === 0 ? "" : r.quantityBilled}
                        onChange={(e) => updateMaterialRow(r.id, { quantityBilled: Math.max(0, parseFloat(e.target.value) || 0) })}
                        placeholder="0"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor={`mat-price-${r.id}`} className={labelClass}>Billing Price / Unit</label>
                      <input
                        id={`mat-price-${r.id}`}
                        type="number"
                        min="0"
                        step="any"
                        value={r.pricePerUnit === 0 ? "" : r.pricePerUnit}
                        onChange={(e) => updateMaterialRow(r.id, { pricePerUnit: Math.max(0, parseFloat(e.target.value) || 0) })}
                        placeholder="0"
                        className={inputClass}
                      />
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <div className="text-[11px] text-muted">Potential Missing</div>
                        <div className={`text-sm font-medium ${rowResult?.potentialUnbilled > 0 ? "text-red-700" : "text-foreground"}`}>
                          {formatMoney(rowResult?.potentialUnbilled ?? 0, sym)}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteMaterialRow(r.id)}
                        aria-label={`Delete material row ${r.material.trim() || "row"}`}
                        className="btn btn-danger btn-sm shrink-0"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {rowResult?.overBilled && (
                    <p className="mt-2 text-[13px] text-amber-700 print:hidden">
                      Billed quantity exceeds recorded usage — review if needed.
                    </p>
                  )}
                  {/* Print-only row */}
                  <div className="hidden print:flex justify-between text-sm">
                    <span>{r.material.trim() || "Material"}</span>
                    <span className="text-muted">
                      Used {formatQty(r.quantityUsed)} · Billed {formatQty(r.quantityBilled)} · Missing {formatMoney(rowResult?.potentialUnbilled ?? 0, sym)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Section 4 — Additional Charges (+ Documentation Check) */}
      <SectionCard
        title="Additional Charges"
        description="Common service charges that apply to the job: enter what was expected to apply and what actually made it into billing."
        actions={
          <button onClick={addChargeRow} className="btn btn-primary btn-sm print:hidden">
            + Add Charge
          </button>
        }
      >
        {charges.length === 0 ? (
          <p className="text-[13px] text-muted print:hidden">No additional charges added.</p>
        ) : (
          <div className="space-y-3">
            {charges.map((r, i) => {
              const rowResult = result.charges[i];
              return (
                <div key={r.id} className="rounded-xl border border-border bg-background p-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
                    <div>
                      <label htmlFor={`charge-type-${r.id}`} className={labelClass}>Charge Type</label>
                      <select
                        id={`charge-type-${r.id}`}
                        value={r.chargeType}
                        onChange={(e) => updateChargeRow(r.id, { chargeType: e.target.value as ChargeType })}
                        className="field-select"
                      >
                        {CHARGE_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      {r.chargeType === "Other" && (
                        <input
                          aria-label="Custom charge label"
                          value={r.customLabel ?? ""}
                          onChange={(e) => updateChargeRow(r.id, { customLabel: e.target.value })}
                          placeholder="Describe the charge"
                          className={`${inputClass} mt-2`}
                        />
                      )}
                    </div>
                    <div>
                      <label htmlFor={`charge-expected-${r.id}`} className={labelClass}>Expected / Applicable</label>
                      <input
                        id={`charge-expected-${r.id}`}
                        type="number"
                        min="0"
                        step="any"
                        value={r.expectedAmount === 0 ? "" : r.expectedAmount}
                        onChange={(e) => updateChargeRow(r.id, { expectedAmount: Math.max(0, parseFloat(e.target.value) || 0) })}
                        placeholder="0"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor={`charge-billed-${r.id}`} className={labelClass}>Amount Billed</label>
                      <input
                        id={`charge-billed-${r.id}`}
                        type="number"
                        min="0"
                        step="any"
                        value={r.amountBilled === 0 ? "" : r.amountBilled}
                        onChange={(e) => updateChargeRow(r.id, { amountBilled: Math.max(0, parseFloat(e.target.value) || 0) })}
                        placeholder="0"
                        className={inputClass}
                      />
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <div className="text-[11px] text-muted">Potential Missing</div>
                        <div className={`text-sm font-medium ${rowResult?.potentialUnbilled > 0 ? "text-red-700" : "text-foreground"}`}>
                          {formatMoney(rowResult?.potentialUnbilled ?? 0, sym)}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteChargeRow(r.id)}
                        aria-label={`Delete charge ${chargeLabel(r)}`}
                        className="btn btn-danger btn-sm shrink-0"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {rowResult?.overBilled && (
                    <p className="mt-2 text-[13px] text-amber-700 print:hidden">
                      Billed amount exceeds the expected amount — review if needed.
                    </p>
                  )}
                  {/* Print-only row */}
                  <div className="hidden print:flex justify-between text-sm">
                    <span>{chargeLabel(r)}</span>
                    <span className="text-muted">
                      Expected {formatMoney(r.expectedAmount, sym)} · Billed {formatMoney(r.amountBilled, sym)} · Missing {formatMoney(rowResult?.potentialUnbilled ?? 0, sym)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="field-help mt-3 print:hidden">
          All amounts are entered by you — this tool does not assume any industry-standard fee.
        </p>

        {/* Documentation Check sub-block */}
        <div className="mt-6 border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-foreground">Documentation Check</h3>
          <p className="field-help mt-1">
            Documentation gaps do not change the potential unbilled amount — they only affect the billing status.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {DOCUMENTATION_ITEMS.map((d) => (
              <div key={d.key} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl border border-border bg-background p-3">
                <label htmlFor={`doc-${d.key}`} className="text-sm text-foreground">{d.label}</label>
                <select
                  id={`doc-${d.key}`}
                  value={documentation[d.key]}
                  onChange={(e) => setDocStatus(d.key, e.target.value as DocumentationStatus)}
                  className="field-select w-auto min-w-0"
                >
                  <option value="Complete">Complete</option>
                  <option value="Missing">Missing</option>
                  <option value="Not Required">Not Required</option>
                </select>
              </div>
            ))}
          </div>
          {/* Print-only documentation list */}
          <div className="hidden print:block text-sm text-muted mt-2">
            {DOCUMENTATION_ITEMS.map((d) => (
              <div key={d.key} className="flex justify-between">
                <span>{d.label}</span>
                <span>{documentation[d.key]}</span>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

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

      {/* Section 5 — Billing Closeout Review */}
      <SectionCard title="Billing Closeout Review">
        {!hasData ? (
          <EmptyState
            title="No job data yet."
            hint="Compare completed job activity with billing before sending the invoice."
            action={
              <button onClick={handleExample} className="btn btn-secondary btn-sm">
                Try Example
              </button>
            }
          />
        ) : (
          <div className="space-y-6">
            <div className="result-card">
              <h2 className="result-label">Potential Unbilled Revenue</h2>
              <span className={`result-number ${result.potentialTotal > 0 ? "text-red-700" : ""}`}>
                {formatMoney(result.potentialTotal, sym)}
              </span>
              <div className="mt-3">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                    result.status === "READY TO INVOICE"
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {result.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">
                {result.status === "READY TO INVOICE"
                  ? "Based on the information entered, no missing billing items or required documentation were identified."
                  : result.potentialTotal > 0
                    ? `Potential missing billing found in ${result.missingBillingItems} item${result.missingBillingItems === 1 ? "" : "s"}${result.documentationIssues > 0 ? `, plus ${result.documentationIssues} documentation issue${result.documentationIssues === 1 ? "" : "s"}` : ""}.`
                    : `No missing billing amounts found, but ${result.documentationIssues} documentation item${result.documentationIssues === 1 ? " needs" : "s need"} attention.`}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="result-tile">
                <div className="result-tile-label">Potential Unbilled Labor</div>
                <div className="result-tile-value">{formatMoney(result.potentialLabor, sym)}</div>
              </div>
              <div className="result-tile">
                <div className="result-tile-label">Potential Unbilled Materials</div>
                <div className="result-tile-value">{formatMoney(result.potentialMaterials, sym)}</div>
              </div>
              <div className="result-tile">
                <div className="result-tile-label">Potential Unbilled Additional Charges</div>
                <div className="result-tile-value">{formatMoney(result.potentialCharges, sym)}</div>
              </div>
              <div className="result-tile">
                <div className="result-tile-label">Missing Billing Items</div>
                <div className="result-tile-value">{result.missingBillingItems}</div>
              </div>
              <div className="result-tile">
                <div className="result-tile-label">Documentation Issues</div>
                <div className="result-tile-value">{result.documentationIssues}</div>
              </div>
            </div>

            {missingItems.length > 0 && (
              <div className="rounded-xl border border-border bg-background p-4">
                <h3 className="text-sm font-semibold text-foreground">Missing Billing Items</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  {missingItems.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <dt className="text-muted">{item.label}</dt>
                      <dd className="font-medium text-red-700">{formatMoney(item.amount, sym)}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-border pt-2">
                    <dt className="font-medium text-foreground">Potential Total</dt>
                    <dd className="font-semibold text-red-700">{formatMoney(result.potentialTotal, sym)}</dd>
                  </div>
                </dl>
              </div>
            )}

            {overBilledRows > 0 && (
              <p className="text-[13px] text-amber-700">
                {overBilledRows} row{overBilledRows === 1 ? " is" : "s are"} billed above the recorded amount — review those rows before invoicing.
              </p>
            )}
          </div>
        )}
      </SectionCard>

      {/* Print-only summary */}
      <div className="hidden print:block text-sm text-muted">
        Potential Unbilled Labor: {formatMoney(result.potentialLabor, sym)} · Potential Unbilled Materials: {formatMoney(result.potentialMaterials, sym)} · Potential Unbilled Additional Charges: {formatMoney(result.potentialCharges, sym)} · Potential Unbilled Revenue: {formatMoney(result.potentialTotal, sym)} · Missing Billing Items: {result.missingBillingItems} · Documentation Issues: {result.documentationIssues} · Status: {result.status}.
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <button onClick={handleExample} className="btn btn-secondary btn-sm">
          Try Example
        </button>
        <button onClick={handleCopy} className="btn btn-primary" disabled={!hasData}>
          {copied ? "Copied ✓" : "Copy Summary"}
        </button>
        <button onClick={() => window.print()} className="btn btn-secondary" disabled={!hasData}>
          Print Report
        </button>
        <button onClick={handleClear} className="btn btn-danger btn-sm">
          Clear
        </button>
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-muted border-t border-border pt-4">
        This tool provides a billing completeness review based on information entered by the user. It does not verify contracts, pricing agreements, tax treatment, accounting records, or legal billing requirements.
      </div>
    </div>
  );
}
