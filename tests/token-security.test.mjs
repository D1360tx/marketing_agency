import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
} from "../src/lib/unsubscribe.ts";
import { safeRelativePath } from "../src/lib/safe-redirect.ts";

const root = new URL("../", import.meta.url);
const read = async (path) => readFile(new URL(path, root), "utf8");
const secret = "u".repeat(32);
const userId = "11111111-1111-4111-8111-111111111111";

test("unsubscribe tokens are signed, normalized, and expiring", () => {
  const token = generateUnsubscribeToken(userId, "Owner@Example.com", secret, 1_000, 60);
  assert.deepEqual(verifyUnsubscribeToken(token, secret, 30_000), {
    userId,
    email: "owner@example.com",
  });
  assert.equal(verifyUnsubscribeToken(token, secret, 61_001), null);
  assert.equal(verifyUnsubscribeToken(`${token.slice(0, -1)}x`, secret, 30_000), null);
});

test("unsubscribe tokens refuse short or missing secrets", () => {
  assert.throws(() => generateUnsubscribeToken(userId, "a@example.com", "short"));
  assert.equal(verifyUnsubscribeToken("a.b", "short"), null);
});

test("auth callback destinations remain same-origin", () => {
  assert.equal(safeRelativePath("/app/leads?status=new"), "/app/leads?status=new");
  assert.equal(safeRelativePath("//evil.example"), "/app");
  assert.equal(safeRelativePath("https://evil.example"), "/app");
  assert.equal(safeRelativePath("/\\evil.example"), "/app");
  assert.equal(safeRelativePath(null), "/app");
});

test("unsubscribe has no public or hardcoded secret fallback", async () => {
  const source = await read("src/lib/unsubscribe.ts");
  assert.doesNotMatch(source, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(source, /bookedout-unsub-secret/);
  assert.match(source, /timingSafeEqual/);
});

test("public unsubscribe writes use the service role and anon inserts are revoked", async () => {
  const route = await read("src/app/api/unsubscribe/route.ts");
  const migration = await read("supabase/migrations/029_secure_unsubscribe.sql");
  assert.match(route, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(route, /verifyUnsubscribeToken/);
  assert.match(migration, /DROP POLICY IF EXISTS "Allow public unsubscribe inserts"/);
  assert.match(migration, /REVOKE INSERT ON TABLE public\.unsubscribes FROM anon/);
});
