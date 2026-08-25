"use client";

import { useState, useRef } from "react";
import { calculateLeakCost, validateInputs, type FlowUnit, type LeakInputs, type LeakResult } from "@/lib/compressed-air/engine";

const DEFAULTS = {
  leakFlow: 20,
  flowUnit: "CFM" as FlowUnit,
  hoursPerDay: 16,
  daysPerYear: 250,
  electricityRate: 0.12,
  specificPower: 18,
  repairCost: 250,
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

export default function CompressedAirLeakCostCalculator() {
  const [inputs, setInputs] = useState<LeakInputs>({ ...DEFAULTS });
  const [result, setResult] = useState<LeakResult | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Compute result for display (derived state, no useEffect needed)
  const validationErrors = hasCalculated ? validateInputs(inputs) : [];
  const displayResult = hasCalculated && validationErrors.length === 0
    ? calculateLeakCost(inputs)
    : result;

  const update = (key: keyof LeakInputs, value: number | FlowUnit) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleCalculate = () => {
    const validationErrors = validateInputs(inputs);
    if (validationErrors.length > 0) {
      setResult(null);
      return;
    }

    const r = calculateLeakCost(inputs);
    setResult(r);
    setHasCalculated(true);

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleExample = () => {
    setInputs({ ...DEFAULTS });
    const r = calculateLeakCost({ ...DEFAULTS });
    setResult(r);
    setHasCalculated(true);

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleReset = () => {
    setInputs({ ...DEFAULTS });
    setResult(null);
    setHasCalculated(false);
  };

  return (
    <div className="space-y-6">
      {/* Privacy notice */}
      <div className="flex items-start gap-2 text-xs text-muted bg-gray-50 border border-border rounded-lg p-3">
        <svg className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z" />
        </svg>
        <span>Calculations run locally in your browser. No input data is uploaded or stored.</span>
      </div>

      {/* Input Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Leak Flow Rate */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Leak Flow Rate</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="any"
              value={inputs.leakFlow}
              onChange={(e) => update("leakFlow", parseFloat(e.target.value) || 0)}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <select
              value={inputs.flowUnit}
              onChange={(e) => update("flowUnit", e.target.value as FlowUnit)}
              className="rounded-lg border border-border bg-background px-2 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="CFM">CFM</option>
              <option value="L/s">L/s</option>
              <option value="m³/min">m³/min</option>
            </select>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Hours / day</label>
            <input
              type="number"
              min="0"
              max="24"
              value={inputs.hoursPerDay}
              onChange={(e) => update("hoursPerDay", parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Days / year</label>
            <input
              type="number"
              min="0"
              max="366"
              value={inputs.daysPerYear}
              onChange={(e) => update("daysPerYear", parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Electricity Rate */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Electricity Rate ($/kWh)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={inputs.electricityRate}
            onChange={(e) => update("electricityRate", parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Specific Power */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Specific Power (kW / 100 CFM)</label>
          <input
            type="number"
            min="0.01"
            step="0.1"
            value={inputs.specificPower}
            onChange={(e) => update("specificPower", parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <p className="text-xs text-muted mt-1">Use your compressor&apos;s actual specific power when available.</p>
        </div>

        {/* Repair Cost */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Estimated Repair Cost ($)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={inputs.repairCost}
            onChange={(e) => update("repairCost", parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <p className="text-xs text-muted mt-1">Optional. Used to calculate payback period.</p>
        </div>

        {/* Recoverable Leakage */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Recoverable Leakage (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={inputs.recoverablePercentage}
            onChange={(e) => update("recoverablePercentage", parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <ul className="space-y-1">
            {validationErrors.map((err, i) => (
              <li key={i} className="text-sm text-red-700">{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleCalculate}
          className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
        >
          Calculate
        </button>
        <button
          onClick={handleExample}
          className="inline-flex items-center rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface transition-colors"
        >
          Try Example
        </button>
        <button
          onClick={handleReset}
          className="inline-flex items-center text-sm text-muted hover:text-foreground transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Empty state */}
      {!hasCalculated && (
        <p className="text-sm text-muted text-center py-4">
          Enter your leak parameters or try the example to see estimated costs.
        </p>
      )}

      {/* Results */}
      {displayResult && hasCalculated && (
        <div ref={resultsRef} className="space-y-6">
          {/* Main result */}
          <div className="rounded-lg border border-l-[3px] border-l-primary border-border bg-accent-bg/30 p-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">Estimated Annual Cost Loss</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-foreground">{formatCurrency(displayResult.annualCost)}</span>
              <span className="text-sm text-muted">/ year</span>
            </div>
          </div>

          {/* Detail grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs text-muted mb-1">Monthly Cost</div>
              <div className="text-lg font-semibold text-foreground">{formatCurrency(displayResult.monthlyCost)}</div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs text-muted mb-1">Annual Energy Waste</div>
              <div className="text-lg font-semibold text-foreground">{formatNumber(displayResult.annualEnergyKWh, 0)} kWh</div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs text-muted mb-1">Leak Power</div>
              <div className="text-lg font-semibold text-foreground">{formatNumber(displayResult.leakPowerKW)} kW</div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs text-muted mb-1">Annual Operating Hours</div>
              <div className="text-lg font-semibold text-foreground">{formatNumber(displayResult.annualHours, 0)} h</div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs text-muted mb-1">Leak Flow (CFM)</div>
              <div className="text-lg font-semibold text-foreground">{formatNumber(displayResult.leakFlowCFM)}</div>
            </div>
            {inputs.repairCost > 0 && displayResult.annualSavings > 0 && (
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="text-xs text-muted mb-1">Potential Annual Savings</div>
                <div className="text-lg font-semibold text-green-700">{formatCurrency(displayResult.annualSavings)}</div>
              </div>
            )}
          </div>

          {/* Payback */}
          {inputs.repairCost > 0 && displayResult.annualSavings > 0 && (
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs text-muted mb-1">Estimated Payback</div>
              <div className="flex items-baseline gap-3">
                <span className="text-xl font-semibold text-foreground">{formatNumber(displayResult.paybackMonths)} months</span>
                <span className="text-sm text-muted">({formatNumber(displayResult.paybackYears)} years)</span>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="text-xs text-muted border-t border-border pt-4">
            This calculator provides an estimate for energy and maintenance planning. Actual savings may vary depending on compressor performance and operating conditions.
          </div>
        </div>
      )}
    </div>
  );
}
