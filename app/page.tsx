import Link from "next/link";
import type { Metadata } from "next";
import { getActiveTools, getToolBySlug } from "@/lib/tools";
import { getGuides } from "@/lib/guides";
import TrustStrip from "@/components/TrustStrip";
import CategorizedTools from "@/components/CategorizedTools";
import ToolCard from "@/components/ToolCard";
import RelatedGuides from "@/components/RelatedGuides";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

const SURVEY_SLUG = "compressed-air-leak-survey-report-builder";
const COST_SLUG = "compressed-air-leak-cost-calculator";

export default function HomePage() {
  const activeTools = getActiveTools();
  const featuredTool = activeTools.find((t) => t.featured);
  const surveyTool = getToolBySlug(SURVEY_SLUG);
  const costTool = getToolBySlug(COST_SLUG);
  const guides = getGuides();
  const categories = new Set(activeTools.map((tool) => tool.category)).size;

  return (
    <main>
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

      <TrustStrip />

      {featuredTool && (
        <section id="featured" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-14 sm:px-6 sm:pt-16 lg:px-8">
          <div className="rounded-2xl border border-primary-100 bg-accent-bg/60 p-6 sm:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
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
                  {featuredTool.description} Record tagged leaks, prioritize repairs, track re-tests,
                  and keep estimated opportunity separate from verified savings.
                </p>
                <div className="mt-6">
                  <Link href={`/tools/${featuredTool.slug}`} className="btn btn-primary">
                    Open Compressed Air Leak Survey
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
              <FeaturedPreview />
            </div>
          </div>
        </section>
      )}

      {surveyTool && costTool && (
        <section id="compressed-air" className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 sm:pt-16 lg:px-8">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl font-bold text-foreground">Compressed Air Tools</h2>
            <Link href="/guides" className="text-sm font-medium text-primary hover:underline">
              All compressed air guides
            </Link>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Survey leaks after they have been found, estimate the cost of a single leak, or use the
            field guides for the report, checklist, and cost formula.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <ToolCard tool={surveyTool} />
            <ToolCard tool={costTool} />
          </div>
          <RelatedGuides
            heading="Compressed Air Guides"
            guides={guides.map((guide) => ({
              href: guide.path,
              title: guide.title,
              description: guide.description,
            }))}
          />
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 sm:pt-16 lg:px-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold text-foreground">All Tools</h2>
          <span className="text-sm text-muted">
            {activeTools.length} tools · {categories} categories
          </span>
        </div>
        <div className="mt-5">
          <CategorizedTools />
        </div>
      </section>

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
              Current tools run in the browser. Survey and calculator data stay on this device unless
              you export a file.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeaturedPreview() {
  const rows = [
    { tag: "L-005", area: "Packaging", status: "Verified Closed", result: "$760 / yr" },
    { tag: "L-012", area: "Compressor room", status: "Open", result: "Est. $1,040" },
    { tag: "L-017", area: "Filling line", status: "Failed Re-test", result: "Not verified" },
    { tag: "L-021", area: "Warehouse", status: "Awaiting Re-test", result: "—" },
  ];

  return (
    <div className="rounded-xl border border-border bg-background p-4 shadow-sm sm:p-5" aria-hidden="true">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <span className="text-xs font-semibold text-foreground">Leak register</span>
        <span className="text-[11px] text-gray-400">Find → Record → Repair → Re-test</span>
      </div>
      <div className="mt-3 space-y-0.5">
        <div className="grid grid-cols-[0.7fr_1.1fr_1.2fr_0.9fr] gap-2 px-2 pb-2 text-[11px] font-semibold text-muted">
          <span>Tag</span>
          <span>Area</span>
          <span>Status</span>
          <span className="text-right">Result</span>
        </div>
        {rows.map((row) => (
          <div
            key={row.tag}
            className="grid grid-cols-[0.7fr_1.1fr_1.2fr_0.9fr] gap-2 rounded-lg px-2 py-2 text-[12px] odd:bg-surface/70"
          >
            <span className="font-medium text-foreground">{row.tag}</span>
            <span className="text-gray-600">{row.area}</span>
            <span className="text-foreground">{row.status}</span>
            <span className="text-right tabular-nums text-foreground">{row.result}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 border-t border-border pt-3 text-[11px] text-muted">
        Verified Result is counted only after a passing re-test. Failed Re-test is remaining
        opportunity.
      </p>
    </div>
  );
}
