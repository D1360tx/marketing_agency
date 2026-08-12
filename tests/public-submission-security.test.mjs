import assert from "node:assert/strict";
import test from "node:test";

import {
  createPublicRateLimitKey,
  getTrustedClientAddress,
  inboundLeadSchema,
  PUBLIC_SUBMISSION_MAX_BYTES,
  readBoundedJson,
} from "../src/lib/public-submission-security.ts";

const validLead = (overrides = {}) => ({
  name: "Taylor Owner",
  business: "Taylor HVAC",
  phone: "+1 (512) 555-0199",
  email: "OWNER@Example.com",
  website: "https://example.com",
  businessType: "HVAC",
  serviceArea: "Austin, TX",
  googleProfile: "https://maps.google.com/example",
  source: "landing_opus",
  turnstileToken: "",
  contact_time: "",
  ...overrides,
});

test("inbound lead schema accepts and normalizes a bounded valid payload", () => {
  const result = inboundLeadSchema.safeParse(validLead());
  assert.equal(result.success, true);
  assert.equal(result.data.email, "owner@example.com");
});

test("inbound lead schema rejects unknown fields and missing business names", () => {
  assert.equal(
    inboundLeadSchema.safeParse(validLead({ admin: true })).success,
    false
  );
  assert.equal(
    inboundLeadSchema.safeParse(validLead({ business: "", business_name: "" })).success,
    false
  );
});

test("inbound lead schema rejects non-HTTP URLs and malformed contact data", () => {
  assert.equal(
    inboundLeadSchema.safeParse(validLead({ website: "javascript:alert(1)" })).success,
    false
  );
  assert.equal(
    inboundLeadSchema.safeParse(validLead({ email: "not-an-email" })).success,
    false
  );
  assert.equal(
    inboundLeadSchema.safeParse(validLead({ phone: "call-me-now" })).success,
    false
  );
});

test("honeypot is bounded but remains detectable by the route", () => {
  const result = inboundLeadSchema.safeParse(validLead({ contact_time: "tomorrow" }));
  assert.equal(result.success, true);
  assert.equal(result.data.contact_time, "tomorrow");
});

test("bounded JSON parser accepts valid bodies and rejects malformed JSON", async () => {
  const valid = await readBoundedJson(
    new Request("https://example.com", {
      method: "POST",
      body: JSON.stringify(validLead()),
    })
  );
  assert.equal(valid.ok, true);

  const invalid = await readBoundedJson(
    new Request("https://example.com", { method: "POST", body: "{" })
  );
  assert.deepEqual(invalid, {
    ok: false,
    status: 400,
    error: "Invalid JSON payload",
  });
});

test("bounded JSON parser rejects declared and actual oversized bodies", async () => {
  const declared = await readBoundedJson(
    new Request("https://example.com", {
      method: "POST",
      headers: { "content-length": String(PUBLIC_SUBMISSION_MAX_BYTES + 1) },
      body: "{}",
    })
  );
  assert.equal(declared.ok, false);
  assert.equal(declared.status, 413);

  const actual = await readBoundedJson(
    new Request("https://example.com", {
      method: "POST",
      body: JSON.stringify({ value: "x".repeat(PUBLIC_SUBMISSION_MAX_BYTES) }),
    })
  );
  assert.equal(actual.ok, false);
  assert.equal(actual.status, 413);
});

test("Vercel-controlled address takes precedence over generic forwarded headers", () => {
  const request = new Request("https://example.com", {
    headers: {
      "x-vercel-forwarded-for": "203.0.113.20",
      "x-forwarded-for": "198.51.100.8",
    },
  });
  assert.equal(getTrustedClientAddress(request), "203.0.113.20");
});

test("rate-limit fingerprints are deterministic and do not expose raw addresses", () => {
  const request = new Request("https://example.com", {
    headers: {
      "x-vercel-forwarded-for": "203.0.113.20",
      "user-agent": "test-agent",
    },
  });
  const first = createPublicRateLimitKey(request, "test-secret");
  const second = createPublicRateLimitKey(request, "test-secret");
  assert.equal(first, second);
  assert.match(first, /^[0-9a-f]{64}$/);
  assert.equal(first.includes("203.0.113.20"), false);
});
