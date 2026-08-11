import {
  normalizePublicHttpUrl,
  safeFetchHtml,
} from "@/lib/generator-security";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
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
  /\.(?:png|jpe?g|svg|gif|css|js|webp)$/,
];
const FREE_PROVIDERS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
];
const BUSINESS_PREFIXES = ["info", "contact", "hello", "office", "service"];
const MAX_PAGE_BYTES = 256 * 1024;

type EmailCandidate = {
  email: string;
  source: "mailto" | "content";
};

/** Extract only email addresses observed on a business's public website. */
export async function extractEmails(websiteUrl: string): Promise<string[]> {
  const baseUrl = normalizePublicHttpUrl(websiteUrl);
  if (!baseUrl) return [];

  const pages = [
    baseUrl.href,
    new URL("/contact", baseUrl).href,
    new URL("/about", baseUrl).href,
  ];
  const candidates: EmailCandidate[] = [];

  for (const pageUrl of pages) {
    const pageCandidates = await extractEmailsFromPage(pageUrl);
    for (const candidate of pageCandidates) {
      if (!candidates.some((item) => item.email === candidate.email)) {
        candidates.push(candidate);
      }
    }
    if (candidates.length >= 3) break;
  }

  return rankEmails(candidates).slice(0, 3);
}

function decodeObfuscation(html: string): string {
  return html
    .replace(/&#64;/g, "@")
    .replace(/&#46;/g, ".")
    .replace(/\[at\]/gi, "@")
    .replace(/\[dot\]/gi, ".");
}

async function extractEmailsFromPage(url: string): Promise<EmailCandidate[]> {
  try {
    const response = await safeFetchHtml(url, {
      maxBytes: MAX_PAGE_BYTES,
      timeoutMs: 8_000,
    });
    if (response.status < 200 || response.status >= 300) return [];

    const html = decodeObfuscation(response.html);
    const seen = new Set<string>();
    const emails: EmailCandidate[] = [];
    const addEmail = (raw: string, source: EmailCandidate["source"]) => {
      const email = raw.toLowerCase().trim();
      if (!seen.has(email) && isValidEmail(email)) {
        seen.add(email);
        emails.push({ email, source });
      }
    };

    const mailtoRegex = /href=["']mailto:([^?"']+)/gi;
    for (const match of html.matchAll(mailtoRegex)) {
      addEmail(match[1], "mailto");
    }

    const visibleHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");
    for (const match of visibleHtml.match(EMAIL_REGEX) || []) {
      addEmail(match, "content");
    }
    return emails;
  } catch {
    return [];
  }
}

function isValidEmail(email: string): boolean {
  if (email.length > 254 || !email.includes("@")) return false;
  return !BLACKLIST_PATTERNS.some((pattern) => pattern.test(email));
}

function rankEmails(candidates: EmailCandidate[]): string[] {
  return candidates
    .map(({ email, source }) => {
      const [local, domain] = email.split("@");
      let score = source === "mailto" ? 100 : 0;
      if (BUSINESS_PREFIXES.includes(local)) score += 50;
      if (email.length < 30) score += 20;
      if (FREE_PROVIDERS.includes(domain)) score -= 40;
      if (/^\d+$/.test(local)) score -= 50;
      return { email, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ email }) => email);
}
