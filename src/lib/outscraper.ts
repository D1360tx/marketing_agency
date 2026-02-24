import type { Prospect } from "@/types";

interface OutscraperBusiness {
  name?: string;
  full_address?: string;
  phone?: string;
  site?: string;
  type?: string;
  category?: string;
  rating?: number;
  reviews?: number;
  google_id?: string;
  place_id?: string;
  latitude?: number;
  longitude?: number;
  business_status?: string;
  verified?: boolean;
}

interface OutscraperResponse {
  data?: OutscraperBusiness[][];
  // v2 returns nested arrays
}

export async function searchBusinesses(
  apiKey: string,
  query: string,
  location: string,
  limit: number = 20
): Promise<Partial<Prospect>[]> {
  const searchQuery = `${query}, ${location}`;

  const url = new URL("https://api.app.outscraper.com/maps/search-v2");
  url.searchParams.set("query", searchQuery);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("async", "false");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Outscraper API error (${response.status}): ${errText}`);
  }

  const data = await response.json();

  // Response is a nested array: [[business1, business2, ...]]
  const businesses: OutscraperBusiness[] = Array.isArray(data)
    ? Array.isArray(data[0])
      ? data[0]
      : data
    : data?.data?.[0] || [];

  return businesses.map((biz) => {
    // Parse city/state from full_address
    const addressParts = parseAddress(biz.full_address || "");

    return {
      business_name: biz.name || "Unknown Business",
      address: addressParts.street,
      city: addressParts.city,
      state: addressParts.state,
      zip: addressParts.zip,
      phone: biz.phone || null,
      email: null, // extracted separately
      website_url: biz.site || null,
      google_maps_url: biz.place_id
        ? `https://www.google.com/maps/place/?q=place_id:${biz.place_id}`
        : null,
      rating: biz.rating || null,
      review_count: biz.reviews || null,
      business_type: biz.type || biz.category || null,
      search_query: `${query} in ${location}`,
    };
  });
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
