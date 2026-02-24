const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Common false positives to filter out
const BLACKLIST_PATTERNS = [
  /@example\./,
  /@test\./,
  /@localhost/,
  /@sentry\./,
  /@wixpress\./,
  /\.png$/,
  /\.jpg$/,
  /\.svg$/,
  /\.gif$/,
  /\.css$/,
  /\.js$/,
  /\.webp$/,
];

/**
 * Extracts email addresses from a website by fetching the homepage
 * and common contact pages, then parsing for email patterns.
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

  return Array.from(emails);
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

  // Extract from mailto: links
  const mailtoMatches = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi);
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
