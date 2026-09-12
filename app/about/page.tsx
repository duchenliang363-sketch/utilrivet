import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "About",
  description:
    "UtilRivet builds focused browser tools for surveys, calculations, and everyday work. No signup required.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">About</h1>

      <div className="mt-6 space-y-4 text-sm sm:text-base text-muted leading-relaxed">
        <p>
          {siteConfig.name} is a small set of web tools for people who already do the work: plant and
          maintenance teams, buyers comparing quotes, and similar task-focused jobs. It is not a
          leak detector, not a full compressed-air audit service, and not a law-firm system of
          record.
        </p>
        <p>
          The current emphasis is practical compressed-air leak work after leaks have been found:
          a survey register with repair and re-test tracking, a single-leak cost calculator, and
          short field guides. Other tools on the site stay available; they are not the homepage
          focus.
        </p>
        <p>Tools are built to stay out of the way:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>One job per tool</li>
          <li>No account required</li>
          <li>Runs in the browser where the task allows</li>
          <li>Estimates are planning numbers, not meter readings or certifications</li>
        </ul>
        <p>
          Survey projects, leak registers, and calculator inputs are stored in this browser
          (localStorage) unless you export a file yourself. UtilRivet does not currently sync that
          data to a server or between devices. Clearing site data, switching browsers, or opening
          another computer starts from empty unless you import a backup you saved.
        </p>
        <p>
          Questions go to the{" "}
          <Link href="/contact" className="text-primary hover:text-primary-hover underline">
            contact page
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
