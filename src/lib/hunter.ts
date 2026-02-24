export interface HunterResult {
  email: string;
  confidence: number;
  type: "personal" | "generic";
  first_name?: string;
  last_name?: string;
}

/**
 * Find emails for a domain using Hunter.io domain-search API.
 * Returns the highest-confidence email found, or null.
 */
export async function findEmailByDomain(
  apiKey: string,
  domain: string
): Promise<HunterResult | null> {
  // Strip protocol and paths from domain
  const cleanDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");

  const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(cleanDomain)}&api_key=${encodeURIComponent(apiKey)}&limit=5`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Hunter.io API error (${response.status}): ${text}`);
  }

  const json = await response.json();
  const emails: HunterResult[] = (json.data?.emails || []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => ({
      email: e.value,
      confidence: e.confidence ?? 0,
      type: e.type || "generic",
      first_name: e.first_name || undefined,
      last_name: e.last_name || undefined,
    })
  );

  if (emails.length === 0) return null;

  // Return highest confidence email
  emails.sort((a, b) => b.confidence - a.confidence);
  return emails[0];
}
