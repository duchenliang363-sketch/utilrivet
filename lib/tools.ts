export interface Tool {
  slug: string;
  name: string;
  description: string;
  category: string;
  status: "active" | "draft";
}

export const tools: Tool[] = [
  {
    slug: "percentage-calculator",
    name: "Percentage Calculator",
    description: "Calculate percentages quickly.",
    category: "Calculators",
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
