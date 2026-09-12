import Link from "next/link";

export interface RelatedGuide {
  href: string;
  title: string;
  description: string;
}

export default function RelatedGuides({
  guides,
  heading = "Related guides",
}: {
  guides: RelatedGuide[];
  heading?: string;
}) {
  if (guides.length === 0) return null;

  return (
    <section aria-label={heading} className="mt-12">
      <h2 className="text-xl font-bold text-foreground">{heading}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {guides.map((guide) => (
          <Link
            key={guide.href}
            href={guide.href}
            className="card-hover flex flex-col rounded-xl border border-border bg-background p-4"
          >
            <p className="text-sm font-semibold leading-snug text-foreground">{guide.title}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{guide.description}</p>
            <span className="mt-3 flex items-center text-[13px] font-medium text-primary">
              Open guide
              <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
