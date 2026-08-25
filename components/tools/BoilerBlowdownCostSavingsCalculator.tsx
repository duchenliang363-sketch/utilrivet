"use client";

import { useState, useRef } from "react";
import {
  calculateBlowdownSavings,
  validateInputs,
  fromLbHr,
  type FlowUnit,
  type PressureUnit,
  type TempUnit,
  type BlowdownInputs,
  type BlowdownResult,
} from "@/lib/boiler-blowdown/engine";

import EmptyState from "@/components/EmptyState";

const DEFAULTS: BlowdownInputs = {
  steamProduction: 10000,
  flowUnit: "lb/hr",
  currentBlowdownRate: 10,
  targetBlowdownRate: 5,
  hoursPerDay: 16,
  daysPerYear: 250,
  boilerPressure: 150,
  pressureUnit: "psi",
  feedwaterTemp: 180,
  tempUnit: "°F",
  boilerEfficiency: 80,
  fuelCost: 8,
  waterCost: 8,
};

function formatCurrency(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "$0";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatNumber(n: number, decimals = 1): string {
  if (!isFinite(n) || isNaN(n)) return "0";
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

const inputClass = "field-input";
const selectClass = "field-select";

export default function BoilerBlowdownCostSavingsCalculator() {
  const [inputs, setInputs] = useState<BlowdownInputs>({ ...DEFAULTS });
  const [result, setResult] = useState<BlowdownResult | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Compute result for display (derived state, no useEffect needed)
  const validationErrors = hasCalculated ? validateInputs(inputs) : [];
  const displayResult =
    hasCalculated && validationErrors.length === 0 ? calculateBlowdownSavings(inputs) : result;

  const update = (key: keyof BlowdownInputs, value: number | FlowUnit | PressureUnit | TempUnit) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const scrollToResults = () => {
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleCalculate = () => {
    if (validateInputs(inputs).length > 0) {
      setResult(null);
      return;
    }
    setResult(calculateBlowdownSavings(inputs));
    setHasCalculated(true);
    scrollToResults();
  };

  const handleExample = () => {
    setInputs({ ...DEFAULTS });
    setResult(calculateBlowdownSavings({ ...DEFAULTS }));
    setHasCalculated(true);
    scrollToResults();
  };

  const handleReset = () => {
    setInputs({ ...DEFAULTS });
    setResult(null);
    setHasCalculated(false);
  };

  const flowUnit = inputs.flowUnit;

  return (
    <div className="space-y-6">
      {/* Input Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Steam Production */}
        <div>
          <label className="field-label">Steam Production</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="any"
              value={inputs.steamProduction}
              onChange={(e) => update("steamProduction", parseFloat(e.target.value) || 0)}
              className={"flex-1 " + inputClass}
            />
            <select
              value={inputs.flowUnit}
              onChange={(e) => update("flowUnit", e.target.value as FlowUnit)}
              className={selectClass}
            >
              <option value="lb/hr">lb/hr</option>
              <option value="kg/hr">kg/hr</option>
            </select>
          </div>
        </div>

        {/* Blowdown Rates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Current Blowdown (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={inputs.currentBlowdownRate}
              onChange={(e) => update("currentBlowdownRate", parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="field-label">Target Blowdown (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={inputs.targetBlowdownRate}
              onChange={(e) => update("targetBlowdownRate", parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
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
              className={inputClass}
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
              className={inputClass}
            />
          </div>
        </div>

        {/* Boiler Pressure */}
        <div>
          <label className="field-label">Boiler Pressure</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="any"
              value={inputs.boilerPressure}
              onChange={(e) => update("boilerPressure", parseFloat(e.target.value) || 0)}
              className={"flex-1 " + inputClass}
            />
            <select
              value={inputs.pressureUnit}
              onChange={(e) => update("pressureUnit", e.target.value as PressureUnit)}
              className={selectClass}
            >
              <option value="psi">psi</option>
              <option value="bar">bar</option>
            </select>
          </div>
        </div>

        {/* Feedwater Temperature */}
        <div>
          <label className="field-label">Feedwater Temperature</label>
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              value={inputs.feedwaterTemp}
              onChange={(e) => update("feedwaterTemp", parseFloat(e.target.value) || 0)}
              className={"flex-1 " + inputClass}
            />
            <select
              value={inputs.tempUnit}
              onChange={(e) => update("tempUnit", e.target.value as TempUnit)}
              className={selectClass}
            >
              <option value="°F">°F</option>
              <option value="°C">°C</option>
            </select>
          </div>
        </div>

        {/* Boiler Efficiency */}
        <div>
          <label className="field-label">Boiler Efficiency (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={inputs.boilerEfficiency}
            onChange={(e) => update("boilerEfficiency", parseFloat(e.target.value) || 0)}
            className={inputClass}
          />
        </div>

        {/* Fuel Cost */}
        <div>
          <label className="field-label">Fuel Cost ($/MMBtu)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={inputs.fuelCost}
            onChange={(e) => update("fuelCost", parseFloat(e.target.value) || 0)}
            className={inputClass}
          />
        </div>

        {/* Water + Sewer Cost */}
        <div>
          <label className="field-label">Water + Sewer Cost ($/1,000 gal)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={inputs.waterCost}
            onChange={(e) => update("waterCost", parseFloat(e.target.value) || 0)}
            className={inputClass}
          />
          <p className="field-help">Optional. Leave 0 to exclude water savings.</p>
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
          hint="Enter your boiler parameters or try the example to see estimated savings."
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
            <h3 className="result-label">Estimated Annual Savings</h3>
            <div className="flex items-baseline gap-2">
              <span className="result-number">{formatCurrency(displayResult.totalAnnualSavingsUSD)}</span>
              <span className="text-sm text-muted">/ year</span>
            </div>
          </div>

          {/* Detail grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="result-tile">
              <div className="result-tile-label">Estimated Fuel Savings</div>
              <div className="result-tile-value text-green-700">{formatCurrency(displayResult.fuelSavingsUSD)}</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Estimated Water/Sewer Savings</div>
              <div className="result-tile-value text-green-700">{formatCurrency(displayResult.waterSavingsUSD)}</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Annual Heat/Energy Saved</div>
              <div className="result-tile-value">{formatNumber(displayResult.annualHeatSavedMMBtu)} MMBtu</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Annual Water Saved</div>
              <div className="result-tile-value">{formatNumber(displayResult.annualWaterSavedGal, 0)} gal</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Blowdown Reduction</div>
              <div className="result-tile-value">{formatNumber(fromLbHr(displayResult.blowdownReductionLbHr, flowUnit))} {flowUnit}</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Current Blowdown Flow</div>
              <div className="result-tile-value">{formatNumber(fromLbHr(displayResult.currentBlowdownLbHr, flowUnit))} {flowUnit}</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Target Blowdown Flow</div>
              <div className="result-tile-value">{formatNumber(fromLbHr(displayResult.targetBlowdownLbHr, flowUnit))} {flowUnit}</div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Annual Operating Hours</div>
              <div className="result-tile-value">{formatNumber(displayResult.annualHours, 0)} h</div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-muted border-t border-border pt-4">
            Estimates are intended for preliminary energy and cost analysis. Actual boiler performance depends on operating conditions, water chemistry and system design.
          </div>
        </div>
      )}
    </div>
  );
}
