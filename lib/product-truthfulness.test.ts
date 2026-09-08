import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { getActiveTools, getRelatedTools, getToolBySlug, tools } from "./tools.ts";
import { getToolContent } from "./tool-content.ts";

const quoteSlug = "production-line-quote-comparator";
const differenceSlug = "business-document-difference-checker";
const compressedAirSurveySlug = "compressed-air-leak-survey-report-builder";

const quoteComponent = readFileSync(
  new URL("../components/tools/QuoteComparator.tsx", import.meta.url),
  "utf8",
);
const compressedAirSurveyComponent = readFileSync(
  new URL("../components/tools/CompressedAirLeakSurveyReportBuilder.tsx", import.meta.url),
  "utf8",
);
const routeSource = readFileSync(
  new URL("../app/tools/[slug]/page.tsx", import.meta.url),
  "utf8",
);

test("Quote Comparator presents automatic parsing as first-pass extraction that requires review", () => {
  const content = getToolContent(quoteSlug);
  assert.ok(content);

  const visibleCopy = JSON.stringify(content) + quoteComponent;
  assert.doesNotMatch(visibleCopy, /no real file analysis|when file analysis becomes available/i);
  assert.match(quoteComponent, /First-pass extraction/);
  assert.match(
    quoteComponent,
    /Review extracted values against the original supplier quote before making purchasing decisions\./,
  );
});

test("Quote Comparator file claims match the parser's supported formats and limits", () => {
  assert.match(quoteComponent, /PDF, XLSX, XLS, and CSV/);
  assert.match(quoteComponent, /first worksheet/i);
  assert.match(quoteComponent, /scanned or image-only PDFs/i);
  assert.match(quoteComponent, /does not use OCR/i);
  assert.doesNotMatch(quoteComponent, /arbitrary document understanding|guaranteed accurate/i);
});

test("Difference Checker is downlisted from discovery but remains directly buildable", () => {
  const entry = tools.find((tool) => tool.slug === differenceSlug);
  assert.ok(entry);
  assert.equal(entry.status, "active");
  assert.equal(entry.discoverable, false);
  assert.ok(getToolBySlug(differenceSlug));
  assert.ok(!getActiveTools().some((tool) => tool.slug === differenceSlug));
  assert.ok(
    !getRelatedTools(quoteSlug, 20).some((tool) => tool.slug === differenceSlug),
  );
  assert.match(routeSource, /filter\(\(t\) => t\.status === "active"\)/);
});

test("Difference Checker copy limits the tool to structured Key/Value text", () => {
  const content = getToolContent(differenceSlug);
  assert.ok(content);
  const visibleCopy = JSON.stringify(content);

  assert.match(visibleCopy, /Structured Field Difference Checker/);
  assert.match(visibleCopy, /Key\/Value/);
  assert.match(visibleCopy, /Payment Terms: Net 30/);
  assert.doesNotMatch(
    visibleCopy,
    /compare any two text-based business documents|compare a quote against a purchase order|compare two versions of a contract/i,
  );
});

test("Compressed Air Leak Survey is positioned as a survey workflow, not a detection tool", () => {
  const tool = getToolBySlug(compressedAirSurveySlug);
  const content = getToolContent(compressedAirSurveySlug);
  assert.ok(tool);
  assert.ok(content);

  const visibleCopy = JSON.stringify(content) + compressedAirSurveyComponent;
  assert.equal(tool.name, "Compressed Air Leak Survey & Report Tool");
  assert.equal(content.slug, compressedAirSurveySlug, "the indexed URL slug must stay unchanged");
  assert.match(visibleCopy, /UtilRivet does not detect compressed air leaks\./);
  assert.match(visibleCopy, /field inspection or ultrasonic leak survey/);
  assert.match(visibleCopy, /How is compressed air leak cost estimated\?/);
  assert.match(compressedAirSurveyComponent, /Leak Register|Repair Queue|Verified Closed|Failed Re-test/);
  assert.doesNotMatch(
    visibleCopy,
    /Detect leaks with UtilRivet|Compressed Air Leak Detection Tool|whole process/i,
  );
});

test("Compressed Air Leak Survey copy matches the verified-close workflow, not the old three-status model", () => {
  const tool = getToolBySlug(compressedAirSurveySlug);
  const content = getToolContent(compressedAirSurveySlug);
  assert.ok(tool);
  assert.ok(content);

  const visibleCopy = JSON.stringify(content);
  assert.match(tool.description, /leak register|re-test|survey report/i);
  assert.match(visibleCopy, /not a complete compressed air system audit/i);
  assert.match(visibleCopy, /one part of a broader compressed air audit/i);
  assert.match(visibleCopy, /Verified Closed/);
  assert.match(visibleCopy, /Failed Re-test/);
  assert.match(visibleCopy, /Awaiting Re-test/);
  assert.doesNotMatch(visibleCopy, /Original Potential Savings|Closed Potential Savings|Remaining Potential Savings/);
  assert.doesNotMatch(visibleCopy, /Open, Planned, or Repaired/);
  assert.doesNotMatch(visibleCopy, /rated HIGH priority, 3–12 months MEDIUM/);
  assert.doesNotMatch(visibleCopy, /Complete Compressed Air Audit|Compressed Air System Audit Software/);
});

test("Compressed Air Leak Survey SEO surface names the survey and report tool and keeps calculator as supporting", () => {
  const tool = getToolBySlug(compressedAirSurveySlug);
  const content = getToolContent(compressedAirSurveySlug);
  const calculator = getToolContent("compressed-air-leak-cost-calculator");
  assert.ok(tool);
  assert.ok(content);
  assert.ok(calculator);

  const surveyCopy = JSON.stringify(content);
  const calculatorCopy = JSON.stringify(calculator);

  assert.equal(tool.name, "Compressed Air Leak Survey & Report Tool");
  assert.match(content.subtitle, /record identified compressed air leaks/i);
  assert.match(content.subtitle, /prioritize repairs/i);
  assert.match(content.subtitle, /re-test/i);
  assert.match(content.metaDescription ?? "", /compressed air leak survey report/i);
  assert.match(content.metaDescription ?? "", /estimate annual energy cost/i);
  assert.doesNotMatch(content.metaDescription ?? "", /detect|certif|compliance|ultrasonic leak detector/i);
  assert.equal(content.seoSections[0]?.title, "How to Conduct a Compressed Air Leak Survey");
  assert.deepEqual(
    content.seoSections[0]?.subsections?.map((section) => section.title),
    [
      "1. Define the survey scope",
      "2. Detect and tag air leaks",
      "3. Build the leak register",
      "4. Prioritize repairs",
      "5. Re-test repaired leaks",
      "6. Verify closed leaks and savings",
      "7. Generate the survey report",
    ],
  );
  assert.equal(content.seoSections[1]?.title, "Compressed Air Leak Survey Report Example");
  assert.match(surveyCopy, /urgency, then operational impact, then repair access/i);
  assert.match(surveyCopy, /Verified Result is counted only when re-test confirms post-repair flow of 0/i);
  assert.match(calculatorCopy, /Build a Compressed Air Leak Survey/);
  assert.match(calculatorCopy, /compressed-air-leak-survey-report-builder/);
  assert.doesNotMatch(surveyCopy, /measured post-repair closure/i);
  assert.doesNotMatch(surveyCopy, /Open \/ Planned \/ Repaired/);
});
