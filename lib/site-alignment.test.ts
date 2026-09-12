import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getActiveTools, getToolBySlug } from "./tools.ts";
import { getToolContent } from "./tool-content.ts";
import { siteConfig } from "./config.ts";

const surveySlug = "compressed-air-leak-survey-report-builder";
const calculatorSlug = "compressed-air-leak-cost-calculator";
const quoteSlug = "production-line-quote-comparator";

const homeSource = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const headerSource = readFileSync(new URL("../components/Header.tsx", import.meta.url), "utf8");
const footerSource = readFileSync(new URL("../components/Footer.tsx", import.meta.url), "utf8");
const contactSource = readFileSync(new URL("../app/contact/page.tsx", import.meta.url), "utf8");
const aboutSource = readFileSync(new URL("../app/about/page.tsx", import.meta.url), "utf8");
const guidesIndexSource = readFileSync(new URL("../app/guides/page.tsx", import.meta.url), "utf8");
const sitemapSource = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");
const surveyComponent = readFileSync(
  new URL("../components/tools/CompressedAirLeakSurveyReportBuilder.tsx", import.meta.url),
  "utf8",
);

test("homepage features the compressed air leak survey, not the quote comparator", () => {
  const featured = getActiveTools().filter((tool) => tool.featured);
  assert.equal(featured.length, 1);
  assert.equal(featured[0]?.slug, surveySlug);
  assert.equal(getToolBySlug(quoteSlug)?.featured, undefined);
  assert.match(homeSource, /Open Compressed Air Leak Survey/);
  assert.match(homeSource, /Compressed Air Tools/);
  assert.match(homeSource, /id="compressed-air"/);
  assert.doesNotMatch(homeSource, /Open Quote Comparator/);
});

test("guides are reachable from header, footer, homepage, and sitemap", () => {
  assert.match(headerSource, /href="\/guides"/);
  assert.match(footerSource, /href: "\/guides"/);
  assert.match(homeSource, /href="\/guides"/);
  assert.match(guidesIndexSource, /canonical: "\/guides"/);
  assert.match(guidesIndexSource, /SURVEY_TOOL_PATH/);
  assert.match(guidesIndexSource, /COST_CALCULATOR_PATH/);
  assert.match(sitemapSource, /\$\{baseUrl\}\/guides`/);
});

test("contact lists the founder-provided email and does not say coming soon", () => {
  assert.doesNotMatch(contactSource, /coming soon/i);
  assert.doesNotMatch(contactSource, /@utilrivet\.com/);
  assert.equal(siteConfig.contactEmail, "duchenliang311@gmail.com");
  assert.match(contactSource, /siteConfig\.contactEmail/);
});

test("about states local-first storage without fake company claims", () => {
  assert.match(aboutSource, /localStorage/);
  assert.match(aboutSource, /does not currently sync that\s+data to a server/s);
  assert.doesNotMatch(aboutSource, /certified|#1|10,000 customers|our team of/i);
  assert.match(aboutSource, /not a\s+leak detector/i);
});

test("compressed-air cluster links survey, calculator, and guides both ways", () => {
  const survey = getToolContent(surveySlug);
  const calculator = getToolContent(calculatorSlug);
  assert.ok(survey?.relatedGuides?.some((g) => g.href === "/guides/compressed-air-leak-survey-report-template"));
  assert.ok(survey?.relatedGuides?.some((g) => g.href === "/guides/compressed-air-leak-survey-checklist"));
  assert.ok(survey?.relatedGuides?.some((g) => g.href === "/guides/how-to-calculate-compressed-air-leak-cost"));
  assert.ok(calculator?.relatedGuides?.some((g) => g.href === "/guides/how-to-calculate-compressed-air-leak-cost"));
  const surveyCta = survey?.seoSections.map((s) => s.cta).find((cta) => cta?.slug === calculatorSlug);
  const calculatorCta = calculator?.seoSections.map((s) => s.cta).find((cta) => cta?.slug === surveySlug);
  assert.ok(surveyCta);
  assert.ok(calculatorCta);
});

test("this round does not rewrite the survey workflow component", () => {
  assert.match(surveyComponent, /Repair Queue/);
  assert.match(surveyComponent, /Verified Closed/);
  assert.match(surveyComponent, /Failed Re-test/);
  assert.match(surveyComponent, /does not convert dB to flow/i);
});
