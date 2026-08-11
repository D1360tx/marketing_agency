import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";

const SHARE_TOKEN_RE = /^[a-f0-9]{32}$/;
const DEFAULT_MAX_BYTES = 512 * 1024;
const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 3;

export function isValidShareToken(token: string): boolean {
  return SHARE_TOKEN_RE.test(token);
}

export function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase().split("%")[0];
  if (normalized.startsWith("::ffff:")) {
    return isPrivateAddress(normalized.slice(7));
  }

  if (isIP(normalized) === 4) {
    const parts = normalized.split(".").map(Number);
    const [a, b] = parts;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }

  if (isIP(normalized) === 6) {
    return (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized) ||
      normalized.startsWith("ff") ||
      normalized.startsWith("2001:db8:")
    );
  }

  return true;
}

export function normalizePublicHttpUrl(input: string): URL | null {
  try {
    const trimmed = input.trim();
    const url = new URL(
      /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
        ? trimmed
        : `https://${trimmed}`
    );
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (
      url.hostname === "localhost" ||
      url.hostname.endsWith(".localhost") ||
      url.hostname.endsWith(".local")
    ) {
      return null;
    }
    if (isIP(url.hostname) && isPrivateAddress(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

async function resolvePublicAddress(url: URL) {
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some((entry) => isPrivateAddress(entry.address))) {
    throw new Error("Target does not resolve to a public address");
  }
  return addresses[0];
}

export type SafeHtmlResponse = {
  url: URL;
  status: number;
  html: string;
};

export async function safeFetchHtml(
  input: string | URL,
  options: {
    maxBytes?: number;
    timeoutMs?: number;
    redirects?: number;
  } = {}
): Promise<SafeHtmlResponse> {
  const url =
    input instanceof URL ? normalizePublicHttpUrl(input.href) : normalizePublicHttpUrl(input);
  if (!url) throw new Error("Only public HTTP(S) URLs are allowed");

  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const redirects = options.redirects ?? MAX_REDIRECTS;
  const resolved = await resolvePublicAddress(url);
  const requestImpl = url.protocol === "https:" ? httpsRequest : httpRequest;

  return new Promise((resolve, reject) => {
    const req = requestImpl(
      {
        protocol: url.protocol,
        hostname: resolved.address,
        family: resolved.family,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: "GET",
        servername: url.hostname,
        headers: {
          Host: url.host,
          "User-Agent": "Booked Out Preview Builder/1.0",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Encoding": "identity",
        },
      },
      async (response) => {
        const status = response.statusCode || 0;
        const location = response.headers.location;
        if ([301, 302, 303, 307, 308].includes(status) && location) {
          response.resume();
          if (redirects <= 0) {
            reject(new Error("Too many redirects"));
            return;
          }
          try {
            const redirected = new URL(location, url);
            resolve(
              await safeFetchHtml(redirected, {
                maxBytes,
                timeoutMs,
                redirects: redirects - 1,
              })
            );
          } catch (error) {
            reject(error);
          }
          return;
        }

        const contentType = String(response.headers["content-type"] || "").toLowerCase();
        if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
          response.resume();
          reject(new Error("Target did not return HTML"));
          return;
        }

        const declaredLength = Number(response.headers["content-length"] || 0);
        if (declaredLength > maxBytes) {
          response.resume();
          reject(new Error("HTML response is too large"));
          return;
        }

        const chunks: Buffer[] = [];
        let totalBytes = 0;
        response.on("data", (chunk: Buffer) => {
          totalBytes += chunk.length;
          if (totalBytes > maxBytes) {
            req.destroy(new Error("HTML response is too large"));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => {
          resolve({
            url,
            status,
            html: Buffer.concat(chunks).toString("utf8"),
          });
        });
        response.on("error", reject);
      }
    );

    req.setTimeout(timeoutMs, () => req.destroy(new Error("Website request timed out")));
    req.on("error", reject);
    req.end();
  });
}

function visibleText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

const HIGH_RISK_CLAIMS = [
  { label: "licensed", pattern: /\blicen[cs](?:e|ed|ing|ure)\b/i, source: /\blicen[cs]/i },
  { label: "insured", pattern: /\binsured\b/i, source: /\binsur(?:ed|ance)\b/i },
  { label: "bonded", pattern: /\bbonded\b/i, source: /\bbonded\b/i },
  { label: "certified", pattern: /\bcertif(?:ied|ication)\b/i, source: /\bcertif/i },
  { label: "award-winning", pattern: /\baward[- ]winning\b/i, source: /\baward[- ]winning\b/i },
  { label: "family-owned", pattern: /\bfamily[- ]owned\b/i, source: /\bfamily[- ]owned\b/i },
  { label: "24/7", pattern: /\b24\s*\/\s*7\b/i, source: /\b24\s*\/\s*7\b/i },
];

export function findUnsupportedClaims(html: string, sourceText: string): string[] {
  const output = visibleText(html);
  const source = sourceText.toLowerCase();
  const issues = HIGH_RISK_CLAIMS.filter(
    (claim) => claim.pattern.test(output) && !claim.source.test(source)
  ).map((claim) => claim.label);

  const quantifiedClaims = output.match(/\b\d+[+]?\s+(?:years?|projects?|clients?|reviews?)\b/gi) || [];
  if (quantifiedClaims.some((claim) => !source.includes(claim.toLowerCase()))) {
    issues.push("unsupported quantified claim");
  }
  return issues;
}
