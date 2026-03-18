import type { Prospect } from "@/types";

const ACTOR_ID = "compass~crawler-google-places";

interface ApifyPlaceResult {
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phoneUnformatted?: string;
  phone?: string;
  website?: string;
  url?: string;
  totalScore?: number;
  reviewsCount?: number;
  categoryName?: string;
  categories?: string[];
  location?: { lat: number; lng: number };
}

/**
 * Search for local businesses using Apify's Google Maps Scraper.
 * Returns richer data than Brave: ratings, review counts, categories.
 * Actor: compass/crawler-google-places
 * Cost: ~$4-6 per 1,000 results (free plan: $5/month credit)
 */
export async function searchBusinessesApify(
  apiKey: string,
  query: string,
  location: string,
  limit: number = 40
): Promise<Partial<Prospect>[]> {
  const searchString = `${query} ${location}`;

  // Start the actor run
  const startRes = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${apiKey}&timeout=120&memory=512`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchStringsArray: [searchString],
        maxCrawledPlacesPerSearch: limit,
        language: "en",
        countryCode: "us",
        includeWebResults: false,
        scrapeDirectories: false,
        deeperCityScrape: false,
      }),
      signal: AbortSignal.timeout(130000), // 2min+ timeout for actor to complete
    }
  );

  if (!startRes.ok) {
    const errText = await startRes.text();
    throw new Error(`Apify API error (${startRes.status}): ${errText}`);
  }

  const results: ApifyPlaceResult[] = await startRes.json();

  return results.slice(0, limit).map((place) => ({
    business_name: place.title || "Unknown Business",
    address: place.address || null,
    city: place.city || extractCity(place.address, location),
    state: place.state || "TX",
    zip: place.postalCode || null,
    phone: formatPhone(place.phoneUnformatted || place.phone || null),
    email: null, // extracted separately
    website_url: place.website || null,
    google_maps_url: place.url || null,
    rating: place.totalScore || null,
    review_count: place.reviewsCount || null,
    business_type: place.categoryName || place.categories?.[0] || null,
    search_query: searchString,
  }));
}

function extractCity(address: string | undefined, location: string): string | null {
  if (!address) return location.split(",")[0].trim();
  const parts = address.split(",").map((s) => s.trim());
  return parts.length >= 2 ? parts[parts.length - 2] : null;
}

function formatPhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}
