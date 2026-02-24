import type { WebsiteGrade } from "@/types";

export interface AnalysisResult {
  performance_score: number | null;
  accessibility_score: number | null;
  best_practices_score: number | null;
  seo_score: number | null;
  has_ssl: boolean;
  is_mobile_friendly: boolean;
  load_time_ms: number | null;
  has_viewport_meta: boolean;
  technology_stack: Record<string, unknown> | null;
  overall_grade: WebsiteGrade;
  raw_data: Record<string, unknown> | null;
}

interface PageSpeedResponse {
  lighthouseResult?: {
    categories?: {
      performance?: { score?: number };
      accessibility?: { score?: number };
      "best-practices"?: { score?: number };
      seo?: { score?: number };
    };
    audits?: {
      "interactive"?: { numericValue?: number };
      viewport?: { score?: number };
      "is-on-https"?: { score?: number };
    };
  };
  loadingExperience?: {
    overall_category?: string;
  };
}

export async function analyzeWebsite(
  url: string,
  apiKey?: string
): Promise<AnalysisResult> {
  const endpoint = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

  // Build URL with multiple category params
  const apiUrl = `${endpoint}?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&category=accessibility&category=best-practices&category=seo${apiKey ? `&key=${apiKey}` : ""}`;

  const response = await fetch(apiUrl, {
    signal: AbortSignal.timeout(60000), // 60s timeout
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`PageSpeed API error (${response.status}): ${errText}`);
  }

  const data: PageSpeedResponse = await response.json();
  const categories = data.lighthouseResult?.categories;
  const audits = data.lighthouseResult?.audits;

  const performance = categories?.performance?.score != null
    ? Math.round(categories.performance.score * 100)
    : null;
  const accessibility = categories?.accessibility?.score != null
    ? Math.round(categories.accessibility.score * 100)
    : null;
  const bestPractices = categories?.["best-practices"]?.score != null
    ? Math.round(categories["best-practices"].score * 100)
    : null;
  const seo = categories?.seo?.score != null
    ? Math.round(categories.seo.score * 100)
    : null;

  const hasSsl = url.startsWith("https://") || audits?.["is-on-https"]?.score === 1;
  const hasViewportMeta = audits?.viewport?.score === 1;
  const loadTime = audits?.interactive?.numericValue
    ? Math.round(audits.interactive.numericValue)
    : null;

  // Mobile-friendly heuristic: good performance + viewport meta
  const isMobileFriendly = hasViewportMeta && (performance ?? 0) >= 40;

  const scores = [performance, accessibility, bestPractices, seo].filter(
    (s): s is number => s !== null
  );
  const avg = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  return {
    performance_score: performance,
    accessibility_score: accessibility,
    best_practices_score: bestPractices,
    seo_score: seo,
    has_ssl: hasSsl,
    is_mobile_friendly: isMobileFriendly,
    load_time_ms: loadTime,
    has_viewport_meta: hasViewportMeta,
    technology_stack: null,
    overall_grade: gradeFromScore(avg),
    raw_data: data as unknown as Record<string, unknown>,
  };
}

function gradeFromScore(avg: number): WebsiteGrade {
  if (avg >= 90) return "A";
  if (avg >= 70) return "B";
  if (avg >= 50) return "C";
  if (avg >= 30) return "D";
  return "F";
}
