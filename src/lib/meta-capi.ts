/*
 * Server-side Meta Conversions API (CAPI) for inbound leads.
 *
 * Sends a Lead event with hashed customer details, the visitor's _fbc/_fbp
 * cookies, IP and user agent. It reuses the browser Pixel's event_id so Meta
 * deduplicates the pair. Skips quietly when the pixel ID or access token is
 * not configured. Self-contained (node:crypto only) so it can be unit tested.
 */

import { createHash } from "node:crypto";

export type MetaLeadInput = {
  eventId: string;
  eventTime?: number;
  eventSourceUrl?: string;
  email?: string;
  phone?: string;
  fullName?: string;
  city?: string;
  state?: string;
  externalId?: string;
  clientIp?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
};

type Env = Record<string, string | undefined>;

export type MetaSendResult =
  | { ok: true; status: number }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped?: false; status?: number; error: string };

const DEFAULT_GRAPH_VERSION = "v24.0";

export function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function normalizeEmail(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** Digits only with country code; 10-digit numbers are treated as US. */
export function normalizePhone(value: string | undefined): string {
  let digits = (value ?? "").replace(/\D/g, "");
  if (digits.length === 10) digits = `1${digits}`;
  return digits.length >= 11 && digits.length <= 15 ? digits : "";
}

function normalizeNamePart(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/[^\p{L}]/gu, "");
}

export function splitName(fullName: string | undefined): { first: string; last: string } {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    first: normalizeNamePart(parts[0]),
    last: parts.length > 1 ? normalizeNamePart(parts[parts.length - 1]) : "",
  };
}

/** "Austin, TX" -> { city: "austin", state: "tx" } */
export function parseServiceArea(value: string | undefined): { city: string; state: string } {
  const [cityPart = "", statePart = ""] = (value ?? "").split(",");
  const state = statePart.trim().toLowerCase();
  return {
    city: cityPart.trim().toLowerCase().replace(/[^\p{L}]/gu, ""),
    state: /^[a-z]{2}$/.test(state) ? state : "",
  };
}

function hashed(value: string): string[] | undefined {
  return value ? [sha256(value)] : undefined;
}

const FBC_PATTERN = /^fb\.\d\.\d{10,16}\.[A-Za-z0-9_\-.]{1,480}$/;
const FBP_PATTERN = /^fb\.\d\.\d{10,16}\.\d{1,30}$/;

export function buildMetaLeadPayload(input: MetaLeadInput, testEventCode?: string) {
  const name = splitName(input.fullName);
  const userData: Record<string, unknown> = {
    em: hashed(normalizeEmail(input.email)),
    ph: hashed(normalizePhone(input.phone)),
    fn: hashed(name.first),
    ln: hashed(name.last),
    ct: hashed((input.city ?? "").trim().toLowerCase().replace(/[^\p{L}]/gu, "")),
    st: hashed((input.state ?? "").trim().toLowerCase()),
    country: hashed("us"),
    external_id: hashed((input.externalId ?? "").trim()),
    client_ip_address: input.clientIp?.trim() || undefined,
    client_user_agent: input.userAgent?.trim().slice(0, 512) || undefined,
    fbc: input.fbc && FBC_PATTERN.test(input.fbc) ? input.fbc : undefined,
    fbp: input.fbp && FBP_PATTERN.test(input.fbp) ? input.fbp : undefined,
  };
  for (const key of Object.keys(userData)) {
    if (userData[key] === undefined) delete userData[key];
  }

  return {
    data: [
      {
        event_name: "Lead",
        event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
        user_data: userData,
        custom_data: { content_name: "Free audit" },
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };
}

export async function sendMetaLeadEvent(
  input: MetaLeadInput,
  env: Env = process.env,
  fetchImpl: typeof fetch = fetch
): Promise<MetaSendResult> {
  const pixelId = env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const token = env.META_CAPI_ACCESS_TOKEN?.trim();
  if (!pixelId || !token) return { ok: false, skipped: true, reason: "not configured" };
  if (!/^\d{5,20}$/.test(pixelId)) return { ok: false, skipped: true, reason: "invalid pixel id" };

  const version = env.META_GRAPH_API_VERSION?.trim() || DEFAULT_GRAPH_VERSION;
  if (!/^v\d{1,3}\.\d{1,2}$/.test(version)) {
    return { ok: false, skipped: true, reason: "invalid graph api version" };
  }

  const testEventCode = env.META_TEST_EVENT_CODE?.trim() || undefined;
  const body = { ...buildMetaLeadPayload(input, testEventCode), access_token: token };

  try {
    const response = await fetchImpl(`https://graph.facebook.com/${version}/${pixelId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return { ok: false, status: response.status, error: detail.slice(0, 300) };
    }
    return { ok: true, status: response.status };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "request failed" };
  }
}
