// GBP Audit — scoring logic, types, and mock data

export interface BusinessData {
  placeId: string;
  name: string;
  category: string;
  address: string;
  city: string;
  phone: string | null;
  website: string | null;
  reviewCount: number;
  rating: number;
  photoCount: number;
  hoursListed: boolean;
  descriptionPresent: boolean;
  lastPostDate: string | null; // ISO date string
}

export interface CompetitorData {
  name: string;
  reviewCount: number;
  rating: number;
  photoCount: number;
}

export interface AuditScoreBreakdown {
  reviews: number;
  rating: number;
  photos: number;
  hours: number;
  website: number;
  description: number;
  posts: number;
  vsCompetitors: number;
}

export interface AuditResult {
  business: BusinessData;
  competitors: CompetitorData[];
  score: number;
  breakdown: AuditScoreBreakdown;
  issues: string[];
  recommendations: string[];
}

export function calculateScore(
  biz: BusinessData,
  competitors: CompetitorData[]
): { score: number; breakdown: AuditScoreBreakdown } {
  const breakdown: AuditScoreBreakdown = {
    reviews: biz.reviewCount >= 50 ? 20 : biz.reviewCount >= 20 ? 10 : 0,
    rating: biz.rating >= 4.5 ? 15 : biz.rating >= 4.0 ? 10 : 0,
    photos: biz.photoCount >= 20 ? 15 : biz.photoCount >= 5 ? 8 : 0,
    hours: biz.hoursListed ? 10 : 0,
    website: biz.website ? 10 : 0,
    description: biz.descriptionPresent ? 10 : 0,
    posts: (() => {
      if (!biz.lastPostDate) return 0;
      const daysSince =
        (Date.now() - new Date(biz.lastPostDate).getTime()) /
        (1000 * 60 * 60 * 24);
      return daysSince <= 90 ? 10 : 0;
    })(),
    vsCompetitors: (() => {
      if (competitors.length === 0) return 0;
      const avgCompReviews =
        competitors.reduce((s, c) => s + c.reviewCount, 0) /
        competitors.length;
      return biz.reviewCount > avgCompReviews ? 10 : 0;
    })(),
  };

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { score, breakdown };
}

export function generateIssues(biz: BusinessData, breakdown: AuditScoreBreakdown): string[] {
  const issues: string[] = [];
  if (breakdown.reviews === 0) issues.push("Very few Google reviews (under 20)");
  if (breakdown.rating === 0) issues.push("Star rating below 4.0");
  if (breakdown.photos === 0) issues.push("Less than 5 photos on your profile");
  else if (breakdown.photos === 8) issues.push("Could use more photos (under 20)");
  if (!breakdown.hours) issues.push("Business hours not listed");
  if (!breakdown.website) issues.push("No website linked to your profile");
  if (!breakdown.description) issues.push("Missing business description");
  if (!breakdown.posts) issues.push("No recent Google Posts (inactive for 90+ days)");
  if (!breakdown.vsCompetitors) issues.push("Competitors have more reviews than you");
  return issues;
}

export function generateRecommendations(issues: string[]): string[] {
  const recs: string[] = [];
  for (const issue of issues) {
    if (issue.includes("reviews"))
      recs.push("Set up an automated review request system. Send a text or email after every job asking for a Google review.");
    if (issue.includes("rating"))
      recs.push("Respond to all negative reviews professionally. Address complaints, then ask happy customers to leave reviews to improve your average.");
    if (issue.includes("photos"))
      recs.push("Add high-quality photos of your work, team, and equipment. Aim for at least 20 photos. Update monthly.");
    if (issue.includes("hours"))
      recs.push("Add your business hours to your Google Business Profile. Include special hours for holidays.");
    if (issue.includes("website"))
      recs.push("Link a professional website to your profile. Even a simple one-page site helps rankings.");
    if (issue.includes("description"))
      recs.push("Write a compelling business description (750 chars max). Include your services, service area, and what makes you different.");
    if (issue.includes("Posts"))
      recs.push("Post on Google Business Profile at least once per week. Share offers, tips, project photos, or seasonal reminders.");
    if (issue.includes("Competitors"))
      recs.push("Your competitors are outpacing you on reviews. Make review collection a daily habit to close the gap.");
  }
  return recs;
}

// --- Mock data (TODO: replace with real Google Places API calls) ---

export const MOCK_BUSINESS: BusinessData = {
  placeId: "ChIJmock123456",
  name: "Austin HVAC Pro",
  category: "HVAC Contractor",
  address: "1234 S Lamar Blvd, Austin, TX 78704",
  city: "Austin",
  phone: "(512) 555-0199",
  website: null,
  reviewCount: 34,
  rating: 4.2,
  photoCount: 8,
  hoursListed: true,
  descriptionPresent: false,
  lastPostDate: "2025-09-15", // ~6 months ago
};

export const MOCK_COMPETITORS: CompetitorData[] = [
  { name: "Cool Air Solutions", reviewCount: 45, rating: 4.6, photoCount: 22 },
  { name: "Texas Climate Masters", reviewCount: 67, rating: 4.4, photoCount: 15 },
  { name: "Lone Star HVAC", reviewCount: 89, rating: 4.7, photoCount: 31 },
];
