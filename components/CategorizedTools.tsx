import Link from "next/link";
import { categories, categorySlug, getToolsByCategory } from "@/lib/tools";
import ToolCard from "@/components/ToolCard";

/**
 * Lightweight category navigation (anchor links — no JS required)
 * plus one section per category. Used on the homepage and /tools.
 */
export default function CategorizedTools() {
  return (
    <div>
      {/* Category filter — simple anchor navigation */}
      <nav aria-label="Tool categories" className="flex flex-wrap gap-2">
        <Link
          href="#all-tools"
          className="inline-flex h-11 items-center rounded-full border border-border-strong bg-background px-4 text-[13px] font-medium text-foreground transition-colors hover:border-gray-400 hover:bg-surface"
        >
          All
        </Link>
        {categories.map((category) => (
          <Link
            key={category}
            href={`#${categorySlug(category)}`}
            className="inline-flex h-11 items-center rounded-full border border-border bg-background px-4 text-[13px] font-medium text-muted transition-colors hover:border-gray-400 hover:text-foreground"
          >
            {category}
          </Link>
        ))}
      </nav>

      {/* Category sections */}
      <div id="all-tools" className="mt-8 scroll-mt-24 space-y-12">
        {categories.map((category) => {
          const categoryTools = getToolsByCategory(category);
          if (categoryTools.length === 0) return null;
          return (
            <section
              key={category}
              id={categorySlug(category)}
              aria-label={category}
              className="scroll-mt-24"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted">
                  {category}
                </h3>
                <span className="text-[13px] text-gray-400">
                  {categoryTools.length} tool{categoryTools.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categoryTools.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
