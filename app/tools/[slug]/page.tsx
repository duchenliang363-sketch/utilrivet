import type { Metadata } from "next";
import { tools, getToolBySlug, getRelatedTools } from "@/lib/tools";
import { getToolContent } from "@/lib/tool-content";
import { siteConfig } from "@/lib/config";
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

  const description = content?.metaDescription || content?.subtitle || tool.description;

  return {
    title: tool.name,
    description,
    alternates: {
      canonical: `/tools/${slug}`,
    },
    openGraph: {
      title: `${tool.name} | UtilRivet`,
      description,
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
  const content = getToolContent(slug);
  const description = content?.metaDescription || content?.subtitle || tool.description;

  return (
    <>
      {slug === "compressed-air-leak-survey-report-builder" ? (
        <SurveyStructuredData name={tool.name} slug={tool.slug} description={description} />
      ) : null}
      <ToolPageClient tool={tool} relatedTools={relatedTools} />
    </>
  );
}

function SurveyStructuredData({
  name,
  slug,
  description,
}: {
  name: string;
  slug: string;
  description: string;
}) {
  const pageUrl = `${siteConfig.url}/tools/${slug}`;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "Tools", item: `${siteConfig.url}/tools` },
      { "@type": "ListItem", position: 3, name, item: pageUrl },
    ],
  };
  const application = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    url: pageUrl,
    description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(application) }}
      />
    </>
  );
}
