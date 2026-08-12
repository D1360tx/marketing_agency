import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  findUnsupportedClaims,
  isPrivateAddress,
  isValidShareToken,
  normalizePublicHttpUrl,
} from "../src/lib/generator-security.ts";

const root = new URL("../", import.meta.url);
const read = async (path) => readFile(new URL(path, root), "utf8");

test("generator rejects internal and non-http scrape targets", () => {
  assert.equal(normalizePublicHttpUrl("example.com")?.href, "https://example.com/");
  assert.equal(normalizePublicHttpUrl("https://example.com/about")?.href, "https://example.com/about");
  assert.equal(normalizePublicHttpUrl("http://localhost:3000"), null);
  assert.equal(normalizePublicHttpUrl("https://127.0.0.1"), null);
  assert.equal(normalizePublicHttpUrl("file:///etc/passwd"), null);
  assert.equal(normalizePublicHttpUrl("https://user:pass@example.com"), null);
});

test("private and metadata IP ranges are blocked", () => {
  for (const address of [
    "127.0.0.1",
    "10.0.0.1",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "0.0.0.0",
    "::1",
    "fc00::1",
    "fe80::1",
  ]) {
    assert.equal(isPrivateAddress(address), true, address);
  }
  assert.equal(isPrivateAddress("8.8.8.8"), false);
  assert.equal(isPrivateAddress("2606:4700:4700::1111"), false);
});

test("generated claims must be grounded in supplied source text", () => {
  const html = "<p>Licensed #TX-88492 • Fully Insured</p>";
  assert.deepEqual(findUnsupportedClaims(html, "Trusted local plumbing company"), [
    "licensed",
    "insured",
  ]);
  assert.deepEqual(
    findUnsupportedClaims(html, "Licensed and insured plumbing company, license TX-88492"),
    []
  );
});

test("share tokens require exactly 128 bits of lowercase hex", () => {
  assert.equal(isValidShareToken("a".repeat(32)), true);
  assert.equal(isValidShareToken("A".repeat(32)), false);
  assert.equal(isValidShareToken("a".repeat(31)), false);
  assert.equal(isValidShareToken("z".repeat(32)), false);
});

test("dashboard and public previews never combine scripts with same-origin", async () => {
  const dashboard = await read("src/app/app/generator/page.tsx");
  const publicPage = await read("src/app/preview/[token]/page.tsx");
  for (const source of [dashboard, publicPage]) {
    assert.doesNotMatch(source, /allow-same-origin/);
  }
  await assert.rejects(() => read("src/app/(dashboard)/generator/page.tsx"));
  assert.match(publicPage, /src={`\/api\/preview\/\$\{token\}`}/);
  assert.doesNotMatch(publicPage, /srcDoc=/);
});

test("public preview uses strict token validation and server-only lookup", async () => {
  const route = await read("src/app/api/preview/[token]/route.ts");
  assert.match(route, /isValidShareToken/);
  assert.match(route, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(route, /sandbox allow-scripts/);
  assert.match(route, /form-action 'none'/);
});

test("generator uses one AI provider with fallback rather than parallel paid calls", async () => {
  const route = await read("src/app/api/generator/ai/route.ts");
  assert.doesNotMatch(route, /Promise\.allSettled/);
  assert.match(route, /findUnsupportedClaims/);
  assert.match(route, /Gemini/);
  assert.match(route, /Claude/);
  assert.doesNotMatch(route, /All generators failed\. \$\{errors\}/);
});

test("scraper uses bounded safe fetches for the lean four-page set", async () => {
  const route = await read("src/app/api/generator/scrape/route.ts");
  assert.match(route, /safeFetchHtml/);
  assert.match(route, /MAX_TOTAL_HTML_BYTES/);
  assert.doesNotMatch(route, /\/our-team|\/gallery|\/testimonials|\/reviews/);
});
