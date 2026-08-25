import type { ToolType } from "@/lib/tools";

/**
 * ToolBadge — lightweight type label (CALCULATOR / WORKFLOW / COMPARISON / CHECKER)
 * so the site does not read as "only calculators".
 */
export default function ToolBadge({ type }: { type: ToolType }) {
  return <span className="type-badge">{type}</span>;
}
