import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { calculateLeakCost } from "./compressed-air/engine.ts";
import { getGuideBySlug, getGuides, COST_CALCULATOR_PATH, SURVEY_TOOL_PATH } from "./guides.ts";
import { getToolContent } from "./tool-content.ts";

const surveySlug = "compressed-air-leak-survey-report-builder";

const templateSource = readFileSync(
  new URL("../app/guides/compressed-air-leak-survey-report-template/page.tsx", import.meta.url),
  "utf8",
);
const checklistSource = readFileSync(
  new URL("../app/guides/compressed-air-leak-survey-checklist/page.tsx", import.meta.url),
  "utf8",
);
const costGuideSource = readFileSync(
  new URL("../app/guides/how-to-calculate-compressed-air-leak-cost/page.tsx", import.meta.url),
  "utf8",
);
const sitemapSource = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");
const robotsSource = readFileSync(new URL("../app/robots.ts", import.meta.url), "utf8");
const layoutSource = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const surveyPageSource = readFileSync(new URL("../app/tools/[slug]/page.tsx", import.meta.url), "utf8");
const surveyClientSource = readFileSync(new URL("../app/tools/[slug]/ToolPageClient.tsx", import.meta.url), "utf8");
const surveyComponent = readFileSync(
  new URL("../components/tools/CompressedAirLeakSurveyReportBuilder.tsx", import.meta.url),
  "utf8",
);
const toolsIndex = readFileSync(new URL("../app/tools/page.tsx", import.meta.url), "utf8");

function hrefCount(source: string, path: string): number {
  return source.split(path).length - 1;
}

test("air leak guides are registered with the specified URLs, titles, and H1s", () => {
  const template = getGuideBySlug("compressed-air-leak-survey-report-template");
  const checklist = getGuideBySlug("compressed-air-leak-survey-checklist");
  const cost = getGuideBySlug("how-to-calculate-compressed-air-leak-cost");
  assert.ok(template && checklist && cost);
  assert.equal(template.path, "/guides/compressed-air-leak-survey-report-template");
  assert.equal(checklist.path, "/guides/compressed-air-leak-survey-checklist");
  assert.equal(cost.path, "/guides/how-to-calculate-compressed-air-leak-cost");
  assert.equal(template.h1, "Compressed Air Leak Survey Report Template");
  assert.equal(checklist.h1, "Compressed Air Leak Survey Checklist");
  assert.equal(cost.h1, "How to Calculate Compressed Air Leak Cost");
  assert.equal(cost.absoluteTitle, "How to Calculate Compressed Air Leak Cost | Formula + Calculator");
  assert.equal(getGuides().length, 3);
});

test("guide layout emits Article and BreadcrumbList JSON-LD without ratings", () => {
  const layout = readFileSync(new URL("../components/GuideLayout.tsx", import.meta.url), "utf8");
  assert.match(layout, /"@type": "BreadcrumbList"/);
  assert.match(layout, /"@type": "Article"/);
  assert.doesNotMatch(layout, /aggregateRating|reviewCount|FAQPage/);
});

test("guide pages stay indexable in sitemap, robots, and metadata", () => {
  assert.match(sitemapSource, /getGuides\(\)/);
  assert.match(robotsSource, /allow: "\/"/);
  assert.doesNotMatch(robotsSource, /disallow: "\/guides"/);
  assert.doesNotMatch(robotsSource, /noindex/);
  assert.match(layoutSource, /index: true/);
  for (const source of [templateSource, checklistSource, costGuideSource]) {
    assert.match(source, /canonical: path/);
    assert.doesNotMatch(source, /noindex/);
    assert.doesNotMatch(source, /FAQPage|aggregateRating|reviewCount/);
  }
});

test("report template links to the survey tool at least twice and does not rewrite the tool", () => {
  assert.ok(hrefCount(templateSource, SURVEY_TOOL_PATH) >= 2);
  assert.match(templateSource, /Compressed Air Leak Survey Tool/);
  assert.match(templateSource, /Find → Record → Repair → Re-test → Verify/);
  assert.match(templateSource, /Failed Re-test cannot be counted as Verified Saving/);
  assert.doesNotMatch(templateSource, /Compressed air is essential in today’s industrial landscape/i);
});

test("checklist links to the survey tool at least twice with the specified CTA anchor", () => {
  assert.ok(hrefCount(checklistSource, SURVEY_TOOL_PATH) >= 2);
  assert.match(checklistSource, /free compressed air leak survey tool/);
  assert.match(checklistSource, /Survey → Register → Repair → Re-test → Report/);
  assert.doesNotMatch(checklistSource, /Compressed air is essential/i);
});

test("cost guide links the calculator at least twice and the survey tool at least once", () => {
  assert.ok(hrefCount(costGuideSource, COST_CALCULATOR_PATH) >= 2);
  assert.ok(hrefCount(costGuideSource, SURVEY_TOOL_PATH) >= 1);
  assert.match(costGuideSource, /Leak Flow → Compressor Power → Annual kWh → Annual Electricity Cost/);
  assert.match(costGuideSource, /\$1,036\.80/);
  assert.match(costGuideSource, /absolute: "How to Calculate Compressed Air Leak Cost \| Formula \+ Calculator"/);
});

test("cost guide example matches the leak cost engine", () => {
  const result = calculateLeakCost({
    leakFlow: 12,
    flowUnit: "CFM",
    hoursPerDay: 16,
    daysPerYear: 250,
    electricityRate: 0.12,
    specificPower: 18,
    repairCost: 0,
    recoverablePercentage: 100,
  });
  assert.equal(result.leakPowerKW, 2.16);
  assert.equal(result.annualEnergyKWh, 8640);
  assert.equal(result.annualCost, 1036.8);
});

test("cluster pages keep distinct intents and do not steal the survey tool H1", () => {
  assert.match(templateSource, /const title = "Compressed Air Leak Survey Report Template"/);
  assert.match(checklistSource, /const title = "Compressed Air Leak Survey Checklist"/);
  assert.match(costGuideSource, /const title = "How to Calculate Compressed Air Leak Cost"/);
  for (const source of [templateSource, checklistSource, costGuideSource]) {
    assert.doesNotMatch(source, /Compressed Air Leak Survey & Report Tool/);
    assert.doesNotMatch(source, /UtilRivet detects compressed air leaks/i);
  }
});

test("survey tool only gains related-guide links; workflow source is unchanged this round", () => {
  const content = getToolContent(surveySlug);
  assert.ok(content);
  assert.ok(content.relatedGuides?.some((g) => g.href === "/guides/compressed-air-leak-survey-report-template"));
  assert.ok(content.relatedGuides?.some((g) => g.href === "/guides/compressed-air-leak-survey-checklist"));
  assert.match(surveyClientSource, /RelatedGuides/);
  assert.match(surveyPageSource, /canonical: `\/tools\/\$\{slug\}`/);
  assert.match(surveyComponent, /Leak Register|Repair Queue|Verified Closed|Failed Re-test/);
  assert.doesNotMatch(toolsIndex, /compressed-air-leak-survey-report-template/);

  const calculator = getToolContent("compressed-air-leak-cost-calculator");
  assert.ok(calculator?.relatedGuides?.some((g) => g.href === "/guides/how-to-calculate-compressed-air-leak-cost"));
});
