import type { Metadata } from "next";
import { getActiveTools } from "@/lib/tools";
import ToolCard from "@/components/ToolCard";

export const metadata: Metadata = {
  title: "Tools",
  description: "Browse all free online tools on UtilRivet. Calculators, estimators, compliance tools, and more.",
};

export default function ToolsPage() {
  const activeTools = getActiveTools();

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Tools</h1>
      <p className="mt-2 text-sm text-muted">
        Practical tools for everyday work.
      </p>

      {activeTools.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted">New tools are being added.</p>
      )}
    </main>
  );
}
