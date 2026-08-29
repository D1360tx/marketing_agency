import { createHash } from "node:crypto";
import { z } from "zod";

const normalizedText = (min: number, max: number) =>
  z
    .string()
    .transform((value) => value.normalize("NFKC").replace(/\r\n?/g, "\n").trim())
    .pipe(z.string().min(min).max(max));

const optionalNormalizedText = (max: number) =>
  z
    .string()
    .transform((value) => value.normalize("NFKC").replace(/\r\n?/g, "\n").trim())
    .pipe(z.string().max(max))
    .optional()
    .default("");

export const CLIENT_LEAD_TOKEN_PATTERN = /^[0-9a-f]{64}$/;
export const CLIENT_LEAD_DUPLICATE_RETRY_MS = 24 * 60 * 60 * 1000;
export const CLIENT_LEAD_MAX_ATTEMPTS = 5;
export const CLIENT_LEAD_STALE_CLAIM_SECONDS = 15 * 60;
export const SAME_ORIGIN_MODE = "same-origin";

export type ClientLeadDeliveryStatus =
  | "pending"
  | "sending"
  | "accepted"
  | "delivered"
  | "failed";
export type ClientLeadDeliveryResult = ClientLeadDeliveryStatus | "unknown";
export type ClientLeadChannel = "owner" | "ack";

export const clientLeadSubmissionSchema = z
  .object({
    submissionId: z.string().uuid(),
    fullName: normalizedText(1, 120),
    email: z.string().trim().toLowerCase().max(254).email(),
    phone: normalizedText(7, 32).refine(
      (value) => /^[0-9+().\-\s]+$/.test(value),
      "Invalid phone number"
    ),
    city: normalizedText(1, 120),
    service: normalizedText(1, 120),
    details: optionalNormalizedText(2000),
    companyWebsite: optionalNormalizedText(240),
    turnstileToken: optionalNormalizedText(2048),
  })
  .strict();

export function normalizeLeadCaptureAllowedOrigin(value: string): string | null {
  const candidate = value.trim();
  if (candidate === SAME_ORIGIN_MODE) return candidate;
  try {
    const url = new URL(candidate);
    if (
      url.protocol !== "https:" ||
      candidate !== url.origin ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

export const clientLeadRoutingSchema = z
  .object({
    recipient_email: z.string().trim().toLowerCase().max(254).email(),
    enabled: z.boolean(),
    allowed_origin: z
      .string()
      .trim()
      .max(255)
      .refine((value) => normalizeLeadCaptureAllowedOrigin(value) !== null, {
        message: "Use same-origin or an exact HTTPS origin without a path",
      })
      .transform((value) => normalizeLeadCaptureAllowedOrigin(value) as string),
    rotate_token: z.boolean().optional().default(false),
    revoke_token: z.boolean().optional().default(false),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.rotate_token && value.revoke_token) {
      ctx.addIssue({ code: "custom", message: "Rotate and revoke are mutually exclusive" });
    }
    if (value.enabled && value.revoke_token) {
      ctx.addIssue({ code: "custom", message: "A revoked route cannot be enabled" });
    }
  });

export type ClientLeadSubmission = z.infer<typeof clientLeadSubmissionSchema>;

export function isValidClientLeadToken(token: string): boolean {
  return CLIENT_LEAD_TOKEN_PATTERN.test(token);
}

export function isClientLeadDeliveryComplete(status: ClientLeadDeliveryStatus): boolean {
  return status === "accepted" || status === "delivered";
}

export function clientLeadIdempotencyKey(leadId: string, channel: ClientLeadChannel): string {
  return `${leadId}:${channel}:v1`;
}

export function clientLeadRetryDelaySeconds(attemptCount: number): number {
  const exponent = Math.max(0, Math.min(attemptCount - 1, 6));
  return Math.min(6 * 60 * 60, 60 * 2 ** exponent);
}

export function allowedCorsOrigin(
  requestOrigin: string | null,
  requestUrl: string,
  configuredOrigin: string
): string | null {
  if (!requestOrigin) return null;
  if (configuredOrigin === SAME_ORIGIN_MODE) {
    return requestOrigin === new URL(requestUrl).origin ? requestOrigin : null;
  }
  return requestOrigin === configuredOrigin ? requestOrigin : null;
}

export function isLeadRequestOriginAllowed(
  requestOrigin: string | null,
  requestUrl: string,
  configuredOrigin: string
): boolean {
  if (!requestOrigin) return configuredOrigin === SAME_ORIGIN_MODE;
  return allowedCorsOrigin(requestOrigin, requestUrl, configuredOrigin) !== null;
}

export function leadCorsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

export function escapeEmailHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildClientLeadDuplicateHash(input: ClientLeadSubmission): string {
  const canonical = [
    input.email,
    input.phone.replace(/\D/g, ""),
    input.fullName.toLocaleLowerCase("en-US"),
    input.city.toLocaleLowerCase("en-US"),
    input.service.toLocaleLowerCase("en-US"),
    input.details.toLocaleLowerCase("en-US"),
  ].join("\u001f");
  return createHash("sha256").update(canonical).digest("hex");
}

export function shouldRetryDuplicateDelivery(
  createdAt: string,
  ownerStatus: ClientLeadDeliveryStatus,
  acknowledgmentStatus: ClientLeadDeliveryStatus,
  now = new Date()
): boolean {
  const created = Date.parse(createdAt);
  if (!Number.isFinite(created) || now.getTime() - created > CLIENT_LEAD_DUPLICATE_RETRY_MS) {
    return false;
  }
  return !isClientLeadDeliveryComplete(ownerStatus) || !isClientLeadDeliveryComplete(acknowledgmentStatus);
}

export function buildOwnerNotificationHtml(appUrl: string, leadId: string): string {
  const baseUrl = appUrl.replace(/\/$/, "");
  return `<!doctype html><html><body style="font-family:Arial,sans-serif">
<h2>New website inquiry saved</h2>
<p>A new inquiry is available in your authenticated Booked Out dashboard.</p>
<p>Contact details are intentionally omitted from this notification.</p>
<p><a href="${escapeEmailHtml(`${baseUrl}/app/client-leads?lead=${leadId}`)}">Review the inquiry securely</a></p>
</body></html>`;
}

export function buildLeadAcknowledgmentHtml(
  fullName: string,
  businessName: string | null
): string {
  const greeting = fullName.split(/\s+/)[0] || "there";
  const business = businessName || "the business";
  return `<!doctype html><html><body style="font-family:Arial,sans-serif">
<p>Hi ${escapeEmailHtml(greeting)},</p>
<p>Your request was saved and shared with ${escapeEmailHtml(business)}.</p>
<p>This email confirms receipt only; it does not promise a response time or service availability.</p>
</body></html>`;
}
