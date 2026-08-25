"use client";

import { useState, useRef } from "react";
import { calculateLeakCost, validateInputs, type FlowUnit, type LeakInputs, type LeakResult } from "@/lib/compressed-air/engine";
import EmptyState from "@/components/EmptyState";

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
      {/* Input Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Leak Flow Rate */}
        <div>
          <label className="field-label">Leak Flow Rate</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="any"
              value={inputs.leakFlow}
              onChange={(e) => update("leakFlow", parseFloat(e.target.value) || 0)}
              className="field-input min-w-0 flex-1"
            />
            <div className="w-28 shrink-0">
              <select
                value={inputs.flowUnit}
                onChange={(e) => update("flowUnit", e.target.value as FlowUnit)}
                className="field-select"
              >
                <option value="CFM">CFM</option>
                <option value="L/s">L/s</option>
                <option value="m³/min">m³/min</option>
              </select>
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Hours / day</label>
            <input
              type="number"
              min="0"
              max="24"
              value={inputs.hoursPerDay}
              onChange={(e) => update("hoursPerDay", parseFloat(e.target.value) || 0)}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Days / year</label>
            <input
              type="number"
              min="0"
              max="366"
              value={inputs.daysPerYear}
              onChange={(e) => update("daysPerYear", parseFloat(e.target.value) || 0)}
              className="field-input"
            />
          </div>
        </div>

        {/* Electricity Rate */}
        <div>
          <label className="field-label">Electricity Rate ($/kWh)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={inputs.electricityRate}
            onChange={(e) => update("electricityRate", parseFloat(e.target.value) || 0)}
            className="field-input"
          />
        </div>

        {/* Specific Power */}
        <div>
          <label className="field-label">Specific Power (kW / 100 CFM)</label>
          <input
            type="number"
            min="0.01"
            step="0.1"
            value={inputs.specificPower}
            onChange={(e) => update("specificPower", parseFloat(e.target.value) || 0)}
            className="field-input"
          />
          <p className="field-help">Use your compressor&apos;s actual specific power when available.</p>
        </div>

        {/* Repair Cost */}
        <div>
          <label className="field-label">Estimated Repair Cost ($)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={inputs.repairCost}
            onChange={(e) => update("repairCost", parseFloat(e.target.value) || 0)}
            className="field-input"
          />
          <p className="field-help">Optional. Used to calculate payback period.</p>
        </div>

        {/* Recoverable Leakage */}
        <div>
          <label className="field-label">Recoverable Leakage (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={inputs.recoverablePercentage}
            onChange={(e) => update("recoverablePercentage", parseFloat(e.target.value) || 0)}
            className="field-input"
          />
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <ul className="space-y-1">
            {validationErrors.map((err, i) => (
              <li key={i} className="text-sm text-red-700">{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={handleCalculate} className="btn btn-primary">
          Calculate
        </button>
        <button onClick={handleExample} className="btn btn-secondary">
          Try Example
        </button>
        <button onClick={handleReset} className="btn btn-ghost">
          Reset
        </button>
      </div>

      {/* Empty state */}
      {!hasCalculated && (
        <EmptyState
          title="No results yet"
          hint="Enter your leak parameters or try the example to see estimated costs."
          action={
            <button onClick={handleExample} className="btn btn-secondary btn-sm">
              Try Example
            </button>
          }
        />
      )}

      {/* Results */}
      {displayResult && hasCalculated && (
        <div ref={resultsRef} className="space-y-6">
          {/* Main result */}
          <div className="result-card">
            <h3 className="result-label">Estimated Annual Cost Loss</h3>
            <div className="flex items-baseline gap-2">
              <span className="result-number">{formatCurrency(displayResult.annualCost)}</span>
              <span className="text-sm text-muted">/ year</span>
            </div>
          </div>

          {/* Detail grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="result-tile">
              <div className="result-tile-label">Monthly Cost</div>
              <div className="result-tile-value">{formatCurrency(displayResult.monthlyCost)}</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Annual Energy Waste</div>
              <div className="result-tile-value">{formatNumber(displayResult.annualEnergyKWh, 0)} kWh</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Leak Power</div>
              <div className="result-tile-value">{formatNumber(displayResult.leakPowerKW)} kW</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Annual Operating Hours</div>
              <div className="result-tile-value">{formatNumber(displayResult.annualHours, 0)} h</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Leak Flow (CFM)</div>
              <div className="result-tile-value">{formatNumber(displayResult.leakFlowCFM)}</div>
            </div>
            {inputs.repairCost > 0 && displayResult.annualSavings > 0 && (
              <div className="result-tile">
                <div className="result-tile-label">Potential Annual Savings</div>
                <div className="result-tile-value text-green-700">{formatCurrency(displayResult.annualSavings)}</div>
              </div>
            )}
          </div>

          {/* Payback */}
          {inputs.repairCost > 0 && displayResult.annualSavings > 0 && (
            <div className="result-tile">
              <div className="result-tile-label">Estimated Payback</div>
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
