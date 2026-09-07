// SEO-P1 copy must stay aligned with the frozen P0 demo / report engine.
// Run: node --test --experimental-strip-types lib/compressed-air-survey/seo.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getToolBySlug } from "../tools.ts";
import { getToolContent } from "../tool-content.ts";
import { buildDemoProject } from "./demo.ts";
import { buildSurveyReport } from "./calc.ts";
import { buildManagementReport } from "./export.ts";

const slug = "compressed-air-leak-survey-report-builder";

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
