import Link from "next/link";
import type { ReactNode } from "react";
import { siteConfig } from "@/lib/config";

interface GuideLayoutProps {
  path: string;
  title: string;
  description: string;
  children: ReactNode;
}

export default function GuideLayout({ path, title, description, children }: GuideLayoutProps) {
  const pageUrl = `${siteConfig.url}${path}`;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: title, item: pageUrl },
    ],
  };
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    mainEntityOfPage: pageUrl,
    dateModified: "2026-09-11",
  };

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />

      <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
        <Link href="/" className="transition-colors hover:text-foreground">
          Home
        </Link>
        <span className="mx-1.5 text-gray-300">/</span>
        <span className="text-gray-600">{title}</span>
      </nav>

      <article className="seo-content mt-4">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-foreground sm:text-3xl">{title}</h1>
        <div className="mt-6 space-y-8">{children}</div>
      </article>
    </main>
  );
}

export function GuideCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <p className="mt-4">
      <Link
        href={href}
        className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-lg bg-primary px-4 py-3 text-[15px] font-medium leading-snug text-white hover:bg-primary-hover"
      >
        {children}
      </Link>
    </p>
  );
}

export function GuideLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-primary hover:underline">
      {children}
    </Link>
  );
}
