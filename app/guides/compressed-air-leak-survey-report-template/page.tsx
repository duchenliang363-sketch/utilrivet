import type { Metadata } from "next";
import GuideLayout, { GuideCta, GuideLink } from "@/components/GuideLayout";

const path = "/guides/compressed-air-leak-survey-report-template";
const title = "Compressed Air Leak Survey Report Template";
const description =
  "A field-ready compressed air leak survey report template covering leak register fields, repair status, re-test results, verified savings, and the management summary.";

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

function Field({ label }: { label: string }) {
  return (
    <div className="min-w-0 border-b border-border py-2.5">
      <p className="text-[13px] font-medium text-foreground">{label}</p>
      <p className="mt-1 h-6 rounded-md bg-surface" aria-hidden="true" />
    </div>
  );
}

export default function CompressedAirLeakSurveyReportTemplatePage() {
  return (
    <GuideLayout path={path} title={title} description={description}>
      <section>
        <p>
          A compressed air leak survey report should document where each leak was found, how it was
          measured, estimated air and energy loss, repair status, and the result of post-repair
          verification.
        </p>
        <p className="mt-3">
          Use the structure below as a working report, not a description of compressed air. Fill it
          on paper, in a spreadsheet, or record the same fields in the{" "}
          <GuideLink href="/tools/compressed-air-leak-survey-report-builder">Compressed Air Leak Survey Tool</GuideLink>.
        </p>
      </section>

      <section>
        <h2>What Should a Compressed Air Leak Survey Report Include?</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-base leading-relaxed text-gray-600">
          <li>
            <span className="font-medium text-foreground">Project Information</span> — project name,
            facility, survey date, surveyor.
          </li>
          <li>
            <span className="font-medium text-foreground">Survey Conditions</span> — operating hours,
            electricity rate, compressor specific power, control method.
          </li>
          <li>
            <span className="font-medium text-foreground">Leak Register</span> — one row per tagged
            leak with location, flow, cost, and status.
          </li>
          <li>
            <span className="font-medium text-foreground">Estimated Energy Opportunity</span> — annual
            kWh and cost from the baseline leak flows you recorded.
          </li>
          <li>
            <span className="font-medium text-foreground">Repair Queue</span> — what should be fixed
            first, with owner and recommended action.
          </li>
          <li>
            <span className="font-medium text-foreground">Repair Status</span> — Open, Planned,
            Awaiting Re-test, Verified Closed, or Failed Re-test.
          </li>
          <li>
            <span className="font-medium text-foreground">Re-test Results</span> — post-repair flow
            and pass / fail.
          </li>
          <li>
            <span className="font-medium text-foreground">Verified Savings</span> — counted only after
            a passing re-test, not from the original estimate.
          </li>
          <li>
            <span className="font-medium text-foreground">Management Summary</span> — counts and
            dollars a manager can act on without reading every tag.
          </li>
        </ol>
        <p className="mt-3">
          If you already have a leak list, put it into the{" "}
          <GuideLink href="/tools/compressed-air-leak-survey-report-builder">Compressed Air Leak Survey Tool</GuideLink> so register,
          queue, re-test, and report stay on the same record.
        </p>
      </section>

      <section>
        <h2>Compressed Air Leak Survey Report Template</h2>
        <p className="mt-3">Copy these fields into your air leak inspection report or leak register.</p>

        <h3 className="mt-6">Project and survey conditions</h3>
        <div className="mt-2 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
          <Field label="Project" />
          <Field label="Facility" />
          <Field label="Survey Date" />
          <Field label="Surveyor" />
          <Field label="Operating Hours" />
          <Field label="Electricity Rate" />
          <Field label="Compressor Specific Power" />
          <Field label="Control Method" />
        </div>

        <h3 className="mt-8">Leak register (repeat for each leak)</h3>
        <div className="mt-2 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
          <Field label="Tag" />
          <Field label="Area" />
          <Field label="Asset" />
          <Field label="Location" />
          <Field label="Pressure" />
          <Field label="Detection Method" />
          <Field label="Measured / Estimated Flow" />
          <Field label="Annual Energy Loss" />
          <Field label="Annual Cost" />
          <Field label="Repair Action" />
          <Field label="Owner" />
          <Field label="Status" />
          <Field label="Re-test Date" />
          <Field label="Post-repair Flow" />
          <Field label="Verified Result" />
        </div>
      </section>

      <section>
        <h2>Leak Register Fields Explained</h2>
        <dl className="mt-3 space-y-3 text-base leading-relaxed text-gray-600">
          <div>
            <dt className="font-medium text-foreground">Tag</dt>
            <dd>Unique ID on the physical tag and in the register. Without it, repair and re-test cannot be matched.</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Area / Asset / Location</dt>
            <dd>Enough for a technician who was not on the survey to find the leak on the first visit.</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Pressure</dt>
            <dd>Operating pressure at the leak. The same orifice costs more at higher pressure.</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Detection method and flow</dt>
            <dd>
              Instrument, estimate, or visual. Record the reading you used. The report does not convert
              dB to SCFM; enter the flow the technician or instrument provided.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Annual energy loss and cost</dt>
            <dd>Planning estimate from flow, specific power, hours, rate, and control assumptions.</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Repair action / owner / status</dt>
            <dd>Turns the register into a work list. Status must follow the leak through re-test.</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Re-test date, post-repair flow, verified result</dt>
            <dd>Proof the leak is gone. A blank re-test means the savings are still only estimated.</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2>Repair and Re-test Section</h2>
        <p className="mt-3">Finding a leak is not the end of the survey.</p>
        <p className="mt-3 font-medium text-foreground">Find → Record → Repair → Re-test → Verify</p>
        <p className="mt-3">
          Completing a repair does not close the leak. Re-test it. If post-repair flow is 0, mark
          Verified Closed and record Verified Result. If it still leaks, mark Failed Re-test, return
          it to the repair queue, and do not count Verified Saving.
        </p>
        <p className="mt-3">
          Failed Re-test cannot be counted as Verified Saving, even when flow dropped. Reduced-but-still-leaking
          is remaining opportunity.
        </p>
      </section>

      <section>
        <h2>Management Summary</h2>
        <p className="mt-3">A manager should be able to read this page without opening the leak register:</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-base leading-relaxed text-gray-600">
          <li>Total leaks</li>
          <li>Estimated Opportunity</li>
          <li>Open Opportunity</li>
          <li>Repairs completed</li>
          <li>Awaiting Re-test</li>
          <li>Verified Closed</li>
          <li>Failed Re-test</li>
          <li>Verified Result</li>
        </ul>
        <p className="mt-3">
          Keep Estimated Opportunity and Verified Result in separate lines. Mixing them overstates
          closed savings.
        </p>
      </section>

      <section>
        <h2>Build Your Air Leak Survey Report</h2>
        <p className="mt-3">
          Instead of maintaining the report manually, use the free UtilRivet Compressed Air Leak Survey
          Tool to record leaks, prioritize repairs, track re-tests and generate the final report.
        </p>
        <GuideCta href="/tools/compressed-air-leak-survey-report-builder">Compressed Air Leak Survey Tool</GuideCta>
      </section>
    </GuideLayout>
  );
}
