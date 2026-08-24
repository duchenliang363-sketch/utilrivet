"use client";

import { useState } from "react";

export default function PercentageCalculator() {
  const [mode, setMode] = useState<"whatPct" | "whatVal" | "pctChange">("whatPct");
  const [valA, setValA] = useState("");
  const [valB, setValB] = useState("");
  const [result, setResult] = useState<string | null>(null);

  function calculate() {
    const a = parseFloat(valA);
    const b = parseFloat(valB);

    if (isNaN(a) || isNaN(b)) {
      setResult("Please enter valid numbers.");
      return;
    }

    switch (mode) {
      case "whatPct": {
        // What percentage is A of B?
        if (b === 0) {
          setResult("Cannot divide by zero.");
          return;
        }
        const pct = (a / b) * 100;
        setResult(`${round(pct)}%`);
        break;
      }
      case "whatVal": {
        // What is A% of B?
        const val = (a / 100) * b;
        setResult(`${round(val)}`);
        break;
      }
      case "pctChange": {
        // Percentage change from A to B
        if (a === 0) {
          setResult("Original value cannot be zero.");
          return;
        }
        const change = ((b - a) / Math.abs(a)) * 100;
        setResult(`${change >= 0 ? "+" : ""}${round(change)}%`);
        break;
      }
    }
  }

  function round(n: number): string {
    return Number.isInteger(n) ? n.toString() : n.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  }

  function reset() {
    setValA("");
    setValB("");
    setResult(null);
  }

  const labels = {
    whatPct: { a: "Value", b: "Total", action: "Calculate", placeholder: "e.g. 25 and 200" },
    whatVal: { a: "Percentage (%)", b: "Of value", action: "Calculate", placeholder: "e.g. 15 and 200" },
    pctChange: { a: "From", b: "To", action: "Calculate", placeholder: "e.g. 80 and 100" },
  };

  const current = labels[mode];

  return (
    <div className="space-y-5">
      {/* Mode selector */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setMode("whatPct"); reset(); }}
          className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            mode === "whatPct"
              ? "border-primary bg-primary/8 text-primary"
              : "border-border text-muted hover:text-foreground"
          }`}
        >
          X is what % of Y?
        </button>
        <button
          type="button"
          onClick={() => { setMode("whatVal"); reset(); }}
          className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            mode === "whatVal"
              ? "border-primary bg-primary/8 text-primary"
              : "border-border text-muted hover:text-foreground"
          }`}
        >
          What is X% of Y?
        </button>
        <button
          type="button"
          onClick={() => { setMode("pctChange"); reset(); }}
          className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            mode === "pctChange"
              ? "border-primary bg-primary/8 text-primary"
              : "border-border text-muted hover:text-foreground"
          }`}
        >
          % change from X to Y
        </button>
      </div>

      {/* Inputs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="val-a" className="block text-sm font-medium text-foreground mb-1">
            {current.a}
          </label>
          <input
            id="val-a"
            type="number"
            value={valA}
            onChange={(e) => setValA(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            placeholder={current.a}
          />
        </div>
        <div>
          <label htmlFor="val-b" className="block text-sm font-medium text-foreground mb-1">
            {current.b}
          </label>
          <input
            id="val-b"
            type="number"
            value={valB}
            onChange={(e) => setValB(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            placeholder={current.b}
          />
        </div>
      </div>

      {/* Action */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={calculate}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
        >
          {current.action}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-xs text-muted mb-1">Result</p>
          <p className="text-lg font-semibold text-foreground">{result}</p>
        </div>
      )}
    </div>
  );
}
