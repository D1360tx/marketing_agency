import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  allowedCorsOrigin,
  buildClientLeadDuplicateHash,
  buildOwnerNotificationHtml,
  buildOwnerNotificationSubject,
  buildOwnerNotificationText,
  clientLeadIdempotencyKey,
  clientLeadRetryDelaySeconds,
  clientLeadRoutingSchema,
  clientLeadSubmissionSchema,
  escapeEmailHtml,
  isLeadRequestOriginAllowed,
  isValidClientLeadToken,
  leadCorsHeaders,
  normalizeLeadCaptureAllowedOrigin,
  shouldRetryDuplicateDelivery,
} from "../src/lib/client-leads.ts";

const root = new URL("../", import.meta.url);
const migration = await readFile(new URL("supabase/migrations/033_client_lead_routing.sql", root), "utf8");
const publicRoute = await readFile(new URL("src/app/api/client-leads/[token]/route.ts", root), "utf8").catch(() => "");
const listRoute = await readFile(new URL("src/app/api/client-leads/route.ts", root), "utf8").catch(() => "");
const routingRoute = await readFile(new URL("src/app/api/client-lead-routing/[onboardingId]/route.ts", root), "utf8").catch(() => "");

const validSubmission = (overrides = {}) => ({
  submissionId: "550e8400-e29b-41d4-a716-446655440000",
  fullName: "Taylor Owner",
  email: "OWNER@Example.com",
  phone: "+1 (512) 555-0199",
  city: "Austin",
  service: "HVAC Repair",
  details: "No cooling",
  companyWebsite: "",
  turnstileToken: "",
  ...overrides,
});

test("client lead tokens require exactly 256 bits of lowercase hex", () => {
  const token = "a".repeat(64);
  assert.equal(isValidClientLeadToken(token), true);
  assert.equal(isValidClientLeadToken(token.toUpperCase()), false);
  assert.equal(isValidClientLeadToken("a".repeat(63)), false);
  assert.equal(isValidClientLeadToken(`${token}a`), false);
});

test("client lead schema is strict, bounded, normalized, and keeps honeypot detectable", () => {
  const parsed = clientLeadSubmissionSchema.safeParse(validSubmission());
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.email, "owner@example.com");
  assert.equal(clientLeadSubmissionSchema.safeParse(validSubmission({ admin: true })).success, false);
  assert.equal(clientLeadSubmissionSchema.safeParse(validSubmission({ fullName: "" })).success, false);
  assert.equal(clientLeadSubmissionSchema.safeParse(validSubmission({ details: "x".repeat(2001) })).success, false);
  assert.equal(clientLeadSubmissionSchema.safeParse(validSubmission({ companyWebsite: "bot.example" })).success, true);
});

test("routing config requires an explicit recipient and enabled state", () => {
  assert.equal(clientLeadRoutingSchema.safeParse({ recipient_email: "qa@example.com", enabled: false, allowed_origin: "same-origin" }).success, true);
  assert.equal(clientLeadRoutingSchema.safeParse({ recipient_email: "qa@example.com" }).success, false);
  assert.equal(clientLeadRoutingSchema.safeParse({ enabled: true }).success, false);
  assert.equal(clientLeadRoutingSchema.safeParse({ recipient_email: "qa@example.com", enabled: true, allowed_origin: "https://client.example", revoke_token: true }).success, false);
  assert.equal(clientLeadRoutingSchema.safeParse({ recipient_email: "qa@example.com", enabled: true, allowed_origin: "https://client.example/path" }).success, false);
});

test("allowed origins are exact, HTTPS-only, and never reflected arbitrarily", () => {
  assert.equal(normalizeLeadCaptureAllowedOrigin("same-origin"), "same-origin");
  assert.equal(normalizeLeadCaptureAllowedOrigin("https://client.example"), "https://client.example");
  assert.equal(normalizeLeadCaptureAllowedOrigin("http://client.example"), null);
  assert.equal(normalizeLeadCaptureAllowedOrigin("https://client.example/path"), null);
  assert.equal(
    allowedCorsOrigin("https://client.example", "https://trybookedout.com/api/client-leads/token", "https://client.example"),
    "https://client.example"
  );
  assert.equal(
    allowedCorsOrigin("https://evil.example", "https://trybookedout.com/api/client-leads/token", "https://client.example"),
    null
  );
  assert.equal(
    isLeadRequestOriginAllowed(null, "https://trybookedout.com/api/client-leads/token", "same-origin"),
    true
  );
  assert.deepEqual(leadCorsHeaders("https://client.example"), {
    "Access-Control-Allow-Origin": "https://client.example",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  });
});

test("delivery retries use stable provider keys and bounded exponential backoff", () => {
  assert.equal(clientLeadIdempotencyKey("lead-1", "owner"), "lead-1:owner:v1");
  assert.equal(clientLeadIdempotencyKey("lead-1", "ack"), "lead-1:ack:v1");
  assert.equal(clientLeadRetryDelaySeconds(1), 60);
  assert.equal(clientLeadRetryDelaySeconds(5), 960);
  assert.equal(clientLeadRetryDelaySeconds(100), 3840);
});

test("duplicate hashes are deterministic and recent failed delivery is retryable", () => {
  const parsed = clientLeadSubmissionSchema.parse(validSubmission());
  assert.match(buildClientLeadDuplicateHash(parsed), /^[0-9a-f]{64}$/);
  assert.equal(buildClientLeadDuplicateHash(parsed), buildClientLeadDuplicateHash(parsed));
  const now = new Date("2026-08-29T12:00:00.000Z");
  assert.equal(shouldRetryDuplicateDelivery("2026-08-29T11:00:00.000Z", "failed", "sent", now), true);
  assert.equal(shouldRetryDuplicateDelivery("2026-08-29T11:00:00.000Z", "accepted", "accepted", now), false);
  assert.equal(shouldRetryDuplicateDelivery("2026-08-27T11:00:00.000Z", "failed", "failed", now), false);
});

test("email HTML escaping is safe and owner notification contains no submitted PII", () => {
  assert.equal(escapeEmailHtml(`<script>"x" & 'y'</script>`), "&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;");
  const html = buildOwnerNotificationHtml("https://trybookedout.com", "lead/id", "Synthetic <HVAC>");
  const text = buildOwnerNotificationText("https://trybookedout.com/", "lead/id", "Synthetic HVAC");
  assert.doesNotMatch(html, /Taylor Owner|owner@example\.com|512-555/i);
  assert.match(html, /Synthetic &lt;HVAC&gt;/);
  assert.match(html, /Contact details are available only/);
  assert.match(html, /\/app\/client-leads\?lead=lead%2Fid/);
  assert.match(text, /Synthetic HVAC/);
  assert.match(text, /lead%2Fid/);
  assert.equal(buildOwnerNotificationSubject("  Synthetic   HVAC  "), "New website lead for Synthetic HVAC");
});

test("migration enforces tenant ownership and denies direct anonymous access", () => {
  assert.match(migration, /lead_capture_token ~ '\^\[0-9a-f\]\{64\}\$'/);
  assert.match(migration, /lead_capture_revoked_at timestamptz/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.client_leads/);
  assert.match(migration, /owner_user_id uuid NOT NULL REFERENCES auth\.users/);
  assert.match(migration, /ALTER TABLE public\.client_leads ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /REVOKE ALL ON TABLE public\.client_leads FROM anon, authenticated/);
  assert.match(migration, /owner_user_id = auth\.uid\(\)/);
  assert.match(migration, /owned_onboarding\.user_id = auth\.uid\(\)/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.create_or_get_client_lead/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.list_client_lead_retry_candidates/);
  assert.match(migration, /owner_notification_attempt_count < 5/);
  assert.match(migration, /lead_capture_enabled = true/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.create_or_get_client_lead[\s\S]+TO service_role/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.list_client_lead_retry_candidates[\s\S]+FROM PUBLIC, anon, authenticated/);
  assert.doesNotMatch(migration, /TO anon/);
});

test("public route uses reusable guards, service role, awaited email, no SMS, and duplicate retry", () => {
  assert.match(publicRoute, /getClientLeadServiceClient/);
  assert.match(publicRoute, /readBoundedJson/);
  assert.match(publicRoute, /consumePublicRateLimit/);
  assert.match(publicRoute, /verifyTurnstileToken/);
  assert.match(publicRoute, /companyWebsite/);
  assert.match(publicRoute, /shouldRetryDuplicateDelivery/);
  assert.match(publicRoute, /await deliverClientLeadEmails/);
  assert.match(publicRoute, /owner_notification_status/);
  assert.match(publicRoute, /acknowledgment_status/);
  assert.match(publicRoute, /export async function OPTIONS/);
  assert.match(publicRoute, /isLeadRequestOriginAllowed/);
  assert.match(publicRoute, /allowedCorsOrigin/);
  assert.match(publicRoute, /\.rpc\(\s*"create_or_get_client_lead"/);
  assert.doesNotMatch(publicRoute, /\.from\("client_leads"\)\s*\.insert/);
  assert.doesNotMatch(publicRoute, /twilio|sms/i);
});

test("authenticated APIs scope config and lead inspection to the signed-in owner", () => {
  for (const source of [routingRoute, listRoute]) {
    assert.match(source, /auth\.getUser\(\)/);
    assert.match(source, /user\.id/);
  }
  assert.match(routingRoute, /lead_capture_token/);
  assert.match(routingRoute, /\.eq\("user_id", user\.id\)/);
  assert.match(listRoute, /\.eq\("owner_user_id", user\.id\)/);
  assert.doesNotMatch(listRoute, /lead_capture_token/);
});
