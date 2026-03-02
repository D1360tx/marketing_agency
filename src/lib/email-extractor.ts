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

// Common generic email prefixes for local businesses
const COMMON_PREFIXES = [
  "info",
  "contact",
  "hello",
  "office",
  "support",
  "admin",
  "sales",
  "service",
  "help",
  "team",
  "mail",
  "enquiries",
  "inquiries",
];

/**
 * Extracts email addresses from a website by fetching the homepage
 * and common contact pages, then parsing for email patterns.
 * If no emails are found via scraping, tries common email patterns.
 */
export async function extractEmails(websiteUrl: string): Promise<string[]> {
  const emails = new Set<string>();

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
  ];

  for (const pageUrl of pagesToCheck) {
    try {
      const pageEmails = await extractEmailsFromPage(pageUrl);
      pageEmails.forEach((e) => emails.add(e));
    } catch {
      // Page doesn't exist or failed to load - skip
    }

    // Stop once we have some emails (no need to hit every page)
    if (emails.size >= 3) break;
  }

  // If no emails found via scraping, try common patterns
  if (emails.size === 0) {
    const domain = extractDomain(baseUrl);
    if (domain) {
      const guessedEmails = await guessCommonEmails(domain);
      guessedEmails.forEach((e) => emails.add(e));
    }
  }

  return Array.from(emails);
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
  const candidates = COMMON_PREFIXES.slice(0, 5).map(
    (prefix) => `${prefix}@${domain}`
  );

  // Return first 2 most likely candidates
  return candidates.slice(0, 2);
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

async function extractEmailsFromPage(url: string): Promise<string[]> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; AgencyFlow/1.0; +https://agencyflow.app)",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(10000), // 10s timeout
  });

  if (!response.ok) return [];

  const html = await response.text();
  const emails = new Set<string>();

  // Extract from mailto: links (highest confidence)
  const mailtoMatches = html.match(
    /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
  );
  if (mailtoMatches) {
    for (const match of mailtoMatches) {
      const email = match.replace(/^mailto:/i, "").toLowerCase();
      if (isValidEmail(email)) {
        emails.add(email);
      }
    }
  }

  // Extract from page content via regex
  const contentMatches = html.match(EMAIL_REGEX);
  if (contentMatches) {
    for (const match of contentMatches) {
      const email = match.toLowerCase();
      if (isValidEmail(email)) {
        emails.add(email);
      }
    }
  }

  return Array.from(emails);
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
