import type { LeakEntry, LeakStatus, RepairAccess } from "./types.ts";

export type RegisterSortKey = "tag" | "area" | "status" | "flow" | "access";

export interface RegisterFilter {
  query: string;
  area: string;
  status: LeakStatus | "";
  access: RepairAccess | "";
  sortKey: RegisterSortKey;
  sortDir: "asc" | "desc";
}

function haystack(entry: LeakEntry): string {
  return [
    entry.tag,
    entry.area,
    entry.exactLocation,
    entry.asset,
    entry.component,
    entry.problemDescription,
    entry.sourceReading,
    entry.status,
  ]
    .join(" ")
    .toLowerCase();
}

export function filterRegister(entries: LeakEntry[], filter: RegisterFilter): LeakEntry[] {
  const q = filter.query.trim().toLowerCase();
  const filtered = entries.filter((e) => {
    if (q && !haystack(e).includes(q)) return false;
    if (filter.area && e.area !== filter.area) return false;
    if (filter.status && e.status !== filter.status) return false;
    if (filter.access && e.repairAccess !== filter.access) return false;
    return true;
  });

  const dir = filter.sortDir === "desc" ? -1 : 1;
  return [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (filter.sortKey) {
      case "tag":
        cmp = a.tag.localeCompare(b.tag);
        break;
      case "area":
        cmp = a.area.localeCompare(b.area) || a.tag.localeCompare(b.tag);
        break;
      case "status":
        cmp = a.status.localeCompare(b.status) || a.tag.localeCompare(b.tag);
        break;
      case "flow":
        cmp = a.baselineFlow - b.baselineFlow;
        break;
      case "access":
        cmp = a.repairAccess.localeCompare(b.repairAccess) || a.tag.localeCompare(b.tag);
        break;
    }
    return cmp * dir;
  });
}

export function uniqueAreas(entries: LeakEntry[]): string[] {
  return [...new Set(entries.map((e) => e.area).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}
