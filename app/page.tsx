import Link from "next/link";
import type { Metadata } from "next";
import { getActiveTools } from "@/lib/tools";
import TrustStrip from "@/components/TrustStrip";
import CategorizedTools from "@/components/CategorizedTools";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  const activeTools = getActiveTools();
  const featuredTool = activeTools.find((t) => t.featured);

  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[760px] py-14 text-center sm:py-20">
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-foreground sm:text-[40px]">
            Practical tools for real work.
          </h1>
          <p className="mx-auto mt-4 max-w-[600px] text-base leading-relaxed text-muted sm:text-lg">
            Fast, focused tools for calculations, comparisons, reports and everyday business tasks.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/tools" className="btn btn-primary">
              Browse Tools
            </Link>
            <Link href="#featured" className="btn btn-secondary">
              Featured Tool
            </Link>
          </div>
          <p className="mt-6 text-[13px] text-muted">
            No signup · Browser-based · Fast · Privacy-friendly
          </p>
        </div>
      </section>

      {/* Trust Strip */}
      <TrustStrip />

      {/* Featured Tool */}
      {featuredTool && (
        <section id="featured" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-14 sm:px-6 sm:pt-16 lg:px-8">
          <div className="rounded-2xl border border-primary-100 bg-accent-bg/60 p-6 sm:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
              {/* Left: info */}
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                    Featured
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    {featuredTool.category}
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-bold text-foreground sm:text-2xl">
                  {featuredTool.name}
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-600 sm:text-[15px]">
                  {featuredTool.description} Find missing items, unclear scope and major differences
                  before choosing a supplier.
                </p>
                <div className="mt-6">
                  <Link href={`/tools/${featuredTool.slug}`} className="btn btn-primary">
                    Open Quote Comparator
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Right: static product preview */}
              <FeaturedPreview />
            </div>
          </div>
        </section>
      )}

      {/* Tool Categories + All Tools */}
      <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 sm:pt-16 lg:px-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold text-foreground">All Tools</h2>
          <span className="text-sm text-muted">
            {activeTools.length} tools · 3 categories
          </span>
        </div>
        <div className="mt-5">
          <CategorizedTools />
        </div>
      </section>

      {/* Why UtilRivet */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <h2 className="text-xl font-bold text-foreground">Built for getting work done.</h2>
        <div className="mt-6 grid gap-8 sm:grid-cols-3 sm:gap-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Focused</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Each tool is designed around one specific task.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Fast</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Open it, enter your data and get a result.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Privacy-friendly</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Many tools process your data directly in the browser.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

/**
 * Static, lightweight UI mock of the Quote Comparator result matrix.
 * Pure markup — no screenshots, no images.
 */
function FeaturedPreview() {
  const rows = [
    { label: "Total", values: ["$84,000", "$72,000", "$79,500"], best: 1 },
    { label: "Lead Time", values: ["45 days", "60 days", "50 days"], best: 0 },
    { label: "Warranty", values: ["24 months", "12 months", "18 months"], best: 0 },
    { label: "Installation", values: ["Included", "Missing", "Unclear"], best: 0 },
  ];

  return (
    <div className="rounded-xl border border-border bg-background p-4 shadow-sm sm:p-5" aria-hidden="true">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <span className="text-xs font-semibold text-foreground">Apples-to-Apples Comparison</span>
        <span className="text-[11px] text-gray-400">3 suppliers</span>
      </div>
      <div className="mt-3 space-y-0.5">
        <div className="grid grid-cols-[1.1fr_1fr_1fr_1fr] gap-2 px-2 pb-2 text-[11px] font-semibold text-muted">
          <span>Item</span>
          <span className="text-right">Supplier A</span>
          <span className="text-right">Supplier B</span>
          <span className="text-right">Supplier C</span>
        </div>
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[1.1fr_1fr_1fr_1fr] gap-2 rounded-lg px-2 py-2 text-[12px] odd:bg-surface/70"
          >
            <span className="text-gray-600">{row.label}</span>
            {row.values.map((value, i) => (
              <span
                key={i}
                className={`text-right tabular-nums ${
                  i === row.best ? "font-semibold text-primary" : "text-foreground"
                }`}
              >
                {value}
              </span>
            ))}
          </div>
        ))}
      </div>
      <p className="mt-3 border-t border-border pt-3 text-[11px] text-muted">
        Lowest price is not always the best quote — compare scope, not just totals.
      </p>
    </div>
  );
}
