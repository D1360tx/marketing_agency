const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Common false positives to filter out
const BLACKLIST_PATTERNS = [
  /@example\./,
  /@test\./,
  /@localhost/,
  /@sentry\./,
  /@wixpress\./,
  /@w3\.org/,
  /@schema\.org/,
  /@googleusercontent\./,
  /@wordpress\./,
  /\.png$/,
  /\.jpg$/,
  /\.svg$/,
  /\.gif$/,
  /\.css$/,
  /\.js$/,
  /\.webp$/,
];

// Free email providers to deprioritize
const FREE_PROVIDERS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com"];

// Business email prefixes to prioritize
const BUSINESS_PREFIXES = ["info", "contact", "hello", "office", "service"];

// Common generic email prefixes for local businesses
const COMMON_PREFIXES = [
  "admin",
  "team",
  "hello",
  "hi",
  "mail",
  "office",
  "service",
  "support",
  "info",
  "contact",
  "sales",
  "help",
  "enquiries",
  "inquiries",
];

// Realistic browser headers to avoid bot detection
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
};

/**
 * Extracts email addresses from a website by fetching the homepage
 * and common contact pages, then parsing for email patterns.
 * If no emails are found via scraping, tries common email patterns.
 */
export async function extractEmails(websiteUrl: string): Promise<string[]> {
  const emailsBySource: { email: string; source: "mailto" | "content" }[] = [];

  // Normalize URL
  let baseUrl = websiteUrl;
  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`;
  }
  // Remove trailing slash
  baseUrl = baseUrl.replace(/\/$/, "");

  // Pages to check for emails
  const pagesToCheck = [
    baseUrl,
    `${baseUrl}/contact`,
    `${baseUrl}/contact-us`,
    `${baseUrl}/about`,
    `${baseUrl}/about-us`,
    `${baseUrl}/get-in-touch`,
    `${baseUrl}/reach-us`,
  ];

  for (const pageUrl of pagesToCheck) {
    try {
      const pageEmails = await extractEmailsFromPage(pageUrl);
      for (const item of pageEmails) {
        if (!emailsBySource.some((e) => e.email === item.email)) {
          emailsBySource.push(item);
        }
      }
    } catch {
      // Page doesn't exist or failed to load - skip
    }

    // Stop once we have some emails (no need to hit every page)
    if (emailsBySource.length >= 3) break;
  }

  // If no emails found via scraping, try Scrapling service (local ThinkPad, better JS rendering)
  if (emailsBySource.length === 0) {
    const scraplingEmail = await tryScraplingService(baseUrl);
    if (scraplingEmail) {
      emailsBySource.push({ email: scraplingEmail, source: "content" });
    }
  }

  // If still nothing, try common patterns
  if (emailsBySource.length === 0) {
    const domain = extractDomain(baseUrl);
    if (domain) {
      const guessedEmails = await guessCommonEmails(domain);
      guessedEmails.forEach((e) =>
        emailsBySource.push({ email: e, source: "content" })
      );
    }
  }

  // Rank and return
  const ranked = rankEmails(emailsBySource);
  return ranked;
}

/**
 * Fallback: call local Scrapling microservice on ThinkPad via Tailscale.
 * Uses Scrapling's stealth fetcher for JS-heavy / bot-protected sites.
 * Requires SCRAPLING_SERVICE_URL and SCRAPLING_SECRET env vars.
 */
async function tryScraplingService(url: string): Promise<string | null> {
  const serviceUrl = process.env.SCRAPLING_SERVICE_URL;
  const secret = process.env.SCRAPLING_SECRET;
  if (!serviceUrl || !secret) return null;

  try {
    const res = await fetch(`${serviceUrl}/extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${secret}`,
      },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.email || null;
  } catch {
    return null;
  }
}

/**
 * Rank emails by priority:
 * 1. mailto: links (highest confidence)
 * 2. Business prefixes (info@, contact@, etc.)
 * 3. Short emails (< 30 chars)
 * 4. Avoid free providers unless only option
 */
function rankEmails(
  emails: { email: string; source: "mailto" | "content" }[]
): string[] {
  if (emails.length === 0) return [];

  const scored = emails.map(({ email, source }) => {
    let score = 0;

    // Mailto links are highest confidence
    if (source === "mailto") score += 100;

    // Business prefix match
    const local = email.split("@")[0].toLowerCase();
    if (BUSINESS_PREFIXES.some((p) => local === p)) score += 50;

    // Short email
    if (email.length < 30) score += 20;

    // Penalize free providers
    const domain = email.split("@")[1]?.toLowerCase();
    if (FREE_PROVIDERS.includes(domain)) score -= 40;

    // Penalize numeric-only local part
    if (/^\d+$/.test(local)) score -= 50;

    return { email, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.email);
}

/**
 * Try common email patterns (info@, contact@, etc.) and verify
 * which ones have valid MX records for the domain.
 */
async function guessCommonEmails(domain: string): Promise<string[]> {
  // First check if the domain has MX records (can receive email)
  const hasMx = await domainHasMxRecords(domain);
  if (!hasMx) return [];

  // Return the most common patterns — we can't truly verify without sending,
  // but these are high-probability for local businesses
  const candidates = COMMON_PREFIXES.map((prefix) => `${prefix}@${domain}`);

  // Return top 3 most likely candidates
  return candidates.slice(0, 3);
}

/**
 * Check if a domain has MX records (can receive email).
 * Uses DNS-over-HTTPS to check from the server side.
 */
async function domainHasMxRecords(domain: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) return false;

    const data = await response.json();
    return (data.Answer?.length || 0) > 0;
  } catch {
    // If DNS check fails, assume the domain can receive email
    // (better to include a guess than miss an opportunity)
    return true;
  }
}

/**
 * Extract the root domain from a URL.
 * "https://www.example.com/about" → "example.com"
 */
function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Decode HTML-obfuscated email text (spammer tricks).
 */
function decodeObfuscation(html: string): string {
  return html
    .replace(/&#64;/g, "@")
    .replace(/&#46;/g, ".")
    .replace(/\[at\]/gi, "@")
    .replace(/\[dot\]/gi, ".");
}

async function extractEmailsFromPage(
  url: string
): Promise<{ email: string; source: "mailto" | "content" }[]> {
  // Try HTTPS first, fall back to HTTP if it fails
  let html: string | null = null;

  const tryFetch = async (fetchUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(fetchUrl, {
        headers: BROWSER_HEADERS,
        redirect: "follow",
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (!response.ok) return null;
      return await response.text();
    } catch {
      return null;
    }
  };

  html = await tryFetch(url);

  // HTTP fallback if HTTPS failed
  if (html === null && url.startsWith("https://")) {
    const httpUrl = url.replace(/^https:\/\//, "http://");
    html = await tryFetch(httpUrl);
  }

  if (html === null) return [];

  const emails: { email: string; source: "mailto" | "content" }[] = [];
  const seen = new Set<string>();

  const addEmail = (
    raw: string,
    source: "mailto" | "content"
  ) => {
    const email = raw.toLowerCase().trim();
    if (!seen.has(email) && isValidEmail(email)) {
      seen.add(email);
      emails.push({ email, source });
    }
  };

  // Decode obfuscated content before processing
  const decoded = decodeObfuscation(html);

  // 1. Extract from mailto: links (highest confidence)
  const mailtoMatches = decoded.match(
    /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
  );
  if (mailtoMatches) {
    for (const match of mailtoMatches) {
      addEmail(match.replace(/^mailto:/i, ""), "mailto");
    }
  }

  // 2. Look for data-email attributes
  const dataEmailMatches = decoded.match(
    /data-email=["']([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})["']/gi
  );
  if (dataEmailMatches) {
    for (const match of dataEmailMatches) {
      const emailMatch = match.match(
        /data-email=["']([^"']+)["']/i
      );
      if (emailMatch?.[1]) addEmail(emailMatch[1], "content");
    }
  }

  // 3. Look for schema.org / JSON-LD email fields
  const jsonLdMatches = decoded.match(
    /"email"\s*:\s*"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})"/gi
  );
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      const emailMatch = match.match(/"email"\s*:\s*"([^"]+)"/i);
      if (emailMatch?.[1]) addEmail(emailMatch[1], "content");
    }
  }

  // 4. Extract from page content via regex (general)
  const contentMatches = decoded.match(EMAIL_REGEX);
  if (contentMatches) {
    for (const match of contentMatches) {
      addEmail(match, "content");
    }
  }

  return emails;
}

function isValidEmail(email: string): boolean {
  // Filter out blacklisted patterns
  if (BLACKLIST_PATTERNS.some((pattern) => pattern.test(email))) {
    return false;
  }

  // Filter out very long emails (likely false positives)
  if (email.length > 60) return false;

  // Filter out emails with consecutive dots
  if (email.includes("..")) return false;

  return true;
}
