import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { getActiveTools, getRelatedTools, getToolBySlug, tools } from "./tools.ts";
import { getToolContent } from "./tool-content.ts";

const quoteSlug = "production-line-quote-comparator";
const differenceSlug = "business-document-difference-checker";

const quoteComponent = readFileSync(
  new URL("../components/tools/QuoteComparator.tsx", import.meta.url),
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
