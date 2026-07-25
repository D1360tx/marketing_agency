import { timingSafeEqual } from "node:crypto";

export type BearerAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 500; reason: "unauthorized" | "missing-secret" };

function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

/**
 * Fail-closed bearer-token verification for server-to-server endpoints.
 * A missing server secret is a deployment error, never an auth bypass.
 */
export function verifyBearerSecret(
  authorizationHeader: string | null,
  configuredSecret: string | undefined
): BearerAuthResult {
  const secret = configuredSecret?.trim();
  if (!secret) {
    return { ok: false, status: 500, reason: "missing-secret" };
  }

  const expected = `Bearer ${secret}`;
  if (!authorizationHeader || !constantTimeEqual(authorizationHeader, expected)) {
    return { ok: false, status: 401, reason: "unauthorized" };
  }

  return { ok: true };
}