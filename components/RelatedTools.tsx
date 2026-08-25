import Link from "next/link";
import type { Tool } from "@/lib/tools";

export default function RelatedTools({ tools }: { tools: Tool[] }) {
  if (tools.length === 0) return null;

  return (
    <section aria-label="Related tools">
      <h2 className="text-xl font-bold text-foreground">Related tools</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="card-hover flex flex-col rounded-xl border border-border bg-background p-4"
          >
            <p className="text-sm font-semibold leading-snug text-foreground">{tool.name}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted line-clamp-2">
              {tool.description}
            </p>
            <span className="mt-3 flex items-center text-[13px] font-medium text-primary">
              Open Tool
              <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
