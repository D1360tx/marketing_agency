import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createTrackingToken,
  decodeToken,
  isSafeTrackingDestination,
} from "../src/lib/tracking.ts";
import { isMockDataEnabled } from "../src/lib/runtime-flags.ts";

const root = new URL("../", import.meta.url);
const read = async (path) => readFile(new URL(path, root), "utf8");
const secret = "a".repeat(64);
const payload = {
  u: "27600d50-0105-4a9b-8085-21750188be91",
  t: "campaign",
  m: "9ea875c2-3346-4fff-b4c7-31e265596f66",
  p: "4c701047-366a-49c2-8314-486cec774677",
  k: "click",
  d: "https://cal.com/booked-out/audit",
};

test("tracking tokens are signed, destination-bound, and expire", () => {
  const now = Date.UTC(2026, 7, 11);
  const token = createTrackingToken(payload, secret, now);
  assert.deepEqual(decodeToken(token, secret, now + 1_000), {
    ...payload,
    exp: now + 30 * 24 * 60 * 60 * 1_000,
  });

  const [body, signature] = token.split(".");
  const tamperedBody = `${body.slice(0, -1)}${body.endsWith("A") ? "B" : "A"}`;
  assert.equal(decodeToken(`${tamperedBody}.${signature}`, secret, now), null);
  assert.equal(decodeToken(token, "b".repeat(64), now), null);
  assert.equal(decodeToken(token, secret, now + 31 * 24 * 60 * 60 * 1_000), null);
  assert.equal(decodeToken(body, secret, now), null);
});

test("tracking accepts only external HTTP(S) destinations", () => {
  assert.equal(isSafeTrackingDestination("https://cal.com/booked-out"), true);
  assert.equal(isSafeTrackingDestination("http://example.org/path"), true);
  assert.equal(isSafeTrackingDestination("javascript:alert(1)"), false);
  assert.equal(isSafeTrackingDestination("data:text/html,test"), false);
  assert.equal(isSafeTrackingDestination("/relative"), false);
});

test("tracking routes require signed tokens and never trust a url query parameter", async () => {
  const click = await read("src/app/api/track/click/route.ts");
  const open = await read("src/app/api/track/open/route.ts");
  const store = await read("src/lib/tracking-store.ts");
  for (const source of [click, open]) {
    assert.match(source, /TRACKING_SECRET/);
    assert.match(source, /decodeToken/);
    assert.match(source, /recordTrackingEvent/);
  }
  assert.match(store, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(store, /ownsMessage/);
  assert.doesNotMatch(click, /searchParams\.get\("url"\)/);
  assert.match(click, /payload\.d/);
  assert.match(click, /status: 400/);
});

test("tracking migration revokes anonymous writes and deduplicates events", async () => {
  const migration = await read("supabase/migrations/027_secure_tracking.sql");
  assert.match(migration, /DROP POLICY IF EXISTS "Allow insert for tracking"/);
  assert.match(migration, /REVOKE INSERT ON TABLE public\.tracked_opens FROM anon/);
  assert.match(migration, /REVOKE INSERT ON TABLE public\.tracked_clicks FROM anon/);
  assert.match(migration, /CREATE UNIQUE INDEX.*tracked_opens.*message_type.*message_id/is);
  assert.match(migration, /CREATE UNIQUE INDEX.*tracked_clicks.*message_type.*message_id.*url/is);
});

test("campaign analytics query includes terminal delivery states", async () => {
  const analytics = await read("src/app/api/analytics/route.ts");
  assert.doesNotMatch(analytics, /from\("campaign_messages"\)[\s\S]{0,220}\.eq\("status", "sent"\)/);
  assert.match(analytics, /\.in\("status", SENT_STATUSES\)/);
  assert.match(analytics, /new Set\([\s\S]{0,40}opens\.map/);
  assert.match(analytics, /new Set\([\s\S]{0,40}clicks\.map/);
});

test("mock prospect data is impossible in production", () => {
  assert.equal(isMockDataEnabled({ NODE_ENV: "production", MOCK_DATA: "true" }), false);
  assert.equal(isMockDataEnabled({ NODE_ENV: "development", MOCK_DATA: "true" }), true);
  assert.equal(isMockDataEnabled({ NODE_ENV: "development", NEXT_PUBLIC_USE_MOCK_DATA: "true" }), false);
});
