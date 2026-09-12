import type { TrapEntry, TrapStatus } from "./types.ts";

export type RegisterSortKey = "tag" | "area" | "status" | "diagnosis";

export interface RegisterFilter {
  query: string;
  area: string;
  status: TrapStatus | "";
  sortKey: RegisterSortKey;
  sortDir: "asc" | "desc";
}

function haystack(entry: TrapEntry): string {
  return [
    entry.tag,
    entry.area,
    entry.location,
    entry.application,
    entry.diagnosis,
    entry.status,
    entry.manufacturer,
    entry.model,
  ]
    .join(" ")
    .toLowerCase();
}

export function filterRegister(entries: TrapEntry[], filter: RegisterFilter): TrapEntry[] {
  const q = filter.query.trim().toLowerCase();
  const filtered = entries.filter((e) => {
    if (q && !haystack(e).includes(q)) return false;
    if (filter.area && e.area !== filter.area) return false;
    if (filter.status && e.status !== filter.status) return false;
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
      case "diagnosis":
        cmp = a.diagnosis.localeCompare(b.diagnosis) || a.tag.localeCompare(b.tag);
        break;
    }
    return cmp * dir;
  });
}

export function uniqueAreas(entries: TrapEntry[]): string[] {
  return [...new Set(entries.map((e) => e.area).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}
