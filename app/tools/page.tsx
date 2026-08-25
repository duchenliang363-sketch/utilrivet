import type { Metadata } from "next";
import CategorizedTools from "@/components/CategorizedTools";

export const metadata: Metadata = {
  title: "Tools",
  description: "Browse all free online tools on UtilRivet. Calculators, checkers, comparisons and workflow tools for business and manufacturing.",
};

export default function ToolsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <h1 className="text-[26px] font-bold tracking-tight text-foreground sm:text-3xl">Tools</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
        Practical tools for purchasing, manufacturing and everyday work. Pick a
        category or browse everything below.
      </p>

      <div className="mt-8">
        <CategorizedTools />
      </div>
    </main>
  );
}
