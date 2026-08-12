const GOOGLE_REVIEW_HOSTS = new Set([
  "g.page",
  "search.google.com",
  "www.google.com",
  "google.com",
  "maps.app.goo.gl",
]);

export function isGoogleReviewUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      GOOGLE_REVIEW_HOSTS.has(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

export function escapeEmailHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
