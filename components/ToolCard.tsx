import Link from "next/link";
import type { Tool } from "@/lib/tools";

// Simple linear icons per category
function CategoryIcon({ category }: { category: string }) {
  const props = {
    className: "h-4 w-4 text-gray-400",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.5,
  };

  switch (category) {
    case "Calculators":
      return (
        <svg {...props}>
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M8 6h8M8 10h2M12 10h2M16 10h0M8 14h2M12 14h2M16 14h0M8 18h8" strokeLinecap="round" />
        </svg>
      );
    case "Operations":
      return (
        <svg {...props}>
          <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 16l4-8 4 4 5-9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "Estimators":
      return (
        <svg {...props}>
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12h6M9 16h4" strokeLinecap="round" />
        </svg>
      );
    case "Compliance":
      return (
        <svg {...props}>
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "Finance":
      return (
        <svg {...props}>
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "Productivity":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
        </svg>
      );
  }
}

export default function ToolCard({ tool }: { tool: Tool }) {
  const isFeatured = tool.featured;

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={`card-hover block rounded-lg border p-5 ${
        isFeatured
          ? "border-l-[3px] border-l-primary border-t-border border-r-border border-b-border bg-accent-bg/30"
          : "border-border bg-background"
      }`}
    >
      {/* Top row: icon + category badge */}
      <div className="flex items-center justify-between">
        <CategoryIcon category={tool.category} />
        <span className="inline-flex items-center text-[11px] font-medium text-primary bg-primary-50 px-2 py-0.5 rounded-md tracking-wide uppercase">
          {tool.category}
        </span>
      </div>

      {/* Featured badge */}
      {isFeatured && (
        <span className="mt-3 inline-flex items-center text-[10px] font-semibold tracking-widest text-primary uppercase">
          Featured
        </span>
      )}

      {/* Title */}
      <h3 className={`mt-2 font-semibold text-foreground ${isFeatured ? "text-base" : "text-[15px]"}`}>
        {tool.name}
      </h3>

      {/* Description */}
      <p className="mt-1.5 text-sm text-muted leading-relaxed">{tool.description}</p>

      {/* CTA */}
      <div className="mt-4 flex items-center text-sm font-medium text-primary">
        Open Tool
        <svg className="ml-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
