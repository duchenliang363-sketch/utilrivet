"use client";

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ({ items }: { items: FAQItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mt-12 max-w-[736px]">
      <h2 className="text-xl font-bold text-foreground">Frequently Asked Questions</h2>
      <div className="mt-5 space-y-2.5">
        {items.map((item) => (
          <details
            key={item.question}
            className="group rounded-xl border border-border bg-background open:border-border-strong"
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium text-foreground [&::-webkit-details-marker]:hidden">
              {item.question}
              <svg
                className="h-4 w-4 shrink-0 text-muted transition-transform duration-150 group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-5 pb-5 text-sm leading-relaxed text-muted">{item.answer}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
