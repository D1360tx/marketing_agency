const PLACEHOLDER_MARKERS = ["example.com", "your-", "replace-", "placeholder"];

export function validateRevenueDestination(raw: string | undefined): URL | null {
  const value = raw?.trim();
  if (!value || PLACEHOLDER_MARKERS.some((marker) => value.toLowerCase().includes(marker))) {
    return null;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (url.hostname === "trybookedout.com" || url.hostname.endsWith(".trybookedout.com")) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}
