import { createHmac, timingSafeEqual } from "node:crypto";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_TTL_SECONDS = 180 * 24 * 60 * 60;

type UnsubscribePayload = {
  u: string;
  e: string;
  exp: number;
};

function configuredSecret(): string {
  return (
    process.env.UNSUBSCRIBE_SECRET?.trim() ||
    process.env.TRACKING_SECRET?.trim() ||
    ""
  );
}

function requireSecret(secret: string): string {
  const normalized = secret.trim();
  if (normalized.length < 32) {
    throw new Error("Unsubscribe signing secret is not configured");
  }
  return normalized;
}

function sign(payload: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(payload).digest();
}

function validPayload(value: unknown): value is UnsubscribePayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<UnsubscribePayload>;
  return (
    typeof payload.u === "string" &&
    UUID_RE.test(payload.u) &&
    typeof payload.e === "string" &&
    payload.e.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.e) &&
    typeof payload.exp === "number" &&
    Number.isSafeInteger(payload.exp)
  );
}

export function generateUnsubscribeToken(
  userId: string,
  email: string,
  secret = configuredSecret(),
  now = Date.now(),
  ttlSeconds = DEFAULT_TTL_SECONDS
): string {
  const normalizedSecret = requireSecret(secret);
  const payload: UnsubscribePayload = {
    u: userId,
    e: email.trim().toLowerCase(),
    exp: now + ttlSeconds * 1000,
  };
  if (!validPayload(payload) || ttlSeconds <= 0) {
    throw new Error("Invalid unsubscribe token payload");
  }

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, normalizedSecret).toString("base64url")}`;
}

export function verifyUnsubscribeToken(
  token: string,
  secret = configuredSecret(),
  now = Date.now()
): { userId: string; email: string } | null {
  try {
    const normalizedSecret = requireSecret(secret);
    if (!token || token.length > 4096) return null;
    const parts = token.split(".");
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

    const supplied = Buffer.from(parts[1], "base64url");
    const expected = sign(parts[0], normalizedSecret);
    if (
      supplied.length !== expected.length ||
      !timingSafeEqual(supplied, expected)
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(parts[0], "base64url").toString("utf8")
    );
    if (!validPayload(payload) || payload.exp < now) return null;
    return { userId: payload.u, email: payload.e };
  } catch {
    return null;
  }
}

export function buildUnsubscribeUrl(
  baseUrl: string,
  userId: string,
  email: string
): string {
  const token = generateUnsubscribeToken(userId, email);
  return `${baseUrl}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}
