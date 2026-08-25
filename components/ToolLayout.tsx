import Link from "next/link";
import type { ReactNode } from "react";
import type { Tool } from "@/lib/tools";
import ToolBadge from "@/components/ToolBadge";

interface ToolLayoutProps {
  tool: Tool;
  subtitle: string;
  children: ReactNode;
  seoContent?: ReactNode;
  faq?: ReactNode;
  related?: ReactNode;
}

export default function ToolLayout({ tool, subtitle, children, seoContent, faq, related }: ToolLayoutProps) {
  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted print:hidden">
        <Link href="/tools" className="transition-colors hover:text-foreground">
          Tools
        </Link>
        <span className="mx-1.5 text-gray-300">/</span>
        <span className="text-gray-600">{tool.category}</span>
      </nav>

      {/* Page header */}
      <div className="mt-4">
        <ToolBadge type={tool.toolType} />
        <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
          {tool.name}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          {subtitle}
        </p>
        <p className="mt-3 flex items-center gap-1.5 text-[13px] text-muted print:hidden">
          <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z" />
          </svg>
          Runs locally in your browser · No signup
        </p>
      </div>

      {/* Tool Workspace */}
      <div className="workspace mt-6 sm:mt-8">{children}</div>

      {/* SEO content — narrower reading width */}
      {seoContent && (
        <div className="seo-content mt-12 space-y-8 border-t border-border pt-10 sm:mt-16">
          {seoContent}
        </div>
      )}

      {faq}

      {related && <div className="mt-12">{related}</div>}
    </main>
  );
}
