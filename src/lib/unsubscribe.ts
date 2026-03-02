import { createHmac } from "crypto";

const SECRET =
  process.env.UNSUBSCRIBE_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "bookedout-unsub-secret";

/**
 * Generate an HMAC-signed unsubscribe token containing userId and email.
 * Token format: base64url(userId:email):signature
 */
export function generateUnsubscribeToken(
  userId: string,
  email: string
): string {
  const payload = Buffer.from(`${userId}:${email}`).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

/**
 * Verify and decode an unsubscribe token.
 * Returns { userId, email } on success, null on failure.
 */
export function verifyUnsubscribeToken(
  token: string
): { userId: string; email: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payload, sig] = parts;
  const expectedSig = createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");

  if (sig !== expectedSig) return null;

  try {
    const decoded = Buffer.from(payload, "base64url").toString("utf-8");
    const colonIndex = decoded.indexOf(":");
    if (colonIndex === -1) return null;

    return {
      userId: decoded.slice(0, colonIndex),
      email: decoded.slice(colonIndex + 1),
    };
  } catch {
    return null;
  }
}

/**
 * Build the full unsubscribe URL for inclusion in emails.
 */
export function buildUnsubscribeUrl(
  baseUrl: string,
  userId: string,
  email: string
): string {
  const token = generateUnsubscribeToken(userId, email);
  return `${baseUrl}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}
