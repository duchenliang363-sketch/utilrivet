"use client";

import { useMemo, useRef, useState } from "react";
import SectionCard from "@/components/SectionCard";
import {
  computeReconciliation,
  formatCents,
  parseClientCsv,
  parseMoneyToCents,
} from "@/lib/iolta-reconciliation/engine";

interface AmountRow {
  id: number;
  value: string;
}

interface LedgerRow {
  id: number;
  name: string;
  value: string;
}

interface CsvMsg {
  kind: "ok" | "err";
  text: string;
}

const inputClass = "field-input";

/**
 * IOLTA Trust Account 3-Way Reconciliation — V1 (L6 locked)
 * Manual entry + local CSV only. Arithmetic / reconciliation assistant:
 * no OCR, no 50-state compliance, no ledger hosting, no ERP write-back,
 * no compliance certification. All computation runs in the browser.
 */
export default function IoltaThreeWayReconciliation() {
  const [stmt, setStmt] = useState("");
  const [reg, setReg] = useState("");
  const [checks, setChecks] = useState<AmountRow[]>([]);
  const [deps, setDeps] = useState<AmountRow[]>([]);
  const [ledgers, setLedgers] = useState<LedgerRow[]>([]);
  const [csvMsg, setCsvMsg] = useState<CsvMsg | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [firm, setFirm] = useState("");
  // Default set on first run (client-only click) to avoid SSR hydration mismatch.
  const [period, setPeriod] = useState("");
  const [preparedBy, setPreparedBy] = useState("");

  const nextId = useRef(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const newId = () => nextId.current++;

  // Live adjusted bank balance (integer cents; "—" while any input is invalid)
  const liveAdjusted = useMemo(() => {
    const s = parseMoneyToCents(stmt);
    if (s === null && stmt.trim() !== "") return null;
    let total = s ?? 0;
    let invalid = s === null;
    for (const c of checks) {
      if (c.value.trim() === "") continue;
      const v = parseMoneyToCents(c.value);
      if (v === null) invalid = true;
      else total -= v;
    }
    for (const d of deps) {
      if (d.value.trim() === "") continue;
      const v = parseMoneyToCents(d.value);
      if (v === null) invalid = true;
      else total += v;
    }
    return invalid ? null : total;
  }, [stmt, checks, deps]);

  const result = useMemo(() => {
    if (!hasRun) return null;
    return computeReconciliation({
      statementEnding: stmt,
      register: reg,
      checks: checks.map((c) => c.value),
      deposits: deps.map((d) => d.value),
      ledgers: ledgers.map((l) => ({ name: l.name, balance: l.value })),
    });
  }, [hasRun, stmt, reg, checks, deps, ledgers]);

  // Per-field error flags (drives red borders + short inline messages)
  const stmtError = useMemo(() => {
    if (!hasRun || !result) return null;
    if (stmt.trim() === "") return "Required.";
    if (parseMoneyToCents(stmt) === null) return "Enter a valid amount.";
    return null;
  }, [hasRun, result, stmt]);
  const regError = useMemo(() => {
    if (!hasRun || !result) return null;
    if (reg.trim() === "") return "Required.";
    if (parseMoneyToCents(reg) === null) return "Enter a valid amount.";
    return null;
  }, [hasRun, result, reg]);
  const ledgerMissing = useMemo(
    () => hasRun && result !== null && result.ledgerCount === 0,
    [hasRun, result]
  );
  const rowError = (value: string, isOutstanding: boolean): string | null => {
    if (!hasRun || !result) return null;
    if (value.trim() === "") return null; // empty optional row = 0
    const v = parseMoneyToCents(value);
    if (v === null) return "Invalid amount.";
    if (isOutstanding && v < 0) return "Must be 0 or more.";
    return null;
  };
  const ledgerRowError = (value: string): string | null => {
    if (!hasRun || !result) return null;
    if (value.trim() === "") return null;
    if (parseMoneyToCents(value) === null) return "Invalid amount.";
    return null;
  };

  // ── Handlers ──
  const updateCheck = (id: number, value: string) =>
    setChecks((rows) => rows.map((r) => (r.id === id ? { ...r, value } : r)));
  const updateDep = (id: number, value: string) =>
    setDeps((rows) => rows.map((r) => (r.id === id ? { ...r, value } : r)));
  const updateLedger = (id: number, patch: Partial<LedgerRow>) =>
    setLedgers((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const run = () => {
    if (period === "") {
      setPeriod(new Date().toLocaleString("en-US", { month: "long", year: "numeric" }));
    }
    setHasRun(true);
  };

  const clearAll = () => {
    setHasRun(false);
    setStmt("");
    setReg("");
    setChecks([]);
    setDeps([]);
    setLedgers([]);
    setCsvMsg(null);
    setFirm("");
    setPreparedBy("");
    setPeriod(new Date().toLocaleString("en-US", { month: "long", year: "numeric" }));
    if (fileRef.current) fileRef.current.value = "";
  };

  const importCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseClientCsv(String(reader.result));
      if (parsed.rows.length === 0) {
        setCsvMsg({
          kind: "err",
          text: parsed.skipped > 0
            ? `No rows imported — skipped ${parsed.skipped} row(s) that didn't match "Client, Balance".`
            : 'No rows found — expected CSV with "Client, Balance" per line.',
        });
        return;
      }
      const newRows: LedgerRow[] = parsed.rows.map((r) => ({
        id: newId(),
        name: r.name,
        value: r.balance,
      }));
      setLedgers((rows) => [...rows, ...newRows]);
      setCsvMsg({
        kind: "ok",
        text:
          `Imported ${newRows.length} client ledger row(s).` +
          (parsed.skipped ? ` Skipped ${parsed.skipped} invalid row(s).` : "") +
          (parsed.headerSkipped ? ' Detected "Client, Balance" header.' : ""),
      });
    };
    reader.onerror = () => setCsvMsg({ kind: "err", text: "Could not read the file." });
    reader.readAsText(file);
  };

  // ── Render helpers ──
  const moneyInput = (
    value: string,
    onChange: (v: string) => void,
    error: string | null,
    placeholder = "0.00"
  ) => (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      aria-invalid={error !== null}
      className={`${inputClass} tabular-nums ${
        error ? "border-red-400 bg-red-50" : ""
      }`}
    />
  );

  const amountRowMarkup = (
    rows: AmountRow[],
    update: (id: number, v: string) => void,
    remove: (id: number) => void,
    label: string,
    isOutstanding: boolean
  ) =>
    rows.map((r) => {
      const err = rowError(r.value, isOutstanding);
      return (
        <div key={r.id} className="mt-2">
          <div className="flex items-center gap-2">
            <div className="w-40 sm:w-48">
              {moneyInput(r.value, (v) => update(r.id, v), err)}
            </div>
            <button
              type="button"
              onClick={() => remove(r.id)}
              className="btn btn-danger btn-sm"
              aria-label={`Remove ${label}`}
            >
              ✕
            </button>
          </div>
          {err && <p className="mt-1 text-xs text-red-600">{`${label} ${err}`}</p>}
        </div>
      );
    });

  const errors = result?.errors ?? [];
  const negativeLedgers = result?.negativeLedgers ?? [];
  const showResult = hasRun && result !== null && result.canGenerate;

  return (
    <div className="space-y-6">
      {/* ── 1. Bank statement ── */}
      <SectionCard
        title="1 · Bank statement"
        description="Ending balance from the bank statement, plus items that have not cleared yet."
        className="print:hidden"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="stmtBal" className="field-label">
              Statement ending balance <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">$</span>
              <input
                id="stmtBal"
                type="text"
                inputMode="decimal"
                value={stmt}
                onChange={(e) => setStmt(e.target.value)}
                placeholder="0.00"
                autoComplete="off"
                aria-invalid={stmtError !== null}
                className={`${inputClass} pl-7 tabular-nums ${stmtError ? "border-red-400 bg-red-50" : ""}`}
              />
            </div>
            {stmtError && <p className="field-help text-red-600">{stmtError}</p>}
          </div>
        </div>

        <label className="field-label mt-4">Outstanding checks (subtract) — optional</label>
        {amountRowMarkup(checks, updateCheck, (id) => setChecks(checks.filter((r) => r.id !== id)), "Check", true)}
        <button type="button" onClick={() => setChecks([...checks, { id: newId(), value: "" }])} className="btn btn-secondary btn-sm mt-2">
          + Add outstanding check
        </button>

        <label className="field-label mt-4">Outstanding deposits (add) — optional</label>
        {amountRowMarkup(deps, updateDep, (id) => setDeps(deps.filter((r) => r.id !== id)), "Deposit", true)}
        <button type="button" onClick={() => setDeps([...deps, { id: newId(), value: "" }])} className="btn btn-secondary btn-sm mt-2">
          + Add outstanding deposit
        </button>

        <div className="mt-4 flex items-baseline justify-between border-t border-dashed border-border pt-3 text-sm">
          <span className="text-muted">Adjusted bank balance</span>
          <b className="text-base tabular-nums">
            {liveAdjusted === null ? "—" : formatCents(liveAdjusted)}
          </b>
        </div>
      </SectionCard>

      {/* ── 2. Trust register ── */}
      <SectionCard
        title="2 · Trust register"
        description="The running total in your trust checkbook / register as of the statement date."
        className="print:hidden"
      >
        <label htmlFor="regBal" className="field-label">
          Trust register balance <span className="text-red-600">*</span>
        </label>
        <div className="relative sm:max-w-sm">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">$</span>
          <input
            id="regBal"
            type="text"
            inputMode="decimal"
            value={reg}
            onChange={(e) => setReg(e.target.value)}
            placeholder="0.00"
            autoComplete="off"
            aria-invalid={regError !== null}
            className={`${inputClass} pl-7 tabular-nums ${regError ? "border-red-400 bg-red-50" : ""}`}
          />
        </div>
        {regError && <p className="field-help text-red-600">{regError}</p>}
      </SectionCard>

      {/* ── 3. Client ledgers ── */}
      <SectionCard
        title="3 · Client ledgers"
        description="Ending balance of each client / matter ledger. Names are for the printed record only."
        className="print:hidden"
      >
        {ledgers.map((l) => {
          const err = ledgerRowError(l.value);
          return (
            <div key={l.id} className="mt-2 first:mt-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={l.name}
                  onChange={(e) => updateLedger(l.id, { name: e.target.value })}
                  placeholder="Client / matter (optional)"
                  autoComplete="off"
                  className={`${inputClass} flex-1`}
                />
                <div className="w-40 sm:w-48">
                  {moneyInput(l.value, (v) => updateLedger(l.id, { value: v }), err)}
                </div>
                <button
                  type="button"
                  onClick={() => setLedgers(ledgers.filter((r) => r.id !== l.id))}
                  className="btn btn-danger btn-sm"
                  aria-label="Remove ledger"
                >
                  ✕
                </button>
              </div>
              {err && <p className="mt-1 text-xs text-red-600">Ledger balance: {err}</p>}
            </div>
          );
        })}
        {ledgerMissing && (
          <p className="mt-2 text-xs text-red-600">Add at least one client ledger with a valid balance.</p>
        )}
        <button
          type="button"
          onClick={() => setLedgers([...ledgers, { id: newId(), name: "", value: "" }])}
          className="btn btn-secondary btn-sm mt-3"
        >
          + Add client ledger
        </button>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-muted">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importCsv(f);
            }}
            className="max-w-[220px] text-xs"
          />
          <span>CSV format: Client, Balance — read locally in your browser, never uploaded.</span>
        </div>
        {csvMsg && (
          <p className={`mt-2 text-[13px] ${csvMsg.kind === "err" ? "text-red-600" : "text-muted"}`}>
            {csvMsg.text}
          </p>
        )}
      </SectionCard>

      {/* ── Actions ── */}
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <button type="button" onClick={run} className="btn btn-primary">
          Run reconciliation
        </button>
        <button type="button" onClick={clearAll} className="btn btn-ghost">
          Clear all
        </button>
      </div>

      {/* ── Blocking errors (P0-1: no result, no false BALANCED) ── */}
      {hasRun && !showResult && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 print:hidden">
          <p className="text-sm font-semibold text-red-700">
            Fix the items below to generate a reconciliation result:
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-red-700">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Result ── */}
      {showResult && result && (
        <SectionCard title="Result" className="print:hidden">
          <span
            className={`inline-block rounded-full px-4 py-1 text-sm font-bold ${
              result.balanced ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {result.balanced
              ? "BALANCED — all three figures agree to the cent"
              : "OUT OF BALANCE"}
          </span>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs text-muted">Adjusted bank balance</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{formatCents(result.adjustedBankCents)}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs text-muted">Trust register balance</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{formatCents(result.registerCents)}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs text-muted">Total client ledgers ({result.ledgerCount})</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{formatCents(result.ledgerTotalCents)}</p>
            </div>
          </div>

          <div className="mt-3 space-y-1 text-sm">
            <p className={result.adjustedBankCents === result.registerCents ? "text-green-700" : "text-red-600"}>
              Bank − Register: {formatCents(result.adjustedBankCents - result.registerCents)}
            </p>
            <p className={result.registerCents === result.ledgerTotalCents ? "text-green-700" : "text-red-600"}>
              Register − Ledgers: {formatCents(result.registerCents - result.ledgerTotalCents)}
            </p>
          </div>

          {negativeLedgers.length > 0 && (
            <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm">
              <p className="font-semibold text-red-700">⚠ Negative client ledger balance(s) — investigate</p>
              <ul className="mt-1 list-disc pl-5 text-red-700">
                {negativeLedgers.map((n, i) => (
                  <li key={i}>
                    {n.name} — {formatCents(n.cents)}
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-red-700">
                A negative client balance can indicate that one client&rsquo;s funds were used for
                another client&rsquo;s matter. Review before signing.
              </p>
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="rFirm" className="field-label">Firm name (for the printed record)</label>
              <input id="rFirm" type="text" value={firm} onChange={(e) => setFirm(e.target.value)} placeholder="Law firm name" className={inputClass} />
            </div>
            <div>
              <label htmlFor="rPeriod" className="field-label">Period</label>
              <input id="rPeriod" type="text" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="e.g., August 2026" className={inputClass} />
            </div>
            <div>
              <label htmlFor="rBy" className="field-label">Prepared by</label>
              <input id="rBy" type="text" value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} placeholder="Your name" className={inputClass} />
            </div>
          </div>

          <div className="mt-4">
            <button type="button" onClick={() => window.print()} className="btn btn-primary">
              Generate &amp; print / save PDF
            </button>
          </div>
        </SectionCard>
      )}

      {/* ── Printable reconciliation record (print-only; P0-2: normal flow, no clipping) ── */}
      {showResult && result && (
        <div className="hidden print:block">
          <h2 className="text-lg font-bold">IOLTA Trust Account — Three-Way Reconciliation Record</h2>
          <p className="mt-1 text-sm">
            Firm: <span className="font-medium">{firm.trim() || "________________________"}</span>
            <span className="mx-4">Period: <span className="font-medium">{period.trim() || "____________"}</span></span>
            <span>Prepared by: <span className="font-medium">{preparedBy.trim() || "____________"}</span></span>
          </p>

          <table className="mt-3 w-full border-collapse text-sm">
            <tbody>
              <tr>
                <td className="border border-gray-500 px-2 py-1">Bank statement ending balance</td>
                <td className="border border-gray-500 px-2 py-1 text-right tabular-nums">{formatCents(result.statementCents)}</td>
              </tr>
              <tr>
                <td className="border border-gray-500 px-2 py-1">Less: outstanding checks</td>
                <td className="border border-gray-500 px-2 py-1 text-right tabular-nums">({formatCents(result.checksCents)})</td>
              </tr>
              <tr>
                <td className="border border-gray-500 px-2 py-1">Plus: outstanding deposits</td>
                <td className="border border-gray-500 px-2 py-1 text-right tabular-nums">{formatCents(result.depositsCents)}</td>
              </tr>
              <tr>
                <th className="border border-gray-500 px-2 py-1 text-left">Adjusted bank balance</th>
                <th className="border border-gray-500 px-2 py-1 text-right tabular-nums">{formatCents(result.adjustedBankCents)}</th>
              </tr>
              <tr>
                <th className="border border-gray-500 px-2 py-1 text-left">Trust register balance</th>
                <th className="border border-gray-500 px-2 py-1 text-right tabular-nums">{formatCents(result.registerCents)}</th>
              </tr>
              <tr>
                <th className="border border-gray-500 px-2 py-1 text-left">Total client ledger balances ({result.ledgerCount})</th>
                <th className="border border-gray-500 px-2 py-1 text-right tabular-nums">{formatCents(result.ledgerTotalCents)}</th>
              </tr>
            </tbody>
          </table>

          <p className="mt-3 text-sm font-bold">
            {result.balanced
              ? "Result: BALANCED — adjusted bank balance = trust register = total client ledgers."
              : `Result: OUT OF BALANCE — differences: Bank − Register ${formatCents(
                  result.adjustedBankCents - result.registerCents
                )}; Register − Ledgers ${formatCents(result.registerCents - result.ledgerTotalCents)}.`}
          </p>
          <p className="mt-1 text-sm">
            <b>Negative client ledger balances:</b>{" "}
            {negativeLedgers.length
              ? negativeLedgers.map((n) => `${n.name} — ${formatCents(n.cents)}`).join("; ")
              : "None"}
          </p>

          <div className="mt-10 flex gap-12 text-xs">
            <div className="flex-1">
              <div className="h-6 border-b border-black" />
              Prepared by (signature)
            </div>
            <div className="flex-1">
              <div className="h-6 border-b border-black" />
              Date
            </div>
            <div className="flex-1">
              <div className="h-6 border-b border-black" />
              Attorney / responsible party (signature)
            </div>
            <div className="flex-1">
              <div className="h-6 border-b border-black" />
              Date
            </div>
          </div>

          <p className="mt-6 text-[11px] leading-relaxed">
            Arithmetic / reconciliation assistance only. Not legal advice. Does not certify
            compliance with any state bar rule, ABA Model Rule 1.15, or other requirement — the
            user remains responsible for verification. Generated locally in your browser; nothing
            was stored or uploaded.
          </p>
        </div>
      )}

      {/* ── On-screen disclaimer (P1-1: state bar notes removed; keep disclaimer) ── */}
      <div className="border-t border-border pt-4 text-xs leading-relaxed text-muted print:hidden">
        <p>
          <b>Arithmetic / reconciliation assistance only.</b> Not legal advice. Does not certify
          compliance with any state bar rule, ABA Model Rule 1.15, or any other requirement — the
          user remains responsible for verification. Nothing you type is stored, saved, or
          uploaded; all calculations run in your browser.
        </p>
        <p className="mt-1">Not affiliated with or endorsed by any state bar association.</p>
      </div>
    </div>
  );
}
