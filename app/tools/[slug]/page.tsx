import type { Metadata } from "next";
import { tools, getToolBySlug, getRelatedTools } from "@/lib/tools";
import { getToolContent } from "@/lib/tool-content";
import ToolPageClient from "./ToolPageClient";

export function generateStaticParams() {
  return tools
    .filter((t) => t.status === "active")
    .map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  const content = getToolContent(slug);

  if (!tool) {
    return { title: "Tool Not Found" };
  }

  return {
    title: tool.name,
    description: content?.subtitle || tool.description,
    openGraph: {
      title: `${tool.name} | UtilRivet`,
      description: content?.subtitle || tool.description,
      type: "website",
    },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return (
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">Tool not found</h1>
        <p className="mt-2 text-sm text-muted">The tool you are looking for does not exist.</p>
      </main>
    );
  }

  const relatedTools = getRelatedTools(slug);

  return <ToolPageClient tool={tool} relatedTools={relatedTools} />;
}
