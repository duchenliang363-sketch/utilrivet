import type { Metadata } from "next";
import GuideLayout, { GuideCta, GuideLink } from "@/components/GuideLayout";

const path = "/guides/how-to-calculate-compressed-air-leak-cost";
const title = "How to Calculate Compressed Air Leak Cost";
const description =
  "Compressed air leak cost formula: convert leak flow to compressor power, annual kWh, and electricity cost. Includes a worked example and a free calculator.";

export const metadata: Metadata = {
  title: {
    absolute: "How to Calculate Compressed Air Leak Cost | Formula + Calculator",
  },
  description,
  alternates: { canonical: path },
  openGraph: {
    title: "How to Calculate Compressed Air Leak Cost | Formula + Calculator",
    description,
    type: "article",
  },
};

export default function HowToCalculateCompressedAirLeakCostPage() {
  return (
    <GuideLayout path={path} title={title} description={description}>
      <section>
        <p>
          If you already know leak flow, annual compressed air leak cost is compressor power for that
          flow, times operating hours, times electricity rate. The{" "}
          <GuideLink href="/tools/compressed-air-leak-cost-calculator">Compressed Air Leak Cost Calculator</GuideLink> runs
          the same steps for a single leak.
        </p>
      </section>

      <section>
        <h2>Compressed Air Leak Cost Formula</h2>
        <p className="mt-3">Work in this order:</p>
        <p className="mt-3 font-medium text-foreground">
          Leak Flow → Compressor Power → Annual kWh → Annual Electricity Cost
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-base leading-relaxed text-gray-600">
          <li>
            Convert leak flow to SCFM (or CFM at the stated conditions). 1 L/s ≈ 2.12 CFM; 1 m³/min ≈
            35.31 CFM.
          </li>
          <li>
            Leak power (kW) = (SCFM / 100) × specific power (kW / 100 CFM) × control factor.
          </li>
          <li>Annual energy (kWh) = leak power × operating hours per year.</li>
          <li>Annual electricity cost = annual kWh × electricity rate ($/kWh).</li>
          <li>Recoverable cost = annual electricity cost × recoverable fraction.</li>
        </ol>

        <h3 className="mt-6">Variables</h3>
        <dl className="mt-3 space-y-3 text-base leading-relaxed text-gray-600">
          <div>
            <dt className="font-medium text-foreground">SCFM / CFM</dt>
            <dd>
              Leak volume flow. Use the measured or estimated flow at operating pressure. Do not
              invent flow from orifice size unless that is how the survey was done.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Specific power</dt>
            <dd>
              Electrical kW to produce 100 CFM. Typical packaged compressors land around 15–25 kW /
              100 CFM. Use the compressor datasheet or measured package kW when you have it.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Operating hours</dt>
            <dd>Hours the leak is pressurized per year, not calendar hours the plant exists.</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Electricity rate</dt>
            <dd>Blended $/kWh for the meter that feeds the compressors, including riders you actually pay.</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Control factor</dt>
            <dd>
              Adjusts power for how the compressor responds to lost flow. Use 1.0 for a first-pass
              load/unload estimate. Throttling or inefficient part-load can need a factor above 1.
              Modulation that barely saves kW when flow drops can also change the result.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Recoverable fraction</dt>
            <dd>
              Share of the leak you expect to actually eliminate. Not every tagged leak is reachable
              this shutdown. Planning savings should use this; nameplate leak cost should not hide it.
            </dd>
          </div>
        </dl>
      </section>

      <section>
        <h2>Example</h2>
        <p className="mt-3">One leak, control factor 1.0, fully recoverable:</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-base leading-relaxed text-gray-600">
          <li>Leak flow = 12 SCFM</li>
          <li>Specific power = 18 kW / 100 CFM</li>
          <li>Operating hours = 4,000 h/year</li>
          <li>Electricity rate = $0.12/kWh</li>
        </ul>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-base leading-relaxed text-gray-600">
          <li>Leak power = (12 / 100) × 18 = 2.16 kW</li>
          <li>Annual energy = 2.16 × 4,000 = 8,640 kWh/year</li>
          <li>Annual electricity cost = 8,640 × 0.12 = $1,036.80/year</li>
        </ol>
        <p className="mt-3">
          Same inputs in the{" "}
          <GuideLink href="/tools/compressed-air-leak-cost-calculator">Compressed Air Leak Cost Calculator</GuideLink>{" "}
          (16 h/day × 250 days/year) should match $1,036.80 before repair payback.
        </p>
      </section>

      <section>
        <h2>Why Actual Cost Can Differ</h2>
        <p className="mt-3">This is a planning estimate, not a meter reading.</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-gray-600">
          <li>
            <span className="font-medium text-foreground">Compressor efficiency</span> — specific power
            changes with wear, intake temperature, and whether you used package kW or shaft kW.
          </li>
          <li>
            <span className="font-medium text-foreground">System pressure</span> — higher pressure
            increases leak flow; if you held flow constant in the formula, you understated cost.
          </li>
          <li>
            <span className="font-medium text-foreground">Control strategy</span> — VSD, load/unload,
            and throttle do not save the same kW when a leak is removed.
          </li>
          <li>
            <span className="font-medium text-foreground">Operating hours</span> — weekend shutdowns and
            unloaded nights cut the true pressurized hours.
          </li>
          <li>
            <span className="font-medium text-foreground">Actual measured flow</span> — a soap-test
            guess is not an ultrasonic or flow-meter value.
          </li>
          <li>
            <span className="font-medium text-foreground">Load profile</span> — a leak on a line that is
            isolated half the week is not a 4,000-hour leak.
          </li>
        </ul>
      </section>

      <section>
        <h2>One Leak vs a Full Survey</h2>
        <p className="mt-3">
          One known leak → cost formula /{" "}
          <GuideLink href="/tools/compressed-air-leak-cost-calculator">Compressed Air Leak Cost Calculator</GuideLink>.
        </p>
        <p className="mt-3">
          Many leaks, a repair queue, and re-test →{" "}
          <GuideLink href="/tools/compressed-air-leak-survey-report-builder">Compressed Air Leak Survey Tool</GuideLink>. That workflow
          keeps Estimated Opportunity and Verified Result apart after Failed Re-test.
        </p>
      </section>

      <section>
        <h2>Calculate One Leak</h2>
        <p className="mt-3">Enter flow, hours, rate, and specific power. Repair cost is optional for payback.</p>
        <GuideCta href="/tools/compressed-air-leak-cost-calculator">Compressed Air Leak Cost Calculator</GuideCta>
      </section>

      <section>
        <h2>Managing Multiple Leaks?</h2>
        <p className="mt-3">
          Record the register, prioritize repairs, track re-tests, and generate the survey report.
        </p>
        <GuideCta href="/tools/compressed-air-leak-survey-report-builder">Compressed Air Leak Survey Tool</GuideCta>
      </section>
    </GuideLayout>
  );
}
