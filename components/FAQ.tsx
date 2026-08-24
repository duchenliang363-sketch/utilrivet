"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-foreground">Frequently Asked Questions</h2>
      <div className="mt-4 divide-y divide-border border-t border-b border-border">
        {items.map((item, index) => (
          <div key={index}>
            <button
              type="button"
              className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-foreground"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              aria-expanded={openIndex === index}
            >
              {item.question}
              <svg
                className={`ml-2 h-4 w-4 shrink-0 text-muted transition-transform ${openIndex === index ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openIndex === index && (
              <div className="pb-4 text-sm text-muted leading-relaxed">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
