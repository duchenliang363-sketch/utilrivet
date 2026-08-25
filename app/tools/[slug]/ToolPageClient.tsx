"use client";

import type { Tool } from "@/lib/tools";
import { getToolContent } from "@/lib/tool-content";
import ToolLayout from "@/components/ToolLayout";
import FAQ from "@/components/FAQ";
import RelatedTools from "@/components/RelatedTools";
import PercentageCalculator from "@/components/tools/PercentageCalculator";
import QuoteComparator from "@/components/tools/QuoteComparator";
import BusinessDocumentDifferenceChecker from "@/components/tools/BusinessDocumentDifferenceChecker";
import CompressedAirLeakCostCalculator from "@/components/tools/CompressedAirLeakCostCalculator";

interface ToolPageClientProps {
  tool: Tool;
  relatedTools: Tool[];
}

const toolComponentMap: Record<string, React.ComponentType> = {
  "percentage-calculator": PercentageCalculator,
  "production-line-quote-comparator": QuoteComparator,
  "business-document-difference-checker": BusinessDocumentDifferenceChecker,
  "compressed-air-leak-cost-calculator": CompressedAirLeakCostCalculator,
};

export default function ToolPageClient({ tool, relatedTools }: ToolPageClientProps) {
  const content = getToolContent(tool.slug);
  const ToolComponent = toolComponentMap[tool.slug];

  if (!content || !ToolComponent) {
    return (
      <ToolLayout name={tool.name} subtitle={tool.description}>
        <p className="text-sm text-muted">This tool is coming soon.</p>
      </ToolLayout>
    );
  }

  const seoContent = (
    <div className="space-y-6">
      {content.seoSections.map((section) => (
        <section key={section.title}>
          <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
          <p className="mt-2 text-sm text-muted leading-relaxed">{section.content}</p>
        </section>
      ))}
    </div>
  );

  return (
    <ToolLayout
      name={tool.name}
      subtitle={content.subtitle}
      seoContent={seoContent}
    >
      <ToolComponent />
      <FAQ items={content.faq} />
      <RelatedTools tools={relatedTools} />
    </ToolLayout>
  );
}
