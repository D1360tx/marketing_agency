import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { escapeEmailHtml, isGoogleReviewUrl } from "../src/lib/review-security.ts";
import { buildGoogleCalendarDraft, generateLeadPitch, toLocalDateTimeInputValue } from "../src/lib/lead-sales.ts";

const root = new URL("../", import.meta.url);
const read = async (path) => readFile(new URL(path, root), "utf8");

test("the canonical authenticated UI is the only dashboard route tree", async () => {
  await access(new URL("src/app/app/layout.tsx", root));
  await assert.rejects(() => access(new URL("src/app/(dashboard)/layout.tsx", root)));
});

test("primary navigation exposes only the lean acquisition workflow", async () => {
  const shell = await read("src/components/dashboard-shell.tsx");
  for (const label of ["Today", "Leads", "Find Leads", "Clients"]) {
    assert.match(shell, new RegExp(`name: "${label}"`));
  }
  assert.match(shell, /href="\/app\/settings"/);
  for (const label of [
    "Follow-ups",
    "Outreach",
    "Previews",
    "Sequences",
    "Analytics",
    "Reviews",
    "Playbook",
  ]) {
    assert.doesNotMatch(shell, new RegExp(`name: "${label}"`));
  }
});

test("canonical workflow pages do not link to obsolete root dashboard routes", async () => {
  const pages = [
    "src/app/app/page.tsx",
    "src/app/app/tasks/page.tsx",
    "src/app/app/leads/page.tsx",
    "src/app/app/leads/[id]/page.tsx",
    "src/app/app/campaigns/page.tsx",
    "src/app/app/campaigns/new/page.tsx",
    "src/app/app/campaigns/[id]/page.tsx",
    "src/app/app/sequences/page.tsx",
    "src/app/app/sequences/new/page.tsx",
  ];
  for (const path of pages) {
    const source = await read(path);
    assert.doesNotMatch(
      source,
      /(?:href=\{?|router\.push\()[`"]\/(?:tasks|leads|campaigns|sequences)(?:[/?`"])/,
      path
    );
  }
});

test("lead detail keeps navigation and actions usable on mobile", async () => {
  const source = await read("src/app/app/leads/[id]/page.tsx");

  assert.match(source, /flex flex-col gap-3 sm:flex-row sm:items-start/);
  assert.match(source, /grid w-full grid-cols-2 gap-2 sm:contents/);
  assert.match(source, /h-11 w-full sm:min-h-9 sm:w-auto/);
  assert.match(source, /grid-cols-\[auto_minmax\(0,1fr\)_auto_auto\]/);
  assert.match(source, /grid-cols-\[minmax\(0,1fr\)\] gap-4 sm:grid-cols-2/);
  assert.doesNotMatch(source, /flex gap-2 w-full sm:w-auto sm:contents/);
});

test("lead sales actions stay prospect-linked and open real workspaces", async () => {
  const lead = await read("src/app/app/leads/[id]/page.tsx");
  const generator = await read("src/app/app/generator/page.tsx");
  const pitch = await read("src/app/app/leads/[id]/pitch/page.tsx");
  const booking = await read("src/app/app/leads/[id]/book/page.tsx");
  const agreement = await read("src/app/app/leads/[id]/agreement/page.tsx");

  assert.match(lead, /generator\?prospect=\$\{prospect\.id\}/);
  assert.match(lead, /\$\{prospect\.id\}\/pitch/);
  assert.match(lead, /\$\{prospect\.id\}\/book/);
  assert.match(lead, /\$\{prospect\.id\}\/agreement/);
  assert.doesNotMatch(lead, /href="\/go\/(?:book|agreement)"/);

  assert.match(generator, /fetch\(`\/api\/prospects\/\$\{encodeURIComponent\(prospectId!\)\}`\)/);
  assert.doesNotMatch(generator, /fetch\("\/api\/prospects"\)/);
  assert.match(pitch, /Editable lead pitch/);
  assert.match(pitch, /generateLeadPitch/);
  assert.match(booking, /Open Calendar Draft/);
  assert.match(booking, /Mark Call Scheduled/);
  assert.match(booking, /openedCalendarUrl === calendarUrl/);
  assert.match(booking, /call_scheduled_at/);
  assert.match(pitch, /Could not copy\. Select the pitch and copy it manually\./);
  assert.match(agreement, /Local Call System: 90-Day Booking Foundation, \$499 per month/);
  assert.match(agreement, /Open SignWell Template/);
  assert.doesNotMatch(agreement, /Print \/ Save PDF/);
});

test("lead pitch and calendar drafts contain the selected lead", () => {
  const prospect = {
    business_name: "Austin Test HVAC",
    city: "Austin",
    business_type: "HVAC",
    website_url: null,
    review_count: 6,
  };
  const pitch = generateLeadPitch(prospect);
  assert.match(pitch, /Austin Test HVAC/);
  assert.match(pitch, /Austin/);
  assert.match(pitch, /6 Google reviews/);

  const calendar = new URL(buildGoogleCalendarDraft({
    businessName: prospect.business_name,
    startsAt: "2026-09-08T10:00",
    durationMinutes: 30,
    phone: "512-555-0100",
    email: "owner@example.com",
  }));
  assert.equal(calendar.hostname, "calendar.google.com");
  assert.equal(calendar.searchParams.get("action"), "TEMPLATE");
  assert.equal(calendar.searchParams.get("text"), "Booked Out Fit Call: Austin Test HVAC");
  assert.match(calendar.searchParams.get("details"), /owner@example\.com/);
});

test("stored UTC call times convert back to local datetime input values", () => {
  const instant = "2026-09-08T15:00:00.000Z";
  const date = new Date(instant);
  const pad = (value) => String(value).padStart(2, "0");
  const expected = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

  assert.equal(toLocalDateTimeInputValue(instant), expected);
  assert.equal(toLocalDateTimeInputValue("not-a-date"), "");
  assert.equal(toLocalDateTimeInputValue(null), "");
});

test("campaign and recipient creation is one consent-aware database transaction", async () => {
  const route = await read("src/app/api/campaigns/route.ts");
  const migration = await read("supabase/migrations/028_atomic_campaign_creation.sql");
  assert.match(route, /create_campaign_with_recipients/);
  assert.match(route, /recipient_ids/);
  assert.match(migration, /auth\.uid\(\)/);
  assert.match(migration, /sms_consent_at IS NOT NULL/);
  assert.match(migration, /INSERT INTO public\.campaigns/);
  assert.match(migration, /INSERT INTO public\.campaign_messages/);
  assert.match(migration, /REVOKE ALL ON FUNCTION/);
  await assert.rejects(() => access(new URL("src/app/api/campaigns/messages/route.ts", root)));
});

test("outreach requires explicit reviewed message IDs and preserves preview context", async () => {
  const sendRoute = await read("src/app/api/campaigns/send/route.ts");
  const detail = await read("src/app/app/campaigns/[id]/page.tsx");
  const lead = await read("src/app/app/leads/[id]/page.tsx");
  const claimMigration = await read("supabase/migrations/030_campaign_message_claims.sql");
  assert.match(sendRoute, /message_ids/);
  assert.match(sendRoute, /msg\.subject/);
  assert.match(sendRoute, /msg\.body/);
  assert.match(sendRoute, /previewMap/);
  assert.match(sendRoute, /status: "sending"/);
  assert.match(detail, /Approve & Send/);
  assert.match(detail, /message_ids: messageIds/);
  assert.match(lead, /Review & Send/);
  assert.match(lead, /latestPreview\.share_token/);
  assert.match(claimMigration, /'sending'/);
});

test("won leads create idempotent, prospect-linked client intake", async () => {
  const route = await read("src/app/api/onboarding/route.ts");
  const lead = await read("src/app/app/leads/[id]/page.tsx");
  assert.match(route, /prospect_id/);
  assert.match(route, /\.eq\("user_id", user\.id\)/);
  assert.match(route, /existing: true/);
  assert.match(lead, /prospect\.status === "client"/);
  assert.match(lead, /Create Client Intake/);
  assert.doesNotMatch(lead, /fetch\(settings\.webhook_url/);
});

test("prospect workflow fields and statuses are reproducible from migrations", async () => {
  const migration = await read("supabase/migrations/031_reconcile_prospect_workflow.sql");
  for (const field of [
    "follow_up_date",
    "last_contacted_at",
    "tags",
    "loss_reason",
    "deal_value",
    "call_scheduled_at",
  ]) {
    assert.match(migration, new RegExp(field));
  }
  assert.match(migration, /'follow_up'/);
  assert.match(migration, /'call_scheduled'/);
});

test("sequence list has no link to a nonexistent detail route", async () => {
  const source = await read("src/app/app/sequences/page.tsx");
  assert.doesNotMatch(source, /href={`\/sequences\/\$\{seq\.id\}`}/);
  assert.doesNotMatch(source, /href={`\/app\/sequences\/\$\{seq\.id\}`}/);
});

test("manual review requests cannot become phishing or HTML injection emails", () => {
  assert.equal(isGoogleReviewUrl("https://g.page/r/example/review"), true);
  assert.equal(
    isGoogleReviewUrl("https://search.google.com/local/writereview?placeid=abc"),
    true
  );
  assert.equal(isGoogleReviewUrl("https://google.com.evil.example/review"), false);
  assert.equal(isGoogleReviewUrl("http://g.page/r/example"), false);
  assert.equal(
    escapeEmailHtml('<img src=x onerror="alert(1)">'),
    "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
  );
});
