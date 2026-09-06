import type { LeakComputed, OperationalImpact, RankedLeak, RepairAccess, Urgency } from "./types.ts";

const URGENCY_RANK: Record<Urgency, number> = { Immediate: 0, High: 1, Medium: 2, Low: 3 };
const IMPACT_RANK: Record<OperationalImpact, number> = { Critical: 0, High: 1, Medium: 2, Low: 3, None: 4 };
const ACCESS_RANK: Record<RepairAccess, number> = {
  Easy: 0,
  Moderate: 1,
  Difficult: 2,
  Restricted: 3,
  "Shutdown Required": 4,
};

function opportunityOf(l: LeakComputed): number {
  return l.estimated.opportunity;
}

function paybackOf(l: LeakComputed): number | null {
  return l.paybackMonths;
}

export function compareQueue(a: LeakComputed, b: LeakComputed): number {
  const urgency = URGENCY_RANK[a.entry.urgency] - URGENCY_RANK[b.entry.urgency];
  if (urgency !== 0) return urgency;
  const impact = IMPACT_RANK[a.entry.operationalImpact] - IMPACT_RANK[b.entry.operationalImpact];
  if (impact !== 0) return impact;
  const access = ACCESS_RANK[a.entry.repairAccess] - ACCESS_RANK[b.entry.repairAccess];
  if (access !== 0) return access;
  const opp = opportunityOf(b) - opportunityOf(a);
  if (opp !== 0) return opp;
  const pa = paybackOf(a);
  const pb = paybackOf(b);
  if (pa === null && pb === null) return a.entry.tag.localeCompare(b.entry.tag);
  if (pa === null) return 1;
  if (pb === null) return -1;
  if (pa !== pb) return pa - pb;
  return a.entry.tag.localeCompare(b.entry.tag);
}

function money(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function explainWhyAhead(a: LeakComputed, b: LeakComputed): string {
  if (a.entry.urgency !== b.entry.urgency) {
    return `Ranked ahead because urgency is ${a.entry.urgency}, before ${b.entry.tag} at ${b.entry.urgency}.`;
  }
  if (a.entry.operationalImpact !== b.entry.operationalImpact) {
    return `Tied on urgency (${a.entry.urgency}); ranked ahead because operational impact is ${a.entry.operationalImpact}, before ${b.entry.tag} at ${b.entry.operationalImpact}.`;
  }
  if (a.entry.repairAccess !== b.entry.repairAccess) {
    return `Tied on urgency and operational impact; ranked ahead because repair access is ${a.entry.repairAccess}, before ${b.entry.tag} at ${b.entry.repairAccess}.`;
  }
  if (opportunityOf(a) !== opportunityOf(b)) {
    return `Tied through repair access; ranked ahead because annual cost opportunity is ${money(opportunityOf(a))}, before ${b.entry.tag} at ${money(opportunityOf(b))}.`;
  }
  const pa = paybackOf(a);
  const pb = paybackOf(b);
  if (pa !== null && pb !== null && pa !== pb) {
    return `Tied through annual cost opportunity; ranked ahead because payback is ${pa.toFixed(1)} months, before ${b.entry.tag} at ${pb.toFixed(1)} months.`;
  }
  if (pa !== null && pb === null) {
    return `Tied through annual cost opportunity; ranked ahead because ${a.entry.tag} has a payback figure and ${b.entry.tag} does not.`;
  }
  return `Tied on the ranking keys; ordered by tag (${a.entry.tag} before ${b.entry.tag}).`;
}

export function rankRepairQueue(leaks: LeakComputed[]): RankedLeak[] {
  const eligible = leaks.filter((l) => l.inRepairQueue).sort(compareQueue);
  return eligible.map((computed, index) => ({
    computed,
    rank: index + 1,
    whyAhead:
      index < eligible.length - 1
        ? explainWhyAhead(computed, eligible[index + 1])
        : eligible.length === 1
          ? "Only leak currently in the repair queue."
          : "Last in the current repair queue after urgency, operational impact, repair access, annual cost opportunity, and payback.",
  }));
}
