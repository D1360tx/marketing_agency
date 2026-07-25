import assert from "node:assert/strict";
import test from "node:test";

import { verifyBearerSecret } from "../src/lib/server-auth.ts";

test("cron auth fails closed when CRON_SECRET is missing", () => {
  assert.deepEqual(verifyBearerSecret(null, undefined), {
    ok: false,
    status: 500,
    reason: "missing-secret",
  });
});

test("cron auth rejects a missing authorization header", () => {
  assert.deepEqual(verifyBearerSecret(null, "configured-secret"), {
    ok: false,
    status: 401,
    reason: "unauthorized",
  });
});

test("cron auth rejects the wrong bearer secret", () => {
  assert.deepEqual(verifyBearerSecret("Bearer wrong-secret", "configured-secret"), {
    ok: false,
    status: 401,
    reason: "unauthorized",
  });
});

test("cron auth accepts the exact configured bearer secret", () => {
  assert.deepEqual(
    verifyBearerSecret("Bearer configured-secret", "configured-secret"),
    { ok: true }
  );
});

test("cron auth trims deployment whitespace from the configured secret", () => {
  assert.deepEqual(
    verifyBearerSecret("Bearer configured-secret", "  configured-secret\n"),
    { ok: true }
  );
});