import type { Metadata } from "next";
import GuideLayout, { GuideCta, GuideLink } from "@/components/GuideLayout";

const path = "/guides/compressed-air-leak-survey-checklist";
const title = "Compressed Air Leak Survey Checklist";
const description =
  "A compressed air leak survey checklist for before the walk, every leak found, after the survey, and re-test — so the register, repair queue, and report stay complete.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path },
  openGraph: {
    title: `${title} | UtilRivet`,
    description,
    type: "article",
  },
};

function CheckItem({ children }: { children: string }) {
  return (
    <li className="flex gap-3 text-base leading-relaxed text-gray-600">
      <span
        className="mt-0.5 inline-block h-5 w-5 shrink-0 rounded border border-border-strong bg-background"
        aria-hidden="true"
      />
      <span>{children}</span>
    </li>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2.5">
      {items.map((item) => (
        <CheckItem key={item}>{item}</CheckItem>
      ))}
    </ul>
  );
}

export default function CompressedAirLeakSurveyChecklistPage() {
  return (
    <GuideLayout path={path} title={title} description={description}>
      <section>
        <p>
          Use this compressed air leak survey checklist on the floor: what to set up before you walk,
          what to record at each leak, and what to finish after you return — including re-test.
        </p>
        <p className="mt-3">
          The checklist is capture. It is not leak-detection hardware. If you want the register live
          while you walk, open the{" "}
          <GuideLink href="/tools/compressed-air-leak-survey-report-builder">free compressed air leak survey tool</GuideLink> on a
          phone or tablet before you start.
        </p>
      </section>

      <section>
        <h2>Before the Survey</h2>
        <CheckList
          items={[
            "Facility / area defined",
            "Compressor operating conditions recorded",
            "System pressure recorded",
            "Operating hours confirmed",
            "Electricity rate available",
            "Detection instrument prepared",
            "Leak tags prepared",
            "Camera / photo method ready",
            "Surveyor identified",
          ]}
        />
      </section>

      <section>
        <h2>For Every Leak Found</h2>
        <CheckList
          items={[
            "Unique leak tag",
            "Area",
            "Asset",
            "Exact location",
            "Pressure",
            "Detection method",
            "Instrument reading",
            "Estimated leak flow",
            "Photo / evidence",
            "Operational impact",
            "Access difficulty",
            "Recommended repair",
            "Repair owner",
          ]}
        />
      </section>

      <section>
        <h2>After the Survey</h2>
        <CheckList
          items={[
            "Review leak register",
            "Estimate annual energy loss",
            "Estimate annual cost opportunity",
            "Prioritize repairs",
            "Assign repair owner",
            "Record completed repair",
            "Schedule re-test",
          ]}
        />
        <p className="mt-3">
          After the walk, move the tags into a leak register so energy, cost, and queue are calculated
          from the same list. The{" "}
          <GuideLink href="/tools/compressed-air-leak-survey-report-builder">Compressed Air Leak Survey Tool</GuideLink> is built for
          that hand-off.
        </p>
      </section>

      <section>
        <h2>Re-test Checklist</h2>
        <CheckList
          items={[
            "Leak physically re-tested",
            "Post-repair flow recorded",
            "Evidence recorded",
            "Successful repair marked Verified Closed",
            "Failed repair returned to repair queue",
            "Verified savings separated from estimated savings",
          ]}
        />
      </section>

      <section>
        <h2>What Happens After the Checklist?</h2>
        <p className="mt-3">
          A checklist is only the capture step. Leak management is not finished when the last tag is
          written down.
        </p>
        <p className="mt-3 font-medium text-foreground">Survey → Register → Repair → Re-test → Report</p>
        <p className="mt-3">
          Miss the register and you cannot prioritize. Miss re-test and you cannot prove savings. Miss
          the report and maintenance and management are working from different lists.
        </p>
      </section>

      <section>
        <h2>Turn the Checklist Into a Working Leak Register</h2>
        <p className="mt-3">
          Record tagged leaks, estimate annual cost, assign repairs, track re-tests, and export the
          survey report in the browser.
        </p>
        <GuideCta href="/tools/compressed-air-leak-survey-report-builder">free compressed air leak survey tool</GuideCta>
      </section>
    </GuideLayout>
  );
}
