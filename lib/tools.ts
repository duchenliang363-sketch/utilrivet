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
