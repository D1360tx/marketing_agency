import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildMetaLeadPayload,
  normalizePhone,
  parseServiceArea,
  sendMetaLeadEvent,
} from "../src/lib/meta-capi.ts";
import { buildFbc, gaClientIdFromCookie, touchFromUrl } from "../src/lib/attribution.ts";
import { attributionNoteLines } from "../src/lib/lead-attribution.ts";
import { inboundLeadSchema } from "../src/lib/public-submission-security.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const sha = (value) => createHash("sha256").update(value).digest("hex");

test("Meta lead payload hashes and normalizes customer details", () => {
  const payload = buildMetaLeadPayload({
    eventId: "evt-12345678",
    eventTime: 1790000000,
    eventSourceUrl: "https://trybookedout.com/",
    email: "  Alex@Example.COM ",
    phone: "(512) 555-0100",
    fullName: "Alex van Johnson",
    city: "Dripping Springs",
    state: "TX",
    externalId: "prospect-1",
    clientIp: "203.0.113.9",
    userAgent: "Mozilla/5.0",
    fbc: "fb.1.1790000000000.AbCdEf-123",
    fbp: "fb.1.1790000000000.987654321",
  });
  const [event] = payload.data;
  assert.equal(event.event_name, "Lead");
  assert.equal(event.event_id, "evt-12345678");
  assert.equal(event.action_source, "website");
  assert.deepEqual(event.user_data.em, [sha("alex@example.com")]);
  assert.deepEqual(event.user_data.ph, [sha("15125550100")]);
  assert.deepEqual(event.user_data.fn, [sha("alex")]);
  assert.deepEqual(event.user_data.ln, [sha("johnson")]);
  assert.deepEqual(event.user_data.ct, [sha("drippingsprings")]);
  assert.deepEqual(event.user_data.st, [sha("tx")]);
  assert.deepEqual(event.user_data.external_id, [sha("prospect-1")]);
  assert.equal(event.user_data.fbc, "fb.1.1790000000000.AbCdEf-123");
  assert.equal(event.user_data.fbp, "fb.1.1790000000000.987654321");
  assert.equal(payload.test_event_code, undefined);
  assert.doesNotMatch(JSON.stringify(payload), /alex@example|5550100/);
});

test("Meta lead payload drops malformed cookies and empty fields", () => {
  const [event] = buildMetaLeadPayload({ eventId: "evt-12345678", email: "a@b.co", fbc: "<script>", fbp: "nope" }).data;
  assert.equal(event.user_data.fbc, undefined);
  assert.equal(event.user_data.fbp, undefined);
  assert.equal(event.user_data.ph, undefined);
  assert.equal(event.user_data.ln, undefined);
});

test("phone and service area normalization", () => {
  assert.equal(normalizePhone("512-555-0100"), "15125550100");
  assert.equal(normalizePhone("+1 (512) 555-0100"), "15125550100");
  assert.equal(normalizePhone("555"), "");
  assert.deepEqual(parseServiceArea("Austin, TX"), { city: "austin", state: "tx" });
  assert.deepEqual(parseServiceArea("Round Rock"), { city: "roundrock", state: "" });
});

test("Meta CAPI is skipped unless pixel, token and version are valid", async () => {
  let calls = 0;
  const fakeFetch = async () => { calls++; return new Response("{}", { status: 200 }); };
  const input = { eventId: "evt-12345678", email: "a@b.co" };
  assert.equal((await sendMetaLeadEvent(input, {}, fakeFetch)).skipped, true);
  assert.equal((await sendMetaLeadEvent(input, { NEXT_PUBLIC_META_PIXEL_ID: "abc", META_CAPI_ACCESS_TOKEN: "t" }, fakeFetch)).skipped, true);
  assert.equal((await sendMetaLeadEvent(input, { NEXT_PUBLIC_META_PIXEL_ID: "123456", META_CAPI_ACCESS_TOKEN: "t", META_GRAPH_API_VERSION: "../x" }, fakeFetch)).skipped, true);
  assert.equal(calls, 0);
});

test("Meta CAPI posts to the pixel's events endpoint with the token in the body", async () => {
  const requests = [];
  const fakeFetch = async (url, init) => { requests.push({ url, init }); return new Response("{}", { status: 200 }); };
  const result = await sendMetaLeadEvent(
    { eventId: "evt-12345678", email: "a@b.co" },
    { NEXT_PUBLIC_META_PIXEL_ID: "1234567890", META_CAPI_ACCESS_TOKEN: "secret-token", META_TEST_EVENT_CODE: "TEST123" },
    fakeFetch
  );
  assert.equal(result.ok, true);
  assert.equal(requests.length, 1);
  assert.match(requests[0].url, /^https:\/\/graph\.facebook\.com\/v\d+\.\d+\/1234567890\/events$/);
  assert.doesNotMatch(requests[0].url, /secret-token/);
  const body = JSON.parse(requests[0].init.body);
  assert.equal(body.access_token, "secret-token");
  assert.equal(body.test_event_code, "TEST123");
  assert.equal(body.data[0].event_id, "evt-12345678");
});

test("Meta CAPI reports API errors without throwing", async () => {
  const result = await sendMetaLeadEvent(
    { eventId: "evt-12345678" },
    { NEXT_PUBLIC_META_PIXEL_ID: "1234567890", META_CAPI_ACCESS_TOKEN: "t" },
    async () => new Response("bad token", { status: 400 })
  );
  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
});

test("attribution keeps only whitelisted campaign params and strips the query", () => {
  const now = new Date("2026-10-23T12:00:00Z");
  const touch = touchFromUrl(
    "https://trybookedout.com/?utm_source=facebook&utm_campaign=gyms&fbclid=IwAR123&email=leak%40x.com",
    "https://www.facebook.com/some/path?private=1",
    now
  );
  assert.equal(touch.utm_source, "facebook");
  assert.equal(touch.utm_campaign, "gyms");
  assert.equal(touch.fbclid, "IwAR123");
  assert.equal(touch.landing_page, "https://trybookedout.com/");
  assert.equal(touch.referrer, "https://www.facebook.com/some/path");
  assert.equal(touch.captured_at, now.toISOString());
  assert.doesNotMatch(JSON.stringify(touch), /leak|private/);
});

test("attribution ignores internal navigation with no campaign data", () => {
  assert.equal(touchFromUrl("https://trybookedout.com/#pricing", "https://trybookedout.com/"), null);
  assert.equal(touchFromUrl("https://trybookedout.com/", ""), null);
  assert.equal(touchFromUrl("not a url", ""), null);
  const google = touchFromUrl("https://trybookedout.com/?gclid=Cj0abc", "");
  assert.equal(google.gclid, "Cj0abc");
});

test("fbc and GA client ID helpers follow the platform formats", () => {
  assert.equal(buildFbc("IwAR123", new Date(1790000000000)), "fb.1.1790000000000.IwAR123");
  assert.equal(gaClientIdFromCookie("GA1.1.1234567890.1790000000"), "1234567890.1790000000");
  assert.equal(gaClientIdFromCookie("garbage"), undefined);
  assert.equal(gaClientIdFromCookie(undefined), undefined);
});

test("lead notes record source, click IDs and the conversion event", () => {
  const lines = attributionNoteLines({
    eventId: "evt-12345678",
    attribution: {
      first: { utm_source: "google", utm_medium: "cpc", gclid: "Cj0abc", landing_page: "https://trybookedout.com/" },
      last: { utm_source: "facebook", utm_campaign: "gyms\nInjected: yes", fbclid: "IwAR123" },
    },
  });
  assert.ok(lines.includes("Attribution (last touch): source=facebook · campaign=gyms Injected: yes"));
  assert.ok(lines.includes("Attribution (first touch): source=google · medium=cpc"));
  assert.ok(lines.some((line) => line.startsWith("Click IDs:") && line.includes("fbclid=IwAR123")));
  assert.ok(lines.includes("Conversion event ID: evt-12345678"));
  assert.ok(lines.every((line) => !line.includes("\n")));
  assert.deepEqual(attributionNoteLines(undefined), ["Attribution: none captured (direct or untracked visit)"]);
});

test("inbound schema accepts tracking data and still rejects unknown fields", () => {
  const base = { business: "Acme Cleaning", email: "a@b.co" };
  const ok = inboundLeadSchema.safeParse({
    ...base,
    interest: "Growth + Ads",
    tracking: {
      eventId: "0b8e7c1e-1111-4222-8333-944455556666",
      fbp: "fb.1.1790000000000.987654321",
      pageUrl: "https://trybookedout.com/",
      attribution: { last: { utm_source: "facebook", fbclid: "IwAR123" } },
    },
  });
  assert.equal(ok.success, true);
  assert.equal(inboundLeadSchema.safeParse({ ...base, tracking: { eventId: "bad id!" } }).success, false);
  assert.equal(inboundLeadSchema.safeParse({ ...base, tracking: { evil: "x" } }).success, false);
  assert.equal(inboundLeadSchema.safeParse({ ...base, tracking: { attribution: { last: { email: "x" } } } }).success, false);
  assert.equal(inboundLeadSchema.safeParse({ ...base, tracking: { pageUrl: "javascript:alert(1)" } }).success, false);
});

test("homepage v2 stays claim-safe and is served at /", async () => {
  const content = await read("src/app/landing_v2/content.ts");
  const page = await read("src/app/landing_v2/home-v2.tsx");
  const text = (content + page).replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(text, /—|&mdash;|&#8212;/);
  assert.match(content, /No calls, leads, reviews, rankings or revenue are guaranteed/);
  assert.match(content, /This is a delivery promise|We guarantee delivery of the agreed foundation/);
  assert.match(page, /smsConsent: false/);
  // Client quotes render only after written approval (Claims Rule).
  assert.match(content, /quoteApproved: false/);
  assert.match(page, /CASE_STUDY\.quoteApproved && \(/);
  assert.match(page, /EXAMPLE/);
  assert.match(page, /SAMPLE SNAPSHOT/);
  const middleware = await read("src/lib/supabase/middleware.ts");
  assert.match(middleware, /url\.pathname = "\/landing_v2"/);
});
