"use client";

import Link from "next/link";
import type { Tool } from "@/lib/tools";
import { getToolContent } from "@/lib/tool-content";
import ToolLayout from "@/components/ToolLayout";
import FAQ from "@/components/FAQ";
import RelatedTools from "@/components/RelatedTools";
import PercentageCalculator from "@/components/tools/PercentageCalculator";
import QuoteComparator from "@/components/tools/QuoteComparator";
import BusinessDocumentDifferenceChecker from "@/components/tools/BusinessDocumentDifferenceChecker";
import CompressedAirLeakCostCalculator from "@/components/tools/CompressedAirLeakCostCalculator";
import SupplierQuoteCompletenessChecker from "@/components/tools/SupplierQuoteCompletenessChecker";
import BoilerBlowdownCostSavingsCalculator from "@/components/tools/BoilerBlowdownCostSavingsCalculator";
import CondensateReturnSavingsCalculator from "@/components/tools/CondensateReturnSavingsCalculator";
import CompressedAirLeakSurveyReportBuilder from "@/components/tools/CompressedAirLeakSurveyReportBuilder";
import SteamTrapSurveyReportBuilder from "@/components/tools/SteamTrapSurveyReportBuilder";
import FixedFeeMatterProfitabilityCalculator from "@/components/tools/FixedFeeMatterProfitabilityCalculator";
import IoltaThreeWayReconciliation from "@/components/tools/IoltaThreeWayReconciliation";

interface ToolPageClientProps {
  tool: Tool;
  relatedTools: Tool[];
}

const toolComponentMap: Record<string, React.ComponentType> = {
  "percentage-calculator": PercentageCalculator,
  "production-line-quote-comparator": QuoteComparator,
  "business-document-difference-checker": BusinessDocumentDifferenceChecker,
  "compressed-air-leak-cost-calculator": CompressedAirLeakCostCalculator,
  "supplier-quote-completeness-checker": SupplierQuoteCompletenessChecker,
  "boiler-blowdown-cost-savings-calculator": BoilerBlowdownCostSavingsCalculator,
  "condensate-return-savings-calculator": CondensateReturnSavingsCalculator,
  "compressed-air-leak-survey-report-builder": CompressedAirLeakSurveyReportBuilder,
  "steam-trap-survey-report-builder": SteamTrapSurveyReportBuilder,
  "fixed-fee-matter-profitability-calculator": FixedFeeMatterProfitabilityCalculator,
  "iolta-three-way-reconciliation": IoltaThreeWayReconciliation,
};

export default function ToolPageClient({ tool, relatedTools }: ToolPageClientProps) {
  const content = getToolContent(tool.slug);
  const ToolComponent = toolComponentMap[tool.slug];

  if (!content || !ToolComponent) {
    return (
      <ToolLayout tool={tool} subtitle={tool.description}>
        <p className="text-sm text-muted">This tool is coming soon.</p>
      </ToolLayout>
    );
  }

  const seoContent = (
    <>
      {content.seoSections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          <p className="mt-3">{section.content}</p>
          {section.cta && (
            <p className="mt-3">
              <Link href={`/tools/${section.cta.slug}`} className="font-medium text-primary hover:underline">
                {section.cta.label} →
              </Link>
            </p>
          )}
        </section>
      ))}
    </>
  );

  return (
    <ToolLayout
      tool={tool}
      subtitle={content.subtitle}
      seoContent={seoContent}
      faq={<FAQ items={content.faq} />}
      related={<RelatedTools tools={relatedTools} />}
    >
      <ToolComponent />
    </ToolLayout>
  );
}
