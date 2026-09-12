import type { Metadata } from "next";
import Link from "next/link";
import { COST_CALCULATOR_PATH, SURVEY_TOOL_PATH, getGuides } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Guides",
  description:
    "Compressed air leak survey guides: report template, field checklist, and how to calculate leak cost.",
  alternates: {
    canonical: "/guides",
  },
};

export default function GuidesIndexPage() {
  const guides = getGuides();

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
        <Link href="/" className="transition-colors hover:text-foreground">
          Home
        </Link>
        <span className="mx-1.5 text-gray-300">/</span>
        <span className="text-gray-600">Guides</span>
      </nav>

      <h1 className="mt-4 text-[26px] font-bold tracking-tight text-foreground sm:text-3xl">Guides</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
        Field notes for a compressed air leak survey: how to document the report, what to capture on
        the floor, and how to turn leak flow into an annual cost. These pages are not leak-detection
        hardware.
      </p>

      <ul className="mt-8 space-y-3">
        {guides.map((guide) => (
          <li key={guide.slug}>
            <Link
              href={guide.path}
              className="card-hover block rounded-xl border border-border bg-background p-4"
            >
              <p className="text-sm font-semibold leading-snug text-foreground">{guide.title}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{guide.description}</p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm leading-relaxed text-muted">
        After the walk, record leaks in the{" "}
        <Link href={SURVEY_TOOL_PATH} className="font-medium text-primary hover:underline">
          Compressed Air Leak Survey Tool
        </Link>
        . For one known leak, use the{" "}
        <Link href={COST_CALCULATOR_PATH} className="font-medium text-primary hover:underline">
          Compressed Air Leak Cost Calculator
        </Link>
        .
      </p>
    </main>
  );
}
