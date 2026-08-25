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
    <section className="mt-12 max-w-[736px]">
      <h2 className="text-xl font-bold text-foreground">Frequently Asked Questions</h2>
      <div className="mt-5 space-y-2.5">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`rounded-xl border transition-colors ${
                isOpen ? "border-border-strong bg-background" : "border-border bg-background"
              }`}
            >
              <button
                type="button"
                className="flex min-h-11 w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium text-foreground"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
              >
                {item.question}
                <svg
                  className={`h-4 w-4 shrink-0 text-muted transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-sm leading-relaxed text-muted">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
