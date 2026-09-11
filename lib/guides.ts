export interface GuidePage {
  slug: string;
  path: string;
  title: string;
  h1: string;
  description: string;
  /** When set, used as the exact document title instead of the site template. */
  absoluteTitle?: string;
}

export const SURVEY_TOOL_PATH = "/tools/compressed-air-leak-survey-report-builder";
export const COST_CALCULATOR_PATH = "/tools/compressed-air-leak-cost-calculator";

export const airLeakGuides: GuidePage[] = [
  {
    slug: "compressed-air-leak-survey-report-template",
    path: "/guides/compressed-air-leak-survey-report-template",
    title: "Compressed Air Leak Survey Report Template",
    h1: "Compressed Air Leak Survey Report Template",
    description:
      "A field-ready compressed air leak survey report template covering leak register fields, repair status, re-test results, verified savings, and the management summary.",
  },
  {
    slug: "compressed-air-leak-survey-checklist",
    path: "/guides/compressed-air-leak-survey-checklist",
    title: "Compressed Air Leak Survey Checklist",
    h1: "Compressed Air Leak Survey Checklist",
    description:
      "A compressed air leak survey checklist for before the walk, every leak found, after the survey, and re-test — so the register, repair queue, and report stay complete.",
  },
  {
    slug: "how-to-calculate-compressed-air-leak-cost",
    path: "/guides/how-to-calculate-compressed-air-leak-cost",
    title: "How to Calculate Compressed Air Leak Cost",
    h1: "How to Calculate Compressed Air Leak Cost",
    description:
      "Compressed air leak cost formula: convert leak flow to compressor power, annual kWh, and electricity cost. Includes a worked example and a free calculator.",
    absoluteTitle: "How to Calculate Compressed Air Leak Cost | Formula + Calculator",
  },
];

export function getGuides(): GuidePage[] {
  return airLeakGuides;
}

export function getGuideBySlug(slug: string): GuidePage | undefined {
  return airLeakGuides.find((guide) => guide.slug === slug);
}
