"use client";

import { useState, useRef } from "react";
import {
  calculateCondensateReturnSavings,
  validateInputs,
  fromLbHr,
  type FlowUnit,
  type TempUnit,
  type CondensateReturnInputs,
  type CondensateReturnResult,
} from "@/lib/condensate-return/engine";

import EmptyState from "@/components/EmptyState";

const DEFAULTS: CondensateReturnInputs = {
  steamProduction: 10000,
  flowUnit: "lb/hr",
  currentReturnRate: 40,
  targetReturnRate: 75,
  hoursPerDay: 16,
  daysPerYear: 300,
  condensateTemp: 180,
  tempUnit: "°F",
  makeupWaterTemp: 60,
  boilerEfficiency: 82,
  fuelCost: 8.0,
  waterCost: 4.0,
  sewerCost: 5.0,
  projectCost: 25000,
};

function formatCurrency(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "$0";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatNumber(n: number, decimals = 1): string {
  if (!isFinite(n) || isNaN(n)) return "0";
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

function formatPayback(months: number): string {
  if (months < 1) return "Less than 1 month";
  if (months < 12) return `${months.toFixed(1)} months`;
  const years = Math.floor(months / 12);
  const remainingMonths = Math.round(months % 12);
  if (remainingMonths === 0) return `${years} year${years > 1 ? "s" : ""}`;
  return `${years}y ${remainingMonths}m`;
}

const inputClass = "field-input";
const selectClass = "field-select";

export default function CondensateReturnSavingsCalculator() {
  const [inputs, setInputs] = useState<CondensateReturnInputs>({ ...DEFAULTS });
  const [result, setResult] = useState<CondensateReturnResult | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Compute result for display (derived state, no useEffect needed)
  const validationErrors = hasCalculated ? validateInputs(inputs) : [];
  const displayResult =
    hasCalculated && validationErrors.length === 0
      ? calculateCondensateReturnSavings(inputs)
      : result;

  const update = (
    key: keyof CondensateReturnInputs,
    value: number | FlowUnit | TempUnit
  ) => {
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
    setResult(calculateCondensateReturnSavings(inputs));
    setHasCalculated(true);
    scrollToResults();
  };

  const handleExample = () => {
    setInputs({ ...DEFAULTS });
    setResult(calculateCondensateReturnSavings({ ...DEFAULTS }));
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
      {/* How It Works */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-start gap-2 text-xs text-muted">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-semibold shrink-0">
            1
          </span>
          <span>Enter your steam production and current condensate return rate</span>
        </div>
        <div className="flex items-start gap-2 text-xs text-muted">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-semibold shrink-0">
            2
          </span>
          <span>Enter the target return rate and utility costs</span>
        </div>
        <div className="flex items-start gap-2 text-xs text-muted">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-semibold shrink-0">
            3
          </span>
          <span>See estimated fuel, water and sewer savings</span>
        </div>
      </div>

      {/* Input Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Steam Production */}
        <div>
          <label className="field-label">
            Steam Production
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="any"
              value={inputs.steamProduction}
              onChange={(e) =>
                update("steamProduction", parseFloat(e.target.value) || 0)
              }
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

        {/* Condensate Return Rates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">
              Current Return (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={inputs.currentReturnRate}
              onChange={(e) =>
                update("currentReturnRate", parseFloat(e.target.value) || 0)
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="field-label">
              Target Return (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={inputs.targetReturnRate}
              onChange={(e) =>
                update("targetReturnRate", parseFloat(e.target.value) || 0)
              }
              className={inputClass}
            />
          </div>
        </div>

        {/* Operating Hours */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">
              Hours / day
            </label>
            <input
              type="number"
              min="0"
              max="24"
              value={inputs.hoursPerDay}
              onChange={(e) =>
                update("hoursPerDay", parseFloat(e.target.value) || 0)
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="field-label">
              Days / year
            </label>
            <input
              type="number"
              min="0"
              max="366"
              value={inputs.daysPerYear}
              onChange={(e) =>
                update("daysPerYear", parseFloat(e.target.value) || 0)
              }
              className={inputClass}
            />
          </div>
        </div>

        {/* Condensate Temperature */}
        <div>
          <label className="field-label">
            Condensate Temperature
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              value={inputs.condensateTemp}
              onChange={(e) =>
                update("condensateTemp", parseFloat(e.target.value) || 0)
              }
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

        {/* Makeup Water Temperature */}
        <div>
          <label className="field-label">
            Makeup Water Temperature
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              value={inputs.makeupWaterTemp}
              onChange={(e) =>
                update("makeupWaterTemp", parseFloat(e.target.value) || 0)
              }
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
          <label className="field-label">
            Boiler Efficiency (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={inputs.boilerEfficiency}
            onChange={(e) =>
              update("boilerEfficiency", parseFloat(e.target.value) || 0)
            }
            className={inputClass}
          />
        </div>

        {/* Fuel Cost */}
        <div>
          <label className="field-label">
            Fuel Cost ($/MMBtu)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={inputs.fuelCost}
            onChange={(e) => update("fuelCost", parseFloat(e.target.value) || 0)}
            className={inputClass}
          />
        </div>

        {/* Water Cost */}
        <div>
          <label className="field-label">
            Water Cost ($/1,000 gal)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={inputs.waterCost}
            onChange={(e) => update("waterCost", parseFloat(e.target.value) || 0)}
            className={inputClass}
          />
          <p className="field-help">Optional. Leave 0 to exclude.</p>
        </div>

        {/* Sewer Cost */}
        <div>
          <label className="field-label">
            Sewer / Wastewater Cost ($/1,000 gal)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={inputs.sewerCost}
            onChange={(e) => update("sewerCost", parseFloat(e.target.value) || 0)}
            className={inputClass}
          />
          <p className="field-help">Optional. Leave 0 to exclude.</p>
        </div>

        {/* Project Cost */}
        <div>
          <label className="field-label">
            Project / Upgrade Cost ($)
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={inputs.projectCost}
            onChange={(e) =>
              update("projectCost", parseFloat(e.target.value) || 0)
            }
            className={inputClass}
          />
          <p className="field-help">
            Optional. Enter to calculate payback period.
          </p>
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
          hint="Enter your steam system parameters or try the example to see estimated savings."
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
              <span className="result-number">
                {formatCurrency(displayResult.totalAnnualSavingsUSD)}
              </span>
              <span className="text-sm text-muted">/ year</span>
            </div>
          </div>

          {/* Payback Period (if project cost provided) */}
          {displayResult.paybackMonths !== null && (
            <div className="result-tile">
              <div className="result-tile-label">Estimated Payback</div>
              <div className="text-2xl font-bold text-foreground">
                {formatPayback(displayResult.paybackMonths)}
              </div>
            </div>
          )}

          {/* Detail grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="result-tile">
              <div className="result-tile-label">Fuel Savings</div>
              <div className="result-tile-value text-green-700">
                {formatCurrency(displayResult.fuelSavingsUSD)}
              </div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Water Savings</div>
              <div className="result-tile-value text-green-700">
                {formatCurrency(displayResult.waterSavingsUSD)}
              </div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Sewer Savings</div>
              <div className="result-tile-value text-green-700">
                {formatCurrency(displayResult.sewerSavingsUSD)}
              </div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">
                Additional Condensate Returned
              </div>
              <div className="result-tile-value">
                {formatNumber(fromLbHr(displayResult.additionalCondensateLb, flowUnit), 0)}{" "}
                {flowUnit.replace("/hr", "")}/year
              </div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Water Saved</div>
              <div className="result-tile-value">
                {formatNumber(displayResult.waterSavedGal, 0)} gal
              </div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">Recovered Energy</div>
              <div className="result-tile-value">
                {formatNumber(displayResult.recoveredHeatMMBtu)} MMBtu
              </div>
            </div>
            <div className="result-tile">
              <div className="result-tile-label">
                Annual Operating Hours
              </div>
              <div className="result-tile-value">
                {formatNumber(displayResult.annualHours, 0)} h
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-muted border-t border-border pt-4">
            This calculator provides a preliminary estimate. Actual savings depend
            on steam pressure, flash steam, condensate quality, boiler operation,
            water treatment, and system design.
          </div>
        </div>
      )}
    </div>
  );
}
