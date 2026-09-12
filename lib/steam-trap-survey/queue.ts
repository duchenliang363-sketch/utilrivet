import type { TrapComputed } from "./types.ts";

function opportunityOf(t: TrapComputed): number {
  return t.stillLosing?.remainingOpportunity ?? t.estimated.annualCost;
}

export function compareQueue(a: TrapComputed, b: TrapComputed): number {
  const opp = opportunityOf(b) - opportunityOf(a);
  if (opp !== 0) return opp;
  return a.entry.tag.localeCompare(b.entry.tag);
}

function money(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function explainWhyAhead(a: TrapComputed, b: TrapComputed): string {
  if (opportunityOf(a) !== opportunityOf(b)) {
    return `Ranked ahead because estimated annual loss is ${money(opportunityOf(a))}, before ${b.entry.tag} at ${money(opportunityOf(b))}.`;
  }
  return `Tied on estimated annual loss; ordered by tag (${a.entry.tag} before ${b.entry.tag}).`;
}

export function rankRepairQueue(traps: TrapComputed[]) {
  const eligible = traps.filter((t) => t.inRepairQueue).sort(compareQueue);
  return eligible.map((computed, index) => ({
    computed,
    rank: index + 1,
    whyAhead:
      index < eligible.length - 1
        ? explainWhyAhead(computed, eligible[index + 1])
        : eligible.length === 1
          ? "Only trap currently in the repair queue."
          : "Last in the current repair queue after estimated annual loss and tag.",
  }));
}
