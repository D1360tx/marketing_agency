/**
 * audit-runner.ts
 * Core audit logic: PageSpeed + competitor research + grade calculation.
 * Called by /api/audit/run (HTTP) and inbound lead handler (direct).
 */

import { createClient } from "@supabase/supabase-js";

const BRAVE_API_KEY = "BSAPW5OPgVsHLiYgQQbK_cggT48mAD6";

function extractReviewCount(text: string): number | null {
  const patterns = [
    /\((\d{1,5})\s*reviews?\)/i,
    /(\d{1,5})\s*reviews?/i,
    /\(\d+(?:\.\d+)?\)\s*\((\d{1,5})\)/,
    /rated[^(]*\((\d{1,5})\)/i,
    /·\s*(\d{1,5})\s*reviews?/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

function calculateGrade(performance: number, reviewCount: number): "A" | "B" | "C" | "D" | "F" {
  if (performance >= 80 && reviewCount >= 50) return "A";
  if (performance >= 60 || reviewCount >= 25) return "B";
  if (performance >= 40 || reviewCount >= 10) return "C";
  if (performance >= 20 || reviewCount >= 5) return "D";
  return "F";
}

export interface AuditResult {
  grade: "A" | "B" | "C" | "D" | "F";
  performance_score: number;
  seo_score: number;
  competitor_reviews: number[];
  prospect: Record<string, unknown>;
}

export async function runAudit(prospect_id: string): Promise<AuditResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch prospect
  const { data: prospect, error: prospectError } = await supabase
    .from("prospects")
    .select("id, website_url, city, business_type, business_name, rating, review_count")
    .eq("id", prospect_id)
    .single();

  if (prospectError || !prospect) {
    throw new Error(`Prospect not found: ${prospectError?.message}`);
  }

  // --- PageSpeed Insights ---
  let performanceScore = 0;
  let seoScore = 0;

  if (prospect.website_url) {
    try {
      const psUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(prospect.website_url)}&strategy=mobile`;
      const psRes = await fetch(psUrl, { signal: AbortSignal.timeout(20000) });
      if (psRes.ok) {
        const psData = await psRes.json();
        const perf = psData?.lighthouseResult?.categories?.performance?.score;
        const seo = psData?.lighthouseResult?.categories?.seo?.score;
        if (perf != null) performanceScore = Math.round(perf * 100);
        if (seo != null) seoScore = Math.round(seo * 100);
      }
    } catch (err) {
      console.error("[audit] PageSpeed error:", err);
    }
  }

  // --- Brave Search: competitor review counts ---
  const competitorReviews: number[] = [];
  let braveResults: unknown[] = [];

  try {
    const city = prospect.city || "Austin";
    const businessType = prospect.business_type || "service business";
    const query = `${businessType} ${city} TX`;
    const braveUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`;

    const braveRes = await fetch(braveUrl, {
      headers: { "X-Subscription-Token": BRAVE_API_KEY },
      signal: AbortSignal.timeout(10000),
    });

    if (braveRes.ok) {
      const braveData = await braveRes.json();
      braveResults = braveData?.web?.results || [];

      for (const result of braveResults as { description?: string; title?: string }[]) {
        const text = `${result.title || ""} ${result.description || ""}`;
        const count = extractReviewCount(text);
        if (count !== null && competitorReviews.length < 3) {
          competitorReviews.push(count);
        }
      }
    }
  } catch (err) {
    console.error("[audit] Brave search error:", err);
  }

  // --- Grade calculation ---
  const reviewCount = prospect.review_count ?? 0;
  const overall_grade = calculateGrade(performanceScore, reviewCount);

  // --- Save to website_analyses ---
  const { error: insertError } = await supabase.from("website_analyses").insert({
    prospect_id,
    performance_score: performanceScore,
    seo_score: seoScore,
    overall_grade,
    is_mobile_friendly: performanceScore > 50,
    raw_data: {
      competitor_reviews: competitorReviews,
      brave_results: braveResults,
    },
  });

  if (insertError) {
    console.error("[audit] Insert error:", insertError);
  }

  return {
    grade: overall_grade,
    performance_score: performanceScore,
    seo_score: seoScore,
    competitor_reviews: competitorReviews,
    prospect: prospect as Record<string, unknown>,
  };
}
