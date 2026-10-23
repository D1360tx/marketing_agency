/*
 * First-party ad attribution for public marketing pages.
 *
 * Captures UTM parameters and ad click IDs (fbclid, gclid, gbraid, wbraid,
 * msclkid) when a visitor lands, keeps a first-touch and last-touch copy in
 * localStorage, and builds the tracking payload sent with lead forms so the
 * server can save the source on the lead and send deduplicated conversion
 * events. Query strings are never stored except for the whitelisted keys.
 */

export const ATTRIBUTION_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
  "gbraid",
  "wbraid",
  "msclkid",
] as const;

export type AttributionParam = (typeof ATTRIBUTION_PARAMS)[number];

export type AttributionTouch = Partial<Record<AttributionParam, string>> & {
  landing_page?: string;
  referrer?: string;
  captured_at?: string;
};

export type AttributionSnapshot = {
  first?: AttributionTouch;
  last?: AttributionTouch;
};

export type LeadTrackingPayload = {
  eventId: string;
  fbp?: string;
  fbc?: string;
  gaClientId?: string;
  pageUrl?: string;
  attribution?: AttributionSnapshot;
};

const STORAGE_KEY = "bo_attribution_v1";
const MAX_VALUE_LENGTH = 200;
const FBC_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

function clean(value: string | null | undefined): string {
  return (value ?? "").replace(/[\r\n\t]/g, " ").trim().slice(0, MAX_VALUE_LENGTH);
}

function originAndPath(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return clean(`${url.origin}${url.pathname}`);
  } catch {
    return "";
  }
}

/**
 * Builds an attribution touch from a landing URL. Returns null when the visit
 * carries no campaign parameters and no external referrer, so internal
 * navigation never overwrites a real ad touch.
 */
export function touchFromUrl(
  href: string,
  referrer: string,
  now: Date = new Date()
): AttributionTouch | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }

  const touch: AttributionTouch = {};
  let hasCampaignParam = false;
  for (const key of ATTRIBUTION_PARAMS) {
    const value = clean(url.searchParams.get(key));
    if (value) {
      touch[key] = value;
      hasCampaignParam = true;
    }
  }

  let externalReferrer = "";
  if (referrer) {
    try {
      if (new URL(referrer).host !== url.host) externalReferrer = originAndPath(referrer);
    } catch {
      externalReferrer = "";
    }
  }

  if (!hasCampaignParam && !externalReferrer) return null;
  touch.landing_page = originAndPath(href);
  if (externalReferrer) touch.referrer = externalReferrer;
  touch.captured_at = now.toISOString();
  return touch;
}

/** Meta's documented click-ID cookie format: fb.1.<creation ms>.<fbclid>. */
export function buildFbc(fbclid: string, now: Date = new Date()): string {
  return `fb.1.${now.getTime()}.${fbclid}`;
}

/** Extracts the GA4 client ID ("123.456") from a _ga cookie ("GA1.1.123.456"). */
export function gaClientIdFromCookie(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = value.match(/^GA\d\.\d+\.(\d+\.\d+)$/);
  return match ? match[1] : undefined;
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      try {
        return decodeURIComponent(trimmed.slice(prefix.length));
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

function readSnapshot(): AttributionSnapshot {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AttributionSnapshot;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeSnapshot(snapshot: AttributionSnapshot) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Private mode or blocked storage: attribution still works for this page view.
  }
}

let memorySnapshot: AttributionSnapshot = {};

/**
 * Call once per page load on public pages. Records the touch, and sets the
 * _fbc cookie from fbclid so Meta can match server events to the ad click
 * even if the pixel is blocked or loads late.
 */
export function captureAttribution(): AttributionSnapshot {
  if (typeof window === "undefined") return {};
  const stored = readSnapshot();
  const touch = touchFromUrl(window.location.href, document.referrer);
  const snapshot: AttributionSnapshot = touch
    ? { first: stored.first ?? touch, last: touch }
    : stored;
  if (touch) writeSnapshot(snapshot);
  memorySnapshot = snapshot;

  if (touch?.fbclid) {
    const existing = readCookie("_fbc");
    if (!existing || !existing.endsWith(`.${touch.fbclid}`)) {
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `_fbc=${encodeURIComponent(buildFbc(touch.fbclid))}; Max-Age=${FBC_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
    }
  }
  return snapshot;
}

export function newEventId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Everything the lead API needs to attribute and deduplicate a conversion. */
export function leadTrackingPayload(eventId: string): LeadTrackingPayload {
  if (typeof window === "undefined") return { eventId };
  const snapshot = Object.keys(memorySnapshot).length ? memorySnapshot : readSnapshot();
  const payload: LeadTrackingPayload = {
    eventId,
    pageUrl: originAndPath(window.location.href) || undefined,
  };
  const fbp = readCookie("_fbp");
  const fbc = readCookie("_fbc");
  const gaClientId = gaClientIdFromCookie(readCookie("_ga"));
  if (fbp) payload.fbp = clean(fbp);
  if (fbc) payload.fbc = fbc.slice(0, 500);
  if (gaClientId) payload.gaClientId = gaClientId;
  if (snapshot.first || snapshot.last) payload.attribution = snapshot;
  return payload;
}
