export interface Tool {
  slug: string;
  name: string;
  description: string;
  category: string;
  status: "active" | "draft";
  featured?: boolean;
}

export const tools: Tool[] = [
  {
    slug: "percentage-calculator",
    name: "Percentage Calculator",
    description: "Calculate percentages quickly.",
    category: "Calculators",
    status: "active",
  },
  {
    slug: "production-line-quote-comparator",
    name: "Production Line Quote Comparator",
    description: "Compare machinery quotations apples-to-apples.",
    category: "Operations",
    status: "active",
    featured: true,
  },
  {
    slug: "business-document-difference-checker",
    name: "Business Document Difference Checker",
    description: "Compare two business documents and spot important changes in prices, quantities, terms and scope.",
    category: "Operations",
    status: "active",
  },
  {
    slug: "compressed-air-leak-cost-calculator",
    name: "Compressed Air Leak Cost Calculator",
    description: "Estimate the annual energy and electricity cost of a compressed air leak.",
    category: "Manufacturing",
    status: "active",
  },
  {
    slug: "supplier-quote-completeness-checker",
    name: "Supplier Quote Completeness Checker",
    description: "Check a supplier quotation for missing commercial terms before comparing or approving it.",
    category: "Operations",
    status: "active",
  },
  {
    slug: "boiler-blowdown-cost-savings-calculator",
    name: "Boiler Blowdown Cost & Savings Calculator",
    description: "Estimate boiler blowdown energy loss, water waste and annual cost savings from reducing blowdown rates.",
    category: "Manufacturing",
    status: "active",
  },
  {
    slug: "condensate-return-savings-calculator",
    name: "Condensate Return Savings Calculator",
    description: "Estimate fuel, water and wastewater savings from increasing condensate return in an industrial steam system.",
    category: "Manufacturing",
    status: "active",
  },
  {
    slug: "compressed-air-leak-survey-report-builder",
    name: "Compressed Air Leak Survey Report Builder",
    description: "Record multiple compressed air leaks, estimate annual losses and prioritize repairs in a simple survey report.",
    category: "Manufacturing",
    status: "active",
  },
];

export const categories = [
  "Calculators",
  "Estimators",
  "Compliance",
  "Operations",
  "Finance",
  "Productivity",
  "Other",
] as const;

export function getActiveTools(): Tool[] {
  return tools.filter((t) => t.status === "active");
}

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug && t.status === "active");
}

export function getRelatedTools(slug: string, limit = 3): Tool[] {
  const current = getToolBySlug(slug);
  if (!current) return [];
  return tools
    .filter((t) => t.slug !== slug && t.status === "active" && t.category === current.category)
    .slice(0, limit);
}
