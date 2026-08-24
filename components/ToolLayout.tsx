import type { ReactNode } from "react";

interface ToolLayoutProps {
  name: string;
  subtitle: string;
  children: ReactNode;
  seoContent?: ReactNode;
}

export default function ToolLayout({ name, subtitle, children, seoContent }: ToolLayoutProps) {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{name}</h1>
      <p className="mt-2 text-sm sm:text-base text-muted">{subtitle}</p>

      <div className="mt-8">{children}</div>

      {seoContent && <div className="mt-12 border-t border-border pt-8">{seoContent}</div>}
    </main>
  );
}
