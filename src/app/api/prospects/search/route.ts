import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchParamsSchema } from "@/types";
import { searchMockProspects } from "@/lib/mock-data";
import { searchBusinessesApify } from "@/lib/apify-google-maps";
import { searchBusinessesBrave } from "@/lib/brave-local-search";
import { searchBusinesses as searchBusinessesOutscraper } from "@/lib/outscraper";
import { calculateLeadScore } from "@/lib/lead-scoring";
import { logActivity } from "@/lib/activity-log";
import { extractEmails } from "@/lib/email-extractor";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = searchParamsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { query, location, limit } = parsed.data;
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

    let businesses;

    if (useMock) {
      businesses = searchMockProspects(query, location).slice(0, limit);
    } else {
      // Check for API keys in user settings first, then env vars
      const { data: settings } = await supabase
        .from("user_settings")
        .select("outscraper_api_key, brave_api_key, apify_api_key")
        .eq("user_id", user.id)
        .single();

      // Priority: Apify (best data) → Brave (free fallback) → Outscraper (paid fallback)
      const apifyKey =
        settings?.apify_api_key || process.env.APIFY_API_KEY;
      const braveKey =
        settings?.brave_api_key || process.env.BRAVE_API_KEY;
      const outscraperKey =
        settings?.outscraper_api_key || process.env.OUTSCRAPER_API_KEY;

      if (apifyKey) {
        // Primary: Apify Google Maps Scraper (best data — ratings, reviews, categories)
        try {
          businesses = await searchBusinessesApify(
            apifyKey,
            query,
            location,
            limit
          );
        } catch (err) {
          console.error("Apify error:", err);
          // Fallback to Brave
          if (braveKey) {
            try {
              businesses = await searchBusinessesBrave(braveKey, query, location, limit);
            } catch (braveErr) {
              console.error("Brave fallback error:", braveErr);
              return NextResponse.json(
                { error: `Search failed: ${err instanceof Error ? err.message : "Unknown error"}` },
                { status: 502 }
              );
            }
          } else {
            return NextResponse.json(
              { error: `Apify search failed: ${err instanceof Error ? err.message : "Unknown error"}` },
              { status: 502 }
            );
          }
        }
      } else if (braveKey) {
        // Fallback: Brave Local Search
        try {
          businesses = await searchBusinessesBrave(braveKey, query, location, limit);
        } catch (err) {
          console.error("Brave Search error:", err);
          if (outscraperKey) {
            try {
              businesses = await searchBusinessesOutscraper(outscraperKey, query, location, limit);
            } catch (outscraperErr) {
              console.error("Outscraper fallback error:", outscraperErr);
              return NextResponse.json(
                { error: `Search failed: ${err instanceof Error ? err.message : "Unknown error"}` },
                { status: 502 }
              );
            }
          } else {
            return NextResponse.json(
              { error: `Brave Search failed: ${err instanceof Error ? err.message : "Unknown error"}` },
              { status: 502 }
            );
          }
        }
      } else if (outscraperKey) {
        // Fallback: Outscraper
        try {
          businesses = await searchBusinessesOutscraper(outscraperKey, query, location, limit);
        } catch (err) {
          console.error("Outscraper API error:", err);
          return NextResponse.json(
            { error: `Google Maps search failed: ${err instanceof Error ? err.message : "Unknown error"}` },
            { status: 502 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "No search API configured. Add an Apify API key in Settings or set APIFY_API_KEY env var." },
          { status: 400 }
        );
      }
    }

    // --- Deduplication: check existing prospects for this user ---
    const { data: existing } = await supabase
      .from("prospects")
      .select("business_name, phone, website_url")
      .eq("user_id", user.id);

    const existingSet = new Set<string>();
    if (existing) {
      for (const e of existing) {
        const name = e.business_name?.toLowerCase().trim();
        if (name && e.phone) existingSet.add(`${name}|phone|${e.phone}`);
        if (name && e.website_url)
          existingSet.add(`${name}|web|${e.website_url}`);
      }
    }

    const newBusinesses = businesses.filter((b) => {
      const name = (b.business_name || "").toLowerCase().trim();
      if (name && b.phone && existingSet.has(`${name}|phone|${b.phone}`))
        return false;
      if (
        name &&
        b.website_url &&
        existingSet.has(`${name}|web|${b.website_url}`)
      )
        return false;
      return true;
    });

    const duplicateCount = businesses.length - newBusinesses.length;

    if (newBusinesses.length === 0) {
      return NextResponse.json({
        prospects: [],
        new_count: 0,
        duplicate_count: duplicateCount,
      });
    }

    // Build insert rows with lead scores
    const prospectsToInsert = newBusinesses.map((b) => {
      const { score, breakdown } = calculateLeadScore({
        website_url: b.website_url,
        email: b.email,
        phone: b.phone,
        rating: b.rating,
        review_count: b.review_count,
      });

      return {
        user_id: user.id,
        business_name: b.business_name || "Unknown Business",
        address: b.address,
        city: b.city,
        state: b.state,
        zip: b.zip,
        phone: b.phone,
        email: b.email,
        website_url: b.website_url,
        google_maps_url: b.google_maps_url,
        rating: b.rating,
        review_count: b.review_count,
        business_type: b.business_type,
        search_query: `${query} in ${location}`,
        status: "new" as const,
        lead_score: score,
        lead_score_breakdown: breakdown,
      };
    });

    const { data, error } = await supabase
      .from("prospects")
      .insert(prospectsToInsert)
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity for each new prospect
    if (data) {
      for (const prospect of data) {
        await logActivity(supabase, {
          prospect_id: prospect.id,
          user_id: user.id,
          activity_type: "created",
          description: `Found via search: "${query} in ${location}"`,
          metadata: { search_query: query, location },
        });
      }
    }

    // Fire-and-forget email extraction for prospects without emails
    if (data) {
      const needsEmail = data.filter((p) => !p.email && p.website_url);
      if (needsEmail.length > 0) {
        // Don't await — runs in background so search response returns quickly
        Promise.allSettled(
          needsEmail.map(async (prospect) => {
            try {
              const emails = await extractEmails(prospect.website_url!);
              if (emails.length > 0) {
                await supabase
                  .from("prospects")
                  .update({ email: emails[0] })
                  .eq("id", prospect.id);
              }
            } catch {
              // Silently ignore extraction failures
            }
          })
        );
      }
    }

    return NextResponse.json({
      prospects: data,
      new_count: data?.length || 0,
      duplicate_count: duplicateCount,
    });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
