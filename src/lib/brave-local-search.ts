import type { Prospect } from "@/types";

interface BraveLocationResult {
  title?: string;
  url?: string;
  type?: string;
  coordinates?: [number, number];
  postal_address?: {
    type?: string;
    displayAddress?: string;
  };
  contact?: {
    telephone?: string;
  };
  categories?: string[];
  icon_category?: string;
  id?: string;
}

interface BraveSearchResponse {
  type?: string;
  locations?: {
    type?: string;
    results?: BraveLocationResult[];
  };
  query?: {
    original?: string;
    is_geolocal?: boolean;
  };
}

/**
 * Search for local businesses using Brave Search API (locations filter).
 * Free tier: $5/mo credit (~2,000 queries). Returns business name, address,
 * phone, website, and categories. No rating/review data — use PageSpeed
 * website grade as the sales metric instead.
 */
export async function searchBusinessesBrave(
  apiKey: string,
  query: string,
  location: string,
  limit: number = 20
): Promise<Partial<Prospect>[]> {
  const searchQuery = `${query} in ${location}`;

  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", searchQuery);
  url.searchParams.set("count", String(Math.min(limit, 20))); // Brave max 20 per request
  url.searchParams.set("result_filter", "locations");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "X-Subscription-Token": apiKey,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Brave Search API error (${response.status}): ${errText}`);
  }

  const data: BraveSearchResponse = await response.json();
  const locations = data.locations?.results || [];

  // If we need more than 20 results and Brave returned 20, make additional requests
  let allLocations = [...locations];

  if (limit > 20 && locations.length >= 20) {
    // Brave supports offset for pagination
    const remaining = limit - 20;
    const pages = Math.ceil(remaining / 20);

    for (let page = 1; page <= pages && page <= 3; page++) {
      // Max 4 pages total
      try {
        const pageUrl = new URL(
          "https://api.search.brave.com/res/v1/web/search"
        );
        pageUrl.searchParams.set("q", searchQuery);
        pageUrl.searchParams.set("count", "20");
        pageUrl.searchParams.set("offset", String(page * 20));
        pageUrl.searchParams.set("result_filter", "locations");

        const pageResponse = await fetch(pageUrl.toString(), {
          method: "GET",
          headers: {
            "X-Subscription-Token": apiKey,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(15000),
        });

        if (pageResponse.ok) {
          const pageData: BraveSearchResponse = await pageResponse.json();
          const pageLocations = pageData.locations?.results || [];
          allLocations = [...allLocations, ...pageLocations];

          if (pageLocations.length < 20) break; // No more results
        }
      } catch {
        break; // Stop pagination on error
      }
    }
  }

  // Deduplicate by business name + phone (Brave can return dupes across pages)
  const seen = new Set<string>();
  const unique = allLocations.filter((loc) => {
    const key = `${(loc.title || "").toLowerCase()}|${loc.contact?.telephone || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.slice(0, limit).map((loc) => {
    const addressParts = parseAddress(
      loc.postal_address?.displayAddress || ""
    );

    return {
      business_name: loc.title || "Unknown Business",
      address: addressParts.street,
      city: addressParts.city,
      state: addressParts.state,
      zip: addressParts.zip,
      phone: formatPhone(loc.contact?.telephone || null),
      email: null, // extracted separately via email-extractor
      website_url: loc.url || null,
      google_maps_url: loc.coordinates
        ? `https://www.google.com/maps/search/?api=1&query=${loc.coordinates[0]},${loc.coordinates[1]}`
        : null,
      rating: null, // Brave doesn't provide ratings
      review_count: null, // Brave doesn't provide review counts
      business_type: loc.categories?.[0] || loc.icon_category || null,
      search_query: `${query} in ${location}`,
    };
  });
}

/**
 * Format phone number to a consistent format.
 * Brave returns "+15122552505" — convert to "(512) 255-2505"
 */
function formatPhone(phone: string | null): string | null {
  if (!phone) return null;

  // Strip everything except digits
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    // US number with country code
    const area = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const line = digits.slice(7);
    return `(${area}) ${prefix}-${line}`;
  }

  if (digits.length === 10) {
    const area = digits.slice(0, 3);
    const prefix = digits.slice(3, 6);
    const line = digits.slice(6);
    return `(${area}) ${prefix}-${line}`;
  }

  // Return original if we can't parse
  return phone;
}

function parseAddress(fullAddress: string): {
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
} {
  if (!fullAddress) {
    return { street: null, city: null, state: null, zip: null };
  }

  // Typical format: "123 Main St, Austin, TX 78701"
  const parts = fullAddress.split(",").map((s) => s.trim());

  if (parts.length >= 3) {
    const stateZip = parts[parts.length - 1];
    const stateZipMatch = stateZip.match(/^([A-Z]{2})\s*(\d{5})?/);

    return {
      street: parts.slice(0, -2).join(", "),
      city: parts[parts.length - 2],
      state: stateZipMatch?.[1] || null,
      zip: stateZipMatch?.[2] || null,
    };
  }

  return { street: fullAddress, city: null, state: null, zip: null };
}
