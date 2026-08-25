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

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";
const selectClass =
  "rounded-lg border border-border bg-background px-2 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";

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
      {/* Privacy notice */}
      <div className="flex items-start gap-2 text-xs text-muted bg-gray-50 border border-border rounded-lg p-3">
        <svg className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z" />
        </svg>
        <span>Calculations run locally in your browser. No input data is uploaded or stored.</span>
      </div>

      {/* Input Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Steam Production */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Steam Production</label>
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
            <label className="block text-sm font-medium text-foreground mb-1">Current Blowdown (%)</label>
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
            <label className="block text-sm font-medium text-foreground mb-1">Target Blowdown (%)</label>
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
            <label className="block text-sm font-medium text-foreground mb-1">Hours / day</label>
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
            <label className="block text-sm font-medium text-foreground mb-1">Days / year</label>
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
          <label className="block text-sm font-medium text-foreground mb-1">Boiler Pressure</label>
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
          <label className="block text-sm font-medium text-foreground mb-1">Feedwater Temperature</label>
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
          <label className="block text-sm font-medium text-foreground mb-1">Boiler Efficiency (%)</label>
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
          <label className="block text-sm font-medium text-foreground mb-1">Fuel Cost ($/MMBtu)</label>
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
          <label className="block text-sm font-medium text-foreground mb-1">Water + Sewer Cost ($/1,000 gal)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={inputs.waterCost}
            onChange={(e) => update("waterCost", parseFloat(e.target.value) || 0)}
            className={inputClass}
          />
          <p className="text-xs text-muted mt-1">Optional. Leave 0 to exclude water savings.</p>
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
          Enter your boiler parameters or try the example to see estimated savings.
        </p>
      )}

      {/* Results */}
      {displayResult && hasCalculated && (
        <div ref={resultsRef} className="space-y-6">
          {/* Main result */}
          <div className="rounded-lg border border-l-[3px] border-l-primary border-border bg-accent-bg/30 p-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">Estimated Annual Savings</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-foreground">{formatCurrency(displayResult.totalAnnualSavingsUSD)}</span>
              <span className="text-sm text-muted">/ year</span>
            </div>
          </div>

          {/* Detail grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs text-muted mb-1">Estimated Fuel Savings</div>
              <div className="text-lg font-semibold text-green-700">{formatCurrency(displayResult.fuelSavingsUSD)}</div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs text-muted mb-1">Estimated Water/Sewer Savings</div>
              <div className="text-lg font-semibold text-green-700">{formatCurrency(displayResult.waterSavingsUSD)}</div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs text-muted mb-1">Annual Heat/Energy Saved</div>
              <div className="text-lg font-semibold text-foreground">{formatNumber(displayResult.annualHeatSavedMMBtu)} MMBtu</div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs text-muted mb-1">Annual Water Saved</div>
              <div className="text-lg font-semibold text-foreground">{formatNumber(displayResult.annualWaterSavedGal, 0)} gal</div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs text-muted mb-1">Blowdown Reduction</div>
              <div className="text-lg font-semibold text-foreground">{formatNumber(fromLbHr(displayResult.blowdownReductionLbHr, flowUnit))} {flowUnit}</div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs text-muted mb-1">Current Blowdown Flow</div>
              <div className="text-lg font-semibold text-foreground">{formatNumber(fromLbHr(displayResult.currentBlowdownLbHr, flowUnit))} {flowUnit}</div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs text-muted mb-1">Target Blowdown Flow</div>
              <div className="text-lg font-semibold text-foreground">{formatNumber(fromLbHr(displayResult.targetBlowdownLbHr, flowUnit))} {flowUnit}</div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="text-xs text-muted mb-1">Annual Operating Hours</div>
              <div className="text-lg font-semibold text-foreground">{formatNumber(displayResult.annualHours, 0)} h</div>
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
