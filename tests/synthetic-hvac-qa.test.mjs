import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageUrl = new URL("../public/sites/synthetic-hvac-qa.html", import.meta.url);
const html = await readFile(pageUrl, "utf8");

function countMatches(pattern) {
  return [...html.matchAll(pattern)].length;
}

test("synthetic HVAC artifact is visibly and repeatedly labeled test-only", () => {
  assert.match(html, /<title>Synthetic HVAC QA LLC — Test Only<\/title>/);
  assert.ok(countMatches(/test only/gi) >= 3, "expected at least three visible test-only labels");
  assert.match(html, /Synthetic fulfillment QA artifact/);
  assert.match(html, /Controlled routing enabled/);
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
});

test("artifact preserves exact onboarding contact and service-area data", () => {
  assert.match(html, /Synthetic HVAC QA LLC/);
  assert.match(html, /512-555-0128/);
  assert.match(html, /href="tel:\+15125550128"/);
  assert.match(html, /123 Main St\., Austin TX 78701/);
  for (const city of ["Austin", "Round Rock", "Dripping Springs"]) {
    assert.match(html, new RegExp(`>${city}<`));
  }
  assert.match(html, /Preferred contact method/);
  assert.match(html, /Phone call • 512-555-0128/);
});

test("all requested HVAC categories are present and clearly synthetic", () => {
  for (const service of ["HVAC Repair", "HVAC Installation", "Heating Service", "HVAC Maintenance"]) {
    assert.match(html, new RegExp(`<h3>${service}</h3>`));
  }
  assert.ok(countMatches(/Synthetic category/g) >= 4, "each service card must carry a synthetic label");
});

test("artifact contains no common unsupported commercial claims", () => {
  const forbidden = [
    /\blicen[cs](?:e|ed|ing)\b/i,
    /\binsured\b/i,
    /\bbonded\b/i,
    /\bcertified\b/i,
    /\b24\s*\/\s*7\b/i,
    /\bemergency\b/i,
    /\bsame[- ]day\b/i,
    /\bguarantee(?:d|s)?\b/i,
    /\bwarrant(?:y|ies)\b/i,
    /\btestimonial(?:s)?\b/i,
    /\bfive[- ]star\b/i,
    /\b5[- ]star\b/i,
    /\brating(?:s)?\b/i,
    /\b(?:customer|google) review(?:s)?\b/i,
    /\b\d+\+? years?\b/i,
    /\$\s*\d/,
  ];
  for (const pattern of forbidden) {
    assert.doesNotMatch(html, pattern);
  }
});

test("QA lead form has labels, required fields, honeypot, and neutral privacy copy", () => {
  assert.match(html, /<form[^>]+id="qa-lead-form"[^>]*novalidate>/);
  for (const [id, label] of [
    ["full-name", "Full name *"],
    ["email", "Email address *"],
    ["phone", "Phone number *"],
    ["city", "City *"],
    ["service", "Service category *"],
    ["details", "Project details"],
    ["company-website", "Company website — leave blank"],
  ]) {
    assert.ok(html.includes(`<label for="${id}">${label}</label>`), `missing label for ${id}`);
  }
  assert.match(html, /id="full-name"[^>]+required/);
  assert.match(html, /id="email"[^>]+type="email"[^>]+required/);
  assert.match(html, /id="phone"[^>]+required/);
  assert.match(html, /id="city"[^>]+required/);
  assert.match(html, /id="service"[^>]+required/);
  assert.match(html, /name="companyWebsite"[^>]+tabindex="-1"[^>]+autocomplete="off"/);
  assert.match(html, /stores the test inquiry and reports provider-acceptance states separately/);
  assert.doesNotMatch(html, /I (?:agree|consent)|marketing messages|terms and conditions/i);
});

test("submission validates locally, uses one revocable relative endpoint, and permits only HTTP endpoints", () => {
  assert.match(html, /event\.preventDefault\(\)/);
  assert.match(html, /form\.checkValidity\(\)/);
  assert.match(html, /form\.reportValidity\(\)/);
  assert.match(html, /form\.elements\.companyWebsite\.value/);
  assert.match(html, /data-endpoint="\/api\/client-leads\/[0-9a-f]{64}"/);
  assert.match(html, /if \(!configuredEndpoint\)/);
  assert.match(html, /Ready for one controlled synthetic inquiry\./);
  assert.match(html, /endpoint\.protocol !== 'http:' && endpoint\.protocol !== 'https:'/);
  assert.match(html, /fetch\(endpoint\.href/);
  assert.match(html, /\['accepted', 'delivered'\]\.includes\(result\.delivery\?\.owner\)/);
  assert.match(html, /data-site-key=""/);
  assert.match(html, /action: 'client_lead'/);
  assert.match(html, /turnstile\.reset/);
  assert.match(html, /provider accepted the owner notification and acknowledgment/);
  assert.doesNotMatch(html, /data-endpoint="https?:\/\/|diego@icdcventures\.com/i);
  assert.doesNotMatch(html, /XMLHttpRequest|action="https?:\/\//i);
  assert.doesNotMatch(html, /thank you|successfully (?:sent|submitted)|we(?:'|’)ll (?:call|contact)/i);
});
