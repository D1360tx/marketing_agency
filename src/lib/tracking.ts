import { createHmac, timingSafeEqual } from "node:crypto";

export type TrackingMessageType = "campaign" | "drip";
export type TrackingEventKind = "open" | "click";

export interface TrackingPayload {
  /** user_id (owner) */
  u: string;
  /** message type */
  t: TrackingMessageType;
  /** message_id */
  m: string;
  /** prospect_id */
  p: string;
  /** event kind */
  k: TrackingEventKind;
  /** signed click destination */
  d?: string;
  /** expiry in Unix milliseconds */
  exp: number;
}

type UnsignedTrackingPayload = Omit<TrackingPayload, "exp">;

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function configuredSecret(): string | null {
  const secret = process.env.TRACKING_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : null;
}

function sign(encodedPayload: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(encodedPayload).digest();
}

function isValidPayload(value: unknown): value is TrackingPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  if (!UUID_RE.test(String(payload.u))) return false;
  if (!UUID_RE.test(String(payload.m))) return false;
  if (!UUID_RE.test(String(payload.p))) return false;
  if (payload.t !== "campaign" && payload.t !== "drip") return false;
  if (payload.k !== "open" && payload.k !== "click") return false;
  if (!Number.isFinite(payload.exp)) return false;
  if (payload.k === "click") {
    return typeof payload.d === "string" && isSafeTrackingDestination(payload.d);
  }
  return payload.d === undefined;
}

export function isSafeTrackingDestination(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function createTrackingToken(
  payload: UnsignedTrackingPayload,
  secret: string,
  now = Date.now()
): string {
  const normalizedSecret = secret.trim();
  if (normalizedSecret.length < 32) {
    throw new Error("TRACKING_SECRET must contain at least 32 characters");
  }

  const fullPayload: TrackingPayload = {
    ...payload,
    exp: now + TOKEN_TTL_MS,
  };
  if (!isValidPayload(fullPayload)) {
    throw new Error("Invalid tracking payload");
  }

  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = sign(encodedPayload, normalizedSecret).toString("base64url");
  return `${encodedPayload}.${signature}`;
}

export function decodeToken(
  token: string,
  secret = process.env.TRACKING_SECRET || "",
  now = Date.now()
): TrackingPayload | null {
  try {
    const normalizedSecret = secret.trim();
    if (normalizedSecret.length < 32) return null;

    const parts = token.split(".");
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
    const [encodedPayload, encodedSignature] = parts;
    const suppliedSignature = Buffer.from(encodedSignature, "base64url");
    const expectedSignature = sign(encodedPayload, normalizedSecret);
    if (
      suppliedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(suppliedSignature, expectedSignature)
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    );
    if (!isValidPayload(payload) || payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

function createConfiguredToken(payload: UnsignedTrackingPayload): string | null {
  const secret = configuredSecret();
  if (!secret) return null;
  return createTrackingToken(payload, secret);
}

export function buildTrackingPixelUrl(
  baseUrl: string,
  params: {
    userId: string;
    messageType: TrackingMessageType;
    messageId: string;
    prospectId: string;
  }
): string | null {
  const token = createConfiguredToken({
    u: params.userId,
    t: params.messageType,
    m: params.messageId,
    p: params.prospectId,
    k: "open",
  });
  return token ? `${baseUrl}/api/track/open?t=${encodeURIComponent(token)}` : null;
}

export function buildTrackedUrl(
  baseUrl: string,
  originalUrl: string,
  params: {
    userId: string;
    messageType: TrackingMessageType;
    messageId: string;
    prospectId: string;
  }
): string {
  if (!isSafeTrackingDestination(originalUrl)) return originalUrl;
  const token = createConfiguredToken({
    u: params.userId,
    t: params.messageType,
    m: params.messageId,
    p: params.prospectId,
    k: "click",
    d: originalUrl,
  });
  return token
    ? `${baseUrl}/api/track/click?t=${encodeURIComponent(token)}`
    : originalUrl;
}

export function injectClickTracking(
  html: string,
  baseUrl: string,
  params: {
    userId: string;
    messageType: TrackingMessageType;
    messageId: string;
    prospectId: string;
  }
): string {
  return html.replace(
    /href="(https?:\/\/[^"]+)"/gi,
    (match, url: string) => {
      if (url.includes("/unsubscribe") || url.includes("/api/track/")) {
        return match;
      }
      return `href="${buildTrackedUrl(baseUrl, url, params)}"`;
    }
  );
}

export function buildTrackingPixelHtml(
  baseUrl: string,
  params: {
    userId: string;
    messageType: TrackingMessageType;
    messageId: string;
    prospectId: string;
  }
): string {
  const pixelUrl = buildTrackingPixelUrl(baseUrl, params);
  return pixelUrl
    ? `<img src="${pixelUrl}" width="1" height="1" style="display:none;width:1px;height:1px;border:0;" alt="" />`
    : "";
}
