/**
 * Email tracking utilities.
 * Generates tracking pixels and click-tracked URLs using
 * base64-encoded JSON tokens (no DB lookup needed to decode).
 */

interface TrackingPayload {
  /** user_id (owner) */
  u: string;
  /** message type: 'campaign' | 'drip' */
  t: "campaign" | "drip";
  /** message_id */
  m: string;
  /** prospect_id */
  p: string;
}

/**
 * Encode a tracking payload into a URL-safe token.
 */
function encodeToken(payload: TrackingPayload): string {
  const json = JSON.stringify(payload);
  // Use base64url encoding (URL-safe, no padding)
  return Buffer.from(json)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Decode a tracking token back to its payload.
 */
export function decodeToken(token: string): TrackingPayload | null {
  try {
    const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Generate a tracking pixel URL for email open tracking.
 */
export function buildTrackingPixelUrl(
  baseUrl: string,
  params: {
    userId: string;
    messageType: "campaign" | "drip";
    messageId: string;
    prospectId: string;
  }
): string {
  const token = encodeToken({
    u: params.userId,
    t: params.messageType,
    m: params.messageId,
    p: params.prospectId,
  });
  return `${baseUrl}/api/track/open?t=${token}`;
}

/**
 * Generate a click-tracked URL that redirects to the original URL.
 */
export function buildTrackedUrl(
  baseUrl: string,
  originalUrl: string,
  params: {
    userId: string;
    messageType: "campaign" | "drip";
    messageId: string;
    prospectId: string;
  }
): string {
  const token = encodeToken({
    u: params.userId,
    t: params.messageType,
    m: params.messageId,
    p: params.prospectId,
  });
  return `${baseUrl}/api/track/click?t=${token}&url=${encodeURIComponent(originalUrl)}`;
}

/**
 * Wrap all links in HTML content with click tracking URLs.
 * Skips mailto: links and unsubscribe URLs.
 */
export function injectClickTracking(
  html: string,
  baseUrl: string,
  params: {
    userId: string;
    messageType: "campaign" | "drip";
    messageId: string;
    prospectId: string;
  }
): string {
  // Match href="..." in anchor tags
  return html.replace(
    /href="(https?:\/\/[^"]+)"/gi,
    (match, url: string) => {
      // Skip unsubscribe and tracking URLs
      if (
        url.includes("/unsubscribe") ||
        url.includes("/api/track/")
      ) {
        return match;
      }

      const trackedUrl = buildTrackedUrl(baseUrl, url, params);
      return `href="${trackedUrl}"`;
    }
  );
}

/**
 * Generate the tracking pixel HTML img tag.
 */
export function buildTrackingPixelHtml(
  baseUrl: string,
  params: {
    userId: string;
    messageType: "campaign" | "drip";
    messageId: string;
    prospectId: string;
  }
): string {
  const pixelUrl = buildTrackingPixelUrl(baseUrl, params);
  return `<img src="${pixelUrl}" width="1" height="1" style="display:none;width:1px;height:1px;border:0;" alt="" />`;
}
