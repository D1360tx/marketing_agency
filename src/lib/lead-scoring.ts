import type { WebsiteAnalysis } from "@/types";

export interface LeadScoreBreakdown {
  website_quality: number;
  contactability: number;
  business_activity: number;
  quality_signal: number;
  hot_lead_bonus: number;
}

export function calculateLeadScore(
  prospect: {
    website_url?: string | null;
    email?: string | null;
    phone?: string | null;
    rating?: number | null;
    review_count?: number | null;
  },
  analysis?: Pick<WebsiteAnalysis, "overall_grade"> | null
): { score: number; breakdown: LeadScoreBreakdown } {
  const breakdown: LeadScoreBreakdown = {
    website_quality: 0,
    contactability: 0,
    business_activity: 0,
    quality_signal: 0,
    hot_lead_bonus: 0,
  };

  // Website quality (0-30): No website or bad grade = highest opportunity
  if (!prospect.website_url) {
    breakdown.website_quality = 30;
  } else if (analysis?.overall_grade === "F") {
    breakdown.website_quality = 28;
  } else if (analysis?.overall_grade === "D") {
    breakdown.website_quality = 25;
  } else if (analysis?.overall_grade === "C") {
    breakdown.website_quality = 15;
  } else if (analysis?.overall_grade === "B") {
    breakdown.website_quality = 5;
  }
  // A grade = 0 (not a good prospect)

  // Contactability (0-20): Has email + phone
  if (prospect.email) breakdown.contactability += 10;
  if (prospect.phone) breakdown.contactability += 10;

  // Business activity (0-25): High review count = active business
  const reviews = prospect.review_count ?? 0;
  if (reviews >= 100) {
    breakdown.business_activity = 25;
  } else if (reviews >= 50) {
    breakdown.business_activity = 20;
  } else if (reviews >= 20) {
    breakdown.business_activity = 15;
  } else if (reviews >= 5) {
    breakdown.business_activity = 10;
  }

  // Quality signal (0-15): Good rating = cares about quality
  const rating = prospect.rating ?? 0;
  if (rating >= 4.5) {
    breakdown.quality_signal = 15;
  } else if (rating >= 4.0) {
    breakdown.quality_signal = 12;
  } else if (rating >= 3.5) {
    breakdown.quality_signal = 8;
  }

  // Hot lead bonus (0-10): High reviews + bad website
  const hasBadWebsite =
    !prospect.website_url ||
    analysis?.overall_grade === "D" ||
    analysis?.overall_grade === "F";
  if (hasBadWebsite && reviews >= 20 && rating >= 4.0) {
    breakdown.hot_lead_bonus = 10;
  }

  const score = Math.min(
    100,
    breakdown.website_quality +
      breakdown.contactability +
      breakdown.business_activity +
      breakdown.quality_signal +
      breakdown.hot_lead_bonus
  );

  return { score, breakdown };
}
