import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "UtilRivet terms of use. Please read before using our tools.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Terms of Use</h1>
      <p className="mt-2 text-xs text-muted">Last updated: August 2026</p>

      <div className="mt-6 space-y-6 text-sm sm:text-base text-muted leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-foreground">Use of Tools</h2>
          <p className="mt-2">
            UtilRivet provides online tools for calculation, estimation, analysis, and productivity purposes. These tools are intended to assist with everyday tasks.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">Accuracy of Results</h2>
          <p className="mt-2">
            Users should independently verify important results. UtilRivet does not guarantee that tool outputs are accurate, complete, or suitable for all regions, regulations, or business scenarios.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">Professional Decisions</h2>
          <p className="mt-2">
            When decisions involve legal, financial, safety, engineering, compliance, or other professional matters, users must perform their own final verification and consult qualified professionals.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">No Warranty</h2>
          <p className="mt-2">
            All tools are provided &quot;as is&quot; without warranty of any kind. UtilRivet is not liable for any damages arising from the use of our tools.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">Changes</h2>
          <p className="mt-2">
            We may update these terms at any time. Continued use of the site after changes constitutes acceptance of the updated terms.
          </p>
        </section>
      </div>
    </main>
  );
}
