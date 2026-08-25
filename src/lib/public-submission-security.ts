import { createHmac } from "node:crypto";
import { z } from "zod";

export const PUBLIC_SUBMISSION_MAX_BYTES = 16 * 1024;
export const PUBLIC_SUBMISSION_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

const optionalText = (max: number) => z.string().trim().max(max).optional().default("");
const optionalHttpUrl = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .max(2048)
      .url()
      .refine((value) => {
        const protocol = new URL(value).protocol;
        return protocol === "http:" || protocol === "https:";
      }, "Only HTTP(S) URLs are allowed"),
  ])
  .optional()
  .default("");

export const inboundLeadSchema = z
  .object({
    business_name: optionalText(160),
    business: optionalText(160),
    website: optionalHttpUrl,
    email: z.string().trim().toLowerCase().max(254).email(),
    phone: z
      .union([
        z.literal(""),
        z.string().trim().min(7).max(32).regex(/^[0-9+().\-\s]+$/, "Invalid phone number"),
      ])
      .optional()
      .default(""),
    name: optionalText(120),
    source: optionalText(80),
    city: optionalText(120),
    businessType: optionalText(120),
    serviceArea: optionalText(120),
    googleProfile: optionalHttpUrl,
    smsConsent: z.boolean().optional().default(false),
    turnstileToken: optionalText(2048),
    contact_time: optionalText(120),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.business_name && !value.business) {
      ctx.addIssue({
        code: "custom",
        path: ["business"],
        message: "Business name is required",
      });
    }
  });

export type InboundLeadInput = z.infer<typeof inboundLeadSchema>;

type BoundedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413; error: string };

export async function readBoundedJson(
  request: Request,
  maxBytes = PUBLIC_SUBMISSION_MAX_BYTES
): Promise<BoundedJsonResult> {
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { ok: false, status: 413, error: "Request body is too large" };
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > maxBytes) {
    return { ok: false, status: 413, error: "Request body is too large" };
  }

  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON payload" };
  }
}

export function getTrustedClientAddress(request: Request): string {
  const vercelAddress = request.headers
    .get("x-vercel-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  if (vercelAddress) return vercelAddress;

  if (process.env.NODE_ENV !== "production") {
    return (
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "local-development"
    );
  }

  return "vercel-unknown-client";
}

export function createPublicRateLimitKey(
  request: Request,
  secret: string
): string {
  const address = getTrustedClientAddress(request);
  const userAgent = (request.headers.get("user-agent") || "unknown").slice(0, 240);
  return createHmac("sha256", secret)
    .update(`${address}|${userAgent}`)
    .digest("hex");
}

type RateLimitClient = {
  rpc: (
    functionName: string,
    args: Record<string, string | number>
  ) => Promise<{ data: boolean | null; error: { message?: string } | null }>;
};

type RateLimitResult =
  | { ok: true }
  | { ok: false; status: 429 | 503; error: string };

export async function consumePublicRateLimit(
  request: Request,
  supabase: RateLimitClient,
  route: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const secret =
    process.env.PUBLIC_RATE_LIMIT_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.error("[public-rate-limit] Missing PUBLIC_RATE_LIMIT_SECRET/CRON_SECRET");
    return { ok: false, status: 503, error: "Lead protection is not configured" };
  }

  const keyHash = createPublicRateLimitKey(request, secret);
  const { data, error } = await supabase.rpc("consume_public_rate_limit", {
    p_route: route,
    p_key_hash: keyHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error || typeof data !== "boolean") {
    console.error("[public-rate-limit] RPC failed:", error?.message || "invalid response");
    return { ok: false, status: 503, error: "Lead protection is unavailable" };
  }

  if (!data) {
    return { ok: false, status: 429, error: "Too many requests. Please try again later." };
  }

  return { ok: true };
}

type TurnstileResult =
  | { ok: true }
  | { ok: false; status: 400 | 503; error: string };

export async function verifyTurnstileToken(
  token: string,
  request: Request,
  expectedAction: string
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (!secret && !siteKey) return { ok: true };
  if (!secret || !siteKey) {
    console.warn(
      "[turnstile] Partial configuration detected; relying on the server-side public rate limit"
    );
    return { ok: true };
  }
  if (!token) {
    return { ok: false, status: 400, error: "Please complete the security check" };
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret,
          response: token,
          remoteip: getTrustedClientAddress(request),
        }),
        cache: "no-store",
      }
    );
    const result = (await response.json()) as {
      success?: boolean;
      action?: string;
    };

    if (!response.ok || !result.success) {
      return { ok: false, status: 400, error: "Security check failed" };
    }
    if (result.action && result.action !== expectedAction) {
      return { ok: false, status: 400, error: "Security check action mismatch" };
    }
    return { ok: true };
  } catch (error) {
    console.error("[turnstile] Verification failed:", error);
    return { ok: false, status: 503, error: "Security check is unavailable" };
  }
}
