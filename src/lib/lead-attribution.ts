/*
 * Turns validated lead tracking data into short, human-readable CRM note
 * lines, so every inbound lead keeps its source, campaign and click IDs.
 * Pure and dependency-free so it can be unit tested.
 */

type Touch = Record<string, string | undefined>;

export type LeadTracking = {
  eventId?: string;
  fbp?: string;
  fbc?: string;
  gaClientId?: string;
  pageUrl?: string;
  attribution?: { first?: Touch; last?: Touch };
};

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const CLICK_ID_KEYS = ["gclid", "gbraid", "wbraid", "fbclid", "msclkid"];

function line(value: string | undefined): string {
  return (value ?? "").replace(/[\r\n\t]+/g, " ").trim();
}

function describeTouch(touch: Touch | undefined): string {
  if (!touch) return "";
  const parts: string[] = [];
  for (const key of UTM_KEYS) {
    const value = line(touch[key]);
    if (value) parts.push(`${key.replace("utm_", "")}=${value}`);
  }
  if (!parts.length && touch.referrer) parts.push(`referrer=${line(touch.referrer)}`);
  if (!parts.length && CLICK_ID_KEYS.some((key) => touch[key])) parts.push("ad click (no UTMs)");
  return parts.join(" · ");
}

export function attributionNoteLines(tracking: LeadTracking | undefined): string[] {
  if (!tracking) return ["Attribution: none captured (direct or untracked visit)"];
  const lines: string[] = [];
  const last = tracking.attribution?.last;
  const first = tracking.attribution?.first;

  const lastDescription = describeTouch(last);
  lines.push(`Attribution (last touch): ${lastDescription || "direct or untracked visit"}`);

  const firstDescription = describeTouch(first);
  if (firstDescription && firstDescription !== lastDescription) {
    lines.push(`Attribution (first touch): ${firstDescription}`);
  }

  const clickIds = CLICK_ID_KEYS.map((key) => {
    const value = line(last?.[key] ?? first?.[key]);
    return value ? `${key}=${value}` : "";
  }).filter(Boolean);
  if (clickIds.length) lines.push(`Click IDs: ${clickIds.join(" · ")}`);

  const landing = line(last?.landing_page ?? first?.landing_page);
  if (landing) lines.push(`Landing page: ${landing}`);
  if (tracking.eventId) lines.push(`Conversion event ID: ${line(tracking.eventId)}`);
  return lines;
}
