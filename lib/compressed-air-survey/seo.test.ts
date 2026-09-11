// SEO-P1 copy must stay aligned with the frozen P0 demo / report engine.
// Run: node --test --experimental-strip-types lib/compressed-air-survey/seo.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getActiveTools, getToolBySlug } from "../tools.ts";
import { getToolContent } from "../tool-content.ts";
import { buildDemoProject } from "./demo.ts";
import { buildSurveyReport } from "./calc.ts";
import { buildManagementReport } from "./export.ts";

const slug = "compressed-air-leak-survey-report-builder";
const calculatorSlug = "compressed-air-leak-cost-calculator";
const pageName = "Compressed Air Leak Survey & Report Tool";

test("survey SEO example matches the 21-leak demo engine totals", () => {
  const tool = getToolBySlug(slug);
  const content = getToolContent(slug);
  assert.ok(tool);
  assert.ok(content);

  const project = buildDemoProject();
  const report = buildSurveyReport(project.settings, project.leaks);
  const management = buildManagementReport(project, report);
  const example = content.seoSections.find((section) => section.title === "Compressed Air Leak Survey Report Example");
  assert.ok(example);

  const l005 = report.leaks.find((leak) => leak.entry.tag === "L-005");
  const l013 = report.leaks.find((leak) => leak.entry.tag === "L-013");
  const l006 = report.leaks.find((leak) => leak.entry.tag === "L-006");
  const l017 = report.leaks.find((leak) => leak.entry.tag === "L-017");
  assert.equal(l005?.entry.status, "Verified Closed");
  assert.equal(l013?.entry.status, "Verified Closed");
  assert.equal(l006?.entry.status, "Failed Re-test");
  assert.equal(l017?.entry.status, "Failed Re-test");
  assert.ok(l005?.verified);
  assert.ok(l013?.verified);
  assert.equal(l006?.verified, null);
  assert.equal(l017?.verified, null);
  assert.equal(report.summary.openCount, 11);
  assert.equal(report.summary.plannedCount, 4);
  assert.equal(report.summary.awaitingRetestCount, 2);
  assert.equal(report.summary.verifiedClosedCount, 2);
  assert.equal(report.summary.failedRetestCount, 2);
  assert.equal(Math.round(report.summary.verifiedResultTotal), 933);

  const copy = example.content;
  assert.match(copy, /11 Open/);
  assert.match(copy, /4 Planned/);
  assert.match(copy, /2 Awaiting Re-test/);
  assert.match(copy, /2 Verified Closed/);
  assert.match(copy, /2 Failed Re-test/);
  assert.match(copy, /L-005 \(Verified Result \$760 \/ year\)/);
  assert.match(copy, /L-013 \(Verified Result \$173 \/ year\)/);
  assert.match(copy, /\$933 \/ year/);
  assert.match(copy, /Verified Closed only/);
  assert.match(copy, /L-006 and L-017 are Failed Re-test/);
  assert.match(copy, /13 → 6 SCFM/);
  assert.match(copy, /not Verified Closed/);
  assert.doesNotMatch(copy, /measured post-repair closure/i);
  assert.match(management, /Verified Result \(Verified Closed only, post-repair flow = 0\): \$933 \/ year/);
});

test("survey page JSON-LD is truthful WebApplication plus breadcrumbs, without ratings", () => {
  const pageSource = readFileSync(new URL("../../app/tools/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(pageSource, /"@type": "WebApplication"/);
  assert.match(pageSource, /"@type": "BreadcrumbList"/);
  assert.match(pageSource, /price: "0"/);
  assert.doesNotMatch(pageSource, /aggregateRating|reviewCount|FAQPage/);
  assert.match(pageSource, /compressed-air-leak-survey-report-builder/);
});

test("survey page title, H1 source, and meta description match the survey + report tool positioning", () => {
  const tool = getToolBySlug(slug);
  const content = getToolContent(slug);
  assert.ok(tool);
  assert.ok(content);

  assert.equal(tool.slug, slug);
  assert.equal(tool.name, pageName);
  assert.equal(
    content.metaDescription,
    "Record compressed air leaks, estimate annual energy cost, prioritize repairs, track re-tests, and generate a compressed air leak survey report with this free browser-based tool.",
  );
  assert.equal(
    content.subtitle,
    "Record identified compressed air leaks, estimate air loss and annual energy cost, prioritize repairs, track re-tests, and generate a survey-ready report.",
  );
  assert.doesNotMatch(tool.name, /Best|#1|ultrasonic detector/i);
  assert.doesNotMatch(content.metaDescription ?? "", /detect|ultrasonic leak detector|#1|Best /i);
  assert.equal(getActiveTools().filter((item) => item.name === pageName).length, 1);
});

test("survey FAQ answers survey intent without claiming leak detection", () => {
  const content = getToolContent(slug);
  assert.ok(content);

  const questions = content.faq.map((item) => item.question);
  assert.ok(questions.includes("What is a compressed air leak survey?"));
  assert.ok(questions.includes("What should a compressed air leak survey include?"));
  assert.ok(questions.includes("How do you document compressed air leaks?"));
  assert.ok(questions.includes("How do you prioritize compressed air leak repairs?"));
  assert.ok(questions.includes("Should repaired compressed air leaks be re-tested?"));
  assert.ok(questions.includes("Does UtilRivet detect compressed air leaks?"));

  const detect = content.faq.find((item) => item.question === "Does UtilRivet detect compressed air leaks?");
  assert.ok(detect);
  assert.match(detect.answer, /^No\./);
  assert.match(detect.answer, /not leak-detection hardware/i);
  assert.match(detect.answer, /does not replace an ultrasonic leak detector or field inspection/i);
  assert.match(detect.answer, /record identified leaks/i);
  assert.doesNotMatch(detect.answer, /UtilRivet detects|ultrasonic leak detector hardware/i);

  const retest = content.faq.find((item) => item.question === "Should repaired compressed air leaks be re-tested?");
  assert.ok(retest);
  assert.match(retest.answer, /Verified Closed/i);
  assert.match(retest.answer, /Failed Re-test/i);
});

test("compressed-air cluster links survey and calculator both ways with topical anchors", () => {
  const survey = getToolContent(slug);
  const calculator = getToolContent(calculatorSlug);
  assert.ok(survey);
  assert.ok(calculator);

  const calculatorCta = calculator.seoSections
    .map((section) => section.cta)
    .find((cta) => cta?.slug === slug);
  assert.ok(calculatorCta);
  assert.equal(calculatorCta.label, "Build a Compressed Air Leak Survey");
  assert.match(
    calculator.seoSections.map((section) => `${section.content} ${section.cta?.label ?? ""}`).join("\n"),
    /Surveying multiple leaks\?[\s\S]*leak register, repair queue, re-test tracking, and report/i,
  );

  const surveyCta = survey.seoSections
    .map((section) => section.cta)
    .find((cta) => cta?.slug === calculatorSlug);
  assert.ok(surveyCta);
  assert.equal(
    surveyCta.label,
    "Need to estimate the cost of a single leak? Use the Compressed Air Leak Cost Calculator",
  );
  assert.doesNotMatch(calculatorCta.label, /click here|learn more/i);
  assert.doesNotMatch(surveyCta.label, /click here|learn more/i);

  const calculatorSource = readFileSync(
    new URL("../../components/tools/CompressedAirLeakCostCalculator.tsx", import.meta.url),
    "utf8",
  );
  assert.match(calculatorSource, /\/tools\/compressed-air-leak-survey-report-builder/);
  assert.match(calculatorSource, /Build a Compressed Air Leak Survey/);
});

test("survey URL stays indexable in sitemap and robots", () => {
  assert.ok(getActiveTools().some((tool) => tool.slug === slug));

  const sitemapSource = readFileSync(new URL("../../app/sitemap.ts", import.meta.url), "utf8");
  const robotsSource = readFileSync(new URL("../../app/robots.ts", import.meta.url), "utf8");
  const layoutSource = readFileSync(new URL("../../app/layout.tsx", import.meta.url), "utf8");
  const pageSource = readFileSync(new URL("../../app/tools/[slug]/page.tsx", import.meta.url), "utf8");

  assert.match(sitemapSource, /getActiveTools\(\)\.map/);
  assert.match(sitemapSource, /getGuides\(\)/);
  assert.match(robotsSource, /allow: "\/"/);
  assert.doesNotMatch(robotsSource, /noindex|disallow: "\/tools"/);
  assert.match(layoutSource, /index: true/);
  assert.match(layoutSource, /follow: true/);
  assert.match(pageSource, /canonical: `\/tools\/\$\{slug\}`/);
  assert.doesNotMatch(pageSource, /noindex/);
});
