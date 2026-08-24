import Link from "next/link";
import type { Tool } from "@/lib/tools";

export default function RelatedTools({ tools }: { tools: Tool[] }) {
  if (tools.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-foreground">Related Tools</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="rounded-lg border border-border p-4 hover:border-primary/40 transition-colors"
          >
            <p className="text-sm font-semibold text-foreground">{tool.name}</p>
            <p className="mt-1 text-xs text-muted">{tool.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
