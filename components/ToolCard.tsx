import Link from "next/link";
import type { Tool } from "@/lib/tools";
import ToolBadge from "@/components/ToolBadge";

/**
 * Tool Card V2 — unified card for every tool.
 * Category label, type badge, name (max 2 lines), description (max 3 lines), CTA.
 */
export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="card-hover flex h-full flex-col rounded-[13px] border border-border bg-background p-6"
    >
      {/* Top row: category label + type badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          {tool.category}
        </span>
        <ToolBadge type={tool.toolType} />
      </div>

      {/* Title */}
      <h3 className="mt-3 text-[15px] font-semibold leading-snug text-foreground line-clamp-2">
        {tool.name}
      </h3>

      {/* Description */}
      <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-3">{tool.description}</p>

      {/* CTA */}
      <span className="mt-auto flex items-center pt-5 text-sm font-medium text-primary">
        Open Tool
        <svg className="ml-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </span>
    </Link>
  );
}
