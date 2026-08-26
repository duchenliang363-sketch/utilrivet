export type ToolType = "Calculator" | "Comparison" | "Checker" | "Workflow";

export interface Tool {
  slug: string;
  name: string;
  description: string;
  category: string;
  toolType: ToolType;
  status: "active" | "draft";
  featured?: boolean;
}

export const tools: Tool[] = [
  {
    slug: "percentage-calculator",
    name: "Percentage Calculator",
    description: "Calculate percentages, percentage changes and proportions in seconds.",
    category: "General",
    toolType: "Calculator",
    status: "active",
  },
  {
    slug: "production-line-quote-comparator",
    name: "Production Line Quote Comparator",
    description: "Compare machinery quotations apples-to-apples: scope, specs, terms and pricing in one matrix.",
    category: "Business & Operations",
    toolType: "Comparison",
    status: "active",
    featured: true,
  },
  {
    slug: "business-document-difference-checker",
    name: "Business Document Difference Checker",
    description: "Compare two business documents and spot important changes in prices, quantities, terms and scope.",
    category: "Business & Operations",
    toolType: "Checker",
    status: "active",
  },
  {
    slug: "compressed-air-leak-cost-calculator",
    name: "Compressed Air Leak Cost Calculator",
    description: "Estimate the annual energy and electricity cost of a compressed air leak.",
    category: "Manufacturing & Energy",
    toolType: "Calculator",
    status: "active",
  },
  {
    slug: "supplier-quote-completeness-checker",
    name: "Supplier Quote Completeness Checker",
    description: "Check a supplier quotation for missing commercial terms before comparing or approving it.",
    category: "Business & Operations",
    toolType: "Checker",
    status: "active",
  },
  {
    slug: "boiler-blowdown-cost-savings-calculator",
    name: "Boiler Blowdown Cost & Savings Calculator",
    description: "Estimate boiler blowdown energy loss, water waste and annual cost savings from reducing blowdown rates.",
    category: "Manufacturing & Energy",
    toolType: "Calculator",
    status: "active",
  },
  {
    slug: "condensate-return-savings-calculator",
    name: "Condensate Return Savings Calculator",
    description: "Estimate fuel, water and wastewater savings from increasing condensate return in an industrial steam system.",
    category: "Manufacturing & Energy",
    toolType: "Calculator",
    status: "active",
  },
  {
    slug: "compressed-air-leak-survey-report-builder",
    name: "Compressed Air Leak Survey Report Builder",
    description: "Record multiple compressed air leaks, estimate annual losses and prioritize repairs in a simple survey report.",
    category: "Manufacturing & Energy",
    toolType: "Workflow",
    status: "active",
  },
  {
    slug: "steam-trap-survey-report-builder",
    name: "Steam Trap Survey Report Builder",
    description: "Record steam traps and their condition, estimate annual steam loss costs and prioritize repairs in a printable survey report.",
    category: "Manufacturing & Energy",
    toolType: "Workflow",
    status: "active",
  },
  {
    slug: "fixed-fee-matter-profitability-calculator",
    name: "Fixed-Fee Matter Profitability Calculator",
    description: "Review the true profit, margin and effective hourly rate of a fixed-fee matter, then estimate the fee for your target margin.",
    category: "Business & Operations",
    toolType: "Workflow",
    status: "active",
  },
  {
    slug: "service-job-billing-closeout-checker",
    name: "Service Job Billing Closeout Checker",
    description: "Compare what happened on a completed service job with what has been billed, and find potentially missed charges before sending the invoice.",
    category: "Business & Operations",
    toolType: "Checker",
    status: "active",
  },
];

export const categories = [
  "Business & Operations",
  "Manufacturing & Energy",
  "General",
] as const;

export function categorySlug(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function getActiveTools(): Tool[] {
  return tools.filter((t) => t.status === "active");
}

export function getToolsByCategory(category: string): Tool[] {
  return getActiveTools().filter((t) => t.category === category);
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
