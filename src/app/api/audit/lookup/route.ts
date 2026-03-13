import { NextRequest, NextResponse } from "next/server";
import {
  MOCK_BUSINESS,
  MOCK_COMPETITORS,
  calculateScore,
  generateIssues,
  generateRecommendations,
  type BusinessData,
  type CompetitorData,
} from "@/lib/gbp-audit";

export async function POST(req: NextRequest) {
  try {
    const { businessName, city } = await req.json();

    if (!businessName || !city) {
      return NextResponse.json(
        { error: "Business name and city are required" },
        { status: 400 }
      );
    }

    // TODO: Replace mock data with real Google Places API call
    // const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    // const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "X-Goog-Api-Key": apiKey!,
    //     "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.types,places.rating,places.userRatingCount,places.photos,places.currentOpeningHours,places.websiteUri,places.nationalPhoneNumber,places.editorialSummary,places.googleMapsUri",
    //   },
    //   body: JSON.stringify({
    //     textQuery: `${businessName} ${city}`,
    //     maxResultCount: 1,
    //   }),
    // });
    // const data = await res.json();
    // Parse business data from response...
    // Then search for competitors:
    // const competitorRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
    //   method: "POST",
    //   headers: { ... },
    //   body: JSON.stringify({
    //     textQuery: `${business.category} in ${city}`,
    //     maxResultCount: 4, // skip first if it's the same business
    //   }),
    // });

    const business: BusinessData = {
      ...MOCK_BUSINESS,
      name: businessName,
      city: city,
    };
    const competitors: CompetitorData[] = MOCK_COMPETITORS;

    const { score, breakdown } = calculateScore(business, competitors);
    const issues = generateIssues(business, breakdown);
    const recommendations = generateRecommendations(issues);

    return NextResponse.json({
      business,
      competitors,
      score,
      breakdown,
      issues,
      recommendations,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to look up business" },
      { status: 500 }
    );
  }
}
