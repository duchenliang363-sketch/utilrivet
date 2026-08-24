import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { getActiveTools } from "@/lib/tools";
import ToolCard from "@/components/ToolCard";

export default function HomePage() {
  const activeTools = getActiveTools();

  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            {siteConfig.name}
          </h1>
          <p className="mt-4 text-lg sm:text-xl font-medium text-foreground">
            {siteConfig.slogan}
          </p>
          <p className="mt-3 text-sm sm:text-base text-muted max-w-lg">
            {siteConfig.description}
          </p>
          <div className="mt-8">
            <Link
              href="/tools"
              className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
            >
              Explore Tools
            </Link>
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-xl font-semibold text-foreground">Tools</h2>
        {activeTools.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
