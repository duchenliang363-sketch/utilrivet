import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { getActiveTools } from "@/lib/tools";
import ToolCard from "@/components/ToolCard";

export default function HomePage() {
  const activeTools = getActiveTools();
  const featuredTool = activeTools.find((t) => t.featured);

  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 pb-10 sm:pt-16 sm:pb-12">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {siteConfig.name}
          </h1>
          <p className="mt-3 text-lg sm:text-xl font-medium text-foreground">
            {siteConfig.slogan}
          </p>
          <p className="mt-2 text-sm text-muted">
            Free tools for purchasing, manufacturing and everyday work.
          </p>
          <p className="mt-1.5 text-sm text-muted max-w-lg">
            Simple, focused tools built to save time, reduce mistakes and make everyday work easier.
          </p>
          <div className="mt-6">
            <Link
              href="/tools"
              className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
            >
              Explore Tools
              <svg className="ml-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Tool */}
      {featuredTool && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-10">
          <div className="rounded-xl border border-l-[3px] border-l-primary border-border bg-accent-bg/30 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-semibold tracking-widest text-primary uppercase">
                Featured
              </span>
              <span className="text-[11px] font-medium text-primary bg-primary-50 px-2 py-0.5 rounded-md tracking-wide uppercase">
                {featuredTool.category}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {featuredTool.name}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted max-w-xl leading-relaxed">
              {featuredTool.description} Find missing items, unclear scope and major differences before choosing a supplier.
            </p>
            <div className="mt-5">
              <Link
                href={`/tools/${featuredTool.slug}`}
                className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
              >
                Open Quote Comparator
                <svg className="ml-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* All Tools */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">All Tools</h2>
          <span className="text-sm text-muted">{activeTools.length} tool{activeTools.length !== 1 ? "s" : ""}</span>
        </div>
        {activeTools.length > 0 ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">New tools are being added.</p>
        )}
      </section>
    </main>
  );
}
