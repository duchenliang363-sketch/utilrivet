import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Section Card — a bordered card with a header divider, used to structure
 * workflow tools (Survey Information / Settings / Entries / Summary / …).
 */
export default function SectionCard({
  title,
  description,
  actions,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section className={`section-card ${className}`.trim()}>
      <div className="section-card-header">
        <div>
          <h2 className="section-card-title">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="section-card-body">{children}</div>
    </section>
  );
}
