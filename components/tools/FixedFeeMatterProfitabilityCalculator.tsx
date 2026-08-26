"use client";

import { useMemo, useState } from "react";
import {
  buildSummaryText,
  computeMatter,
  currencySymbol,
  validateMatter,
  type Currency,
  type MatterInputs,
  type OtherCost,
  type TeamMember,
} from "@/lib/matter-profitability/engine";
import SectionCard from "@/components/SectionCard";
import EmptyState from "@/components/EmptyState";

const inputClass = "field-input";
const labelClass = "field-label";

const CURRENCIES: Currency[] = ["USD", "GBP", "EUR", "CAD", "AUD"];

const DEFAULT_TEAM: TeamMember[] = [{ id: 1, role: "", hours: 0, hourlyCost: 0 }];

function formatMoney(n: number, sym: string, decimals = 0): string {
  if (!Number.isFinite(n)) return `${sym}0`;
  const sign = n < 0 ? "-" : "";
  return (
    sign +
    sym +
    Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  );
}

function formatPct(n: number | null, decimals = 1): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(decimals)}%`;
}

// ─── Main Component ────────────────────────────────────────

export default function FixedFeeMatterProfitabilityCalculator() {
  const [matterName, setMatterName] = useState("");
  const [fixedFee, setFixedFee] = useState(0);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [team, setTeam] = useState<TeamMember[]>(DEFAULT_TEAM.map((t) => ({ ...t })));
  const [otherCosts, setOtherCosts] = useState<OtherCost[]>([]);
  const [targetMarginPct, setTargetMarginPct] = useState(30);
  const [nextId, setNextId] = useState(2);
  const [copied, setCopied] = useState(false);

  const inputs: MatterInputs = useMemo(
    () => ({ matterName, fixedFee, currency, team, otherCosts, targetMarginPct }),
    [matterName, fixedFee, currency, team, otherCosts, targetMarginPct]
  );
  const result = useMemo(() => computeMatter(inputs), [inputs]);
  const errors = validateMatter(inputs);
  const sym = currencySymbol(currency);

  const hasReview = fixedFee > 0 || result.laborCost > 0 || result.otherCost > 0;

  // Team rows
  const addTeamMember = () => {
    setTeam((prev) => [...prev, { id: nextId, role: "", hours: 0, hourlyCost: 0 }]);
    setNextId((n) => n + 1);
  };
  const updateTeamMember = (id: number, patch: Partial<TeamMember>) => {
    setTeam((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };
  const deleteTeamMember = (id: number) => {
    setTeam((prev) => (prev.length > 1 ? prev.filter((t) => t.id !== id) : prev));
  };

  // Other cost rows
  const addOtherCost = () => {
    setOtherCosts((prev) => [...prev, { id: nextId, description: "", amount: 0 }]);
    setNextId((n) => n + 1);
  };
  const updateOtherCost = (id: number, patch: Partial<OtherCost>) => {
    setOtherCosts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };
  const deleteOtherCost = (id: number) => {
    setOtherCosts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleExample = () => {
    setMatterName("Standard Business Formation");
    setFixedFee(3500);
    setCurrency("USD");
    setTeam([
      { id: 1, role: "Partner", hours: 3, hourlyCost: 160 },
      { id: 2, role: "Associate", hours: 8, hourlyCost: 80 },
      { id: 3, role: "Paralegal", hours: 4, hourlyCost: 40 },
    ]);
    setOtherCosts([{ id: 4, description: "Filing / Admin", amount: 300 }]);
    setTargetMarginPct(30);
    setNextId(5);
  };

  const handleClear = () => {
    if (!window.confirm("Clear all matter data and start over?")) return;
    setMatterName("");
    setFixedFee(0);
    setCurrency("USD");
    setTeam(DEFAULT_TEAM.map((t) => ({ ...t })));
    setOtherCosts([]);
    setTargetMarginPct(30);
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

  // Neutral, math-only status note (no judgement language)
  const statusNote = !hasReview
    ? null
    : result.profit < 0
      ? "Negative profit: total cost exceeds the fixed fee."
      : result.profit === 0
        ? "Break-even: the fixed fee exactly covers total cost."
        : result.profitMarginPct !== null && result.profitMarginPct < targetMarginPct
          ? `Positive profit, but below your selected target margin (${formatPct(result.profitMarginPct)} vs. ${targetMarginPct}%).`
          : "Positive profit, at or above your selected target margin.";

  return (
    <div className="space-y-8">
      {/* Print-only report header */}
      <div className="hidden print:block">
        <div className="text-xs font-semibold tracking-widest text-muted uppercase">UtilRivet</div>
        <div className="text-xl font-bold text-foreground mt-1">Fixed-Fee Matter Profitability Review</div>
        <div className="text-sm text-muted mt-2">
          {matterName.trim() && <div>Matter: {matterName.trim()}</div>}
          <div>Currency: {currency}</div>
        </div>
      </div>

      {/* Section 1 — Matter Details */}
      <SectionCard title="Matter Details" className="print:hidden">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="matter-name" className={labelClass}>Matter Name (optional)</label>
            <input
              id="matter-name"
              value={matterName}
              onChange={(e) => setMatterName(e.target.value)}
              placeholder="e.g. Standard LLC Formation"
              className={inputClass}
            />
            <p className="field-help">Avoid entering confidential client information.</p>
          </div>
          <div>
            <label htmlFor="fixed-fee" className={labelClass}>Fixed Fee</label>
            <input
              id="fixed-fee"
              type="number"
              min="0"
              step="any"
              value={fixedFee === 0 ? "" : fixedFee}
              onChange={(e) => setFixedFee(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="3500"
              className={inputClass}
            />
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
        </div>
      </SectionCard>

      {/* Section 2 — Team & Time */}
      <SectionCard
        title="Team & Time"
        description="Enter the actual hours worked on this matter and each person's internal cost per hour."
        actions={
          <button onClick={addTeamMember} className="btn btn-primary btn-sm print:hidden">
            + Add Team Member
          </button>
        }
      >
        <div className="space-y-3">
          {team.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-background p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
                <div>
                  <label htmlFor={`role-${t.id}`} className={labelClass}>Role / Name</label>
                  <input
                    id={`role-${t.id}`}
                    value={t.role}
                    onChange={(e) => updateTeamMember(t.id, { role: e.target.value })}
                    placeholder="Partner"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor={`hours-${t.id}`} className={labelClass}>Hours</label>
                  <input
                    id={`hours-${t.id}`}
                    type="number"
                    min="0"
                    step="0.5"
                    value={t.hours === 0 ? "" : t.hours}
                    onChange={(e) => updateTeamMember(t.id, { hours: Math.max(0, parseFloat(e.target.value) || 0) })}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor={`cost-${t.id}`} className={labelClass}>Internal Cost / Hour</label>
                  <input
                    id={`cost-${t.id}`}
                    type="number"
                    min="0"
                    step="any"
                    value={t.hourlyCost === 0 ? "" : t.hourlyCost}
                    onChange={(e) => updateTeamMember(t.id, { hourlyCost: Math.max(0, parseFloat(e.target.value) || 0) })}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <div className="text-[11px] text-muted">Labor Cost</div>
                    <div className="text-sm font-medium text-foreground">{formatMoney(t.hours * t.hourlyCost, sym, 2)}</div>
                  </div>
                  <button
                    onClick={() => deleteTeamMember(t.id)}
                    disabled={team.length <= 1}
                    aria-label={`Delete team member ${t.role.trim() || "row"}`}
                    className="btn btn-danger btn-sm shrink-0 disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {/* Print-only row */}
              <div className="hidden print:flex justify-between text-sm">
                <span>{t.role.trim() || "Team member"}</span>
                <span className="text-muted">
                  {t.hours} h × {formatMoney(t.hourlyCost, sym)} = {formatMoney(t.hours * t.hourlyCost, sym, 2)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="field-help mt-3 print:hidden">
          Use your estimated internal hourly cost, not the rate billed to the client.
        </p>
      </SectionCard>

      {/* Section 3 — Other Costs */}
      <SectionCard
        title="Other Costs"
        description="Direct costs actually borne by the firm on this matter, such as filing fees, courier, contract attorney, travel or research services."
        actions={
          <button onClick={addOtherCost} className="btn btn-primary btn-sm print:hidden">
            + Add Other Cost
          </button>
        }
      >
        {otherCosts.length === 0 ? (
          <p className="text-[13px] text-muted print:hidden">No other costs added.</p>
        ) : (
          <div className="space-y-3">
            {otherCosts.map((c) => (
              <div key={c.id} className="grid gap-3 sm:grid-cols-[1fr_160px_auto] items-end print:hidden">
                <div>
                  <label htmlFor={`cost-desc-${c.id}`} className={labelClass}>Description</label>
                  <input
                    id={`cost-desc-${c.id}`}
                    value={c.description}
                    onChange={(e) => updateOtherCost(c.id, { description: e.target.value })}
                    placeholder="Filing fees"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor={`cost-amt-${c.id}`} className={labelClass}>Amount</label>
                  <input
                    id={`cost-amt-${c.id}`}
                    type="number"
                    min="0"
                    step="any"
                    value={c.amount === 0 ? "" : c.amount}
                    onChange={(e) => updateOtherCost(c.id, { amount: Math.max(0, parseFloat(e.target.value) || 0) })}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <button
                  onClick={() => deleteOtherCost(c.id)}
                  aria-label={`Delete cost ${c.description.trim() || "row"}`}
                  className="btn btn-danger btn-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
        {/* Print-only cost list */}
        <div className="hidden print:block text-sm text-muted">
          {otherCosts.length === 0
            ? "Other costs: none recorded."
            : otherCosts.map((c) => (
                <div key={c.id} className="flex justify-between">
                  <span>{c.description.trim() || "Other cost"}</span>
                  <span>{formatMoney(c.amount, sym, 2)}</span>
                </div>
              ))}
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

      {/* Section 4 — Profitability Review */}
      <SectionCard title="Profitability Review">
        {!hasReview ? (
          <EmptyState
            title="No matter data yet."
            hint="Enter a fixed fee and actual matter costs to review profitability."
            action={
              <button onClick={handleExample} className="btn btn-secondary btn-sm">
                Try Example
              </button>
            }
          />
        ) : (
          <div className="space-y-6">
            <div className="result-card">
              <h2 className="result-label">Matter Profit</h2>
              <span className={`result-number ${result.profit < 0 ? "text-red-700" : ""}`}>
                {formatMoney(result.profit, sym)}
              </span>
              {statusNote && <p className="mt-2 text-sm text-muted">{statusNote}</p>}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="result-tile">
                <div className="result-tile-label">Profit Margin</div>
                <div className="result-tile-value">{formatPct(result.profitMarginPct)}</div>
              </div>
              <div className="result-tile">
                <div className="result-tile-label">Effective Hourly Rate</div>
                <div className="result-tile-value">
                  {result.effectiveHourlyRate === null ? "—" : `${formatMoney(result.effectiveHourlyRate, sym, 2)}/hr`}
                </div>
              </div>
              <div className="result-tile">
                <div className="result-tile-label">Profit Per Hour</div>
                <div className="result-tile-value">
                  {result.profitPerHour === null ? "—" : `${formatMoney(result.profitPerHour, sym, 2)}/hr`}
                </div>
              </div>
              <div className="result-tile">
                <div className="result-tile-label">Total Team Hours</div>
                <div className="result-tile-value">{result.totalHours.toLocaleString("en-US", { maximumFractionDigits: 1 })} h</div>
              </div>
              <div className="result-tile">
                <div className="result-tile-label">Total Matter Cost</div>
                <div className="result-tile-value">{formatMoney(result.totalCost, sym)}</div>
              </div>
            </div>
            <p className="text-[13px] text-muted">
              Effective Hourly Rate is revenue-based: fixed fee ÷ total team hours. Profit Per Hour is matter profit ÷ total team hours.
            </p>

            {/* Cost breakdown */}
            <div className="rounded-xl border border-border bg-background p-4">
              <h3 className="text-sm font-semibold text-foreground">Cost Breakdown</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Labor Cost</dt>
                  <dd className="font-medium text-foreground">
                    {formatMoney(result.laborCost, sym)}
                    {result.laborPctOfFee !== null && <span className="text-muted font-normal"> · {formatPct(result.laborPctOfFee)} of fee</span>}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Other Costs</dt>
                  <dd className="font-medium text-foreground">
                    {formatMoney(result.otherCost, sym)}
                    {result.otherPctOfFee !== null && <span className="text-muted font-normal"> · {formatPct(result.otherPctOfFee)} of fee</span>}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <dt className="font-medium text-foreground">Total Cost</dt>
                  <dd className="font-semibold text-foreground">{formatMoney(result.totalCost, sym)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Profit</dt>
                  <dd className="font-medium text-foreground">
                    {formatMoney(result.profit, sym)}
                    {result.profitPctOfFee !== null && <span className="text-muted font-normal"> · {formatPct(result.profitPctOfFee)} of fee</span>}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Section 5 — Next Matter Pricing */}
      <SectionCard
        title="Next Matter Pricing"
        description="If a similar matter costs about the same, this is the fee that would reach your target profit margin."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end print:hidden">
          <div>
            <label htmlFor="target-margin" className={labelClass}>Target Profit Margin (%)</label>
            <input
              id="target-margin"
              type="number"
              min="0"
              max="90"
              step="1"
              value={targetMarginPct}
              onChange={(e) => setTargetMarginPct(parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
            <p className="field-help">Allowed range: 0–90%.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="result-tile">
            <div className="result-tile-label">Current Fixed Fee</div>
            <div className="result-tile-value">{formatMoney(fixedFee, sym)}</div>
          </div>
          <div className="result-tile">
            <div className="result-tile-label">Current Margin</div>
            <div className="result-tile-value">{formatPct(result.profitMarginPct)}</div>
          </div>
          <div className="result-tile">
            <div className="result-tile-label">Target Margin</div>
            <div className="result-tile-value">{formatPct(Math.min(90, Math.max(0, targetMarginPct)), 0)}</div>
          </div>
          <div className="result-tile">
            <div className="result-tile-label">Target-Margin Fee</div>
            <div className="result-tile-value">{formatMoney(result.targetMarginFee ?? 0, sym)}</div>
          </div>
          <div className="result-tile">
            <div className="result-tile-label">Rounded Fee</div>
            <div className="result-tile-value">{formatMoney(result.roundedFee ?? 0, sym)}</div>
          </div>
          <div className="result-tile">
            <div className="result-tile-label">Difference vs. Current Fee</div>
            <div className="result-tile-value">
              {result.feeDifference === null ? "—" : `${result.feeDifference >= 0 ? "+" : ""}${formatMoney(result.feeDifference, sym)}`}
            </div>
          </div>
        </div>
        <p className="text-[13px] text-muted mt-3">
          Calculated target-margin fee: total matter cost ÷ (1 − target margin). It is a mathematical estimate, not market pricing.
        </p>
      </SectionCard>

      {/* Print-only assumptions */}
      <div className="hidden print:block text-sm text-muted">
        Fixed Fee: {formatMoney(fixedFee, sym)} · Total Hours: {result.totalHours} · Labor Cost: {formatMoney(result.laborCost, sym)} · Other Costs: {formatMoney(result.otherCost, sym)} · Total Cost: {formatMoney(result.totalCost, sym)} · Profit: {formatMoney(result.profit, sym)} · Margin: {formatPct(result.profitMarginPct)} · Effective Hourly Rate: {result.effectiveHourlyRate === null ? "—" : formatMoney(result.effectiveHourlyRate, sym, 2) + "/hr"} · Target Margin: {Math.min(90, Math.max(0, targetMarginPct))}% · Target-Margin Fee: {formatMoney(result.targetMarginFee ?? 0, sym)}.
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <button onClick={handleExample} className="btn btn-secondary btn-sm">
          Try Example
        </button>
        <button onClick={handleCopy} className="btn btn-primary" disabled={!hasReview}>
          {copied ? "Copied ✓" : "Copy Summary"}
        </button>
        <button onClick={() => window.print()} className="btn btn-secondary" disabled={!hasReview}>
          Print Report
        </button>
        <button onClick={handleClear} className="btn btn-danger btn-sm">
          Clear
        </button>
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-muted border-t border-border pt-4">
        This tool provides mathematical estimates for internal business analysis. It is not legal, accounting, tax, or financial advice.
      </div>
    </div>
  );
}
