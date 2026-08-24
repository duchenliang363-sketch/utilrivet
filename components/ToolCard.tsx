import Link from "next/link";
import type { Tool } from "@/lib/tools";

export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <div className="rounded-lg border border-border p-5 flex flex-col gap-3 hover:border-primary/40 transition-colors">
      <div>
        <span className="inline-block text-xs font-medium text-primary bg-primary/8 px-2 py-0.5 rounded">
          {tool.category}
        </span>
      </div>
      <h3 className="text-base font-semibold text-foreground">{tool.name}</h3>
      <p className="text-sm text-muted flex-1">{tool.description}</p>
      <Link
        href={`/tools/${tool.slug}`}
        className="inline-flex items-center text-sm font-medium text-primary hover:text-primary-hover transition-colors"
      >
        Open Tool
        <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
