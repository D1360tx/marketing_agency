import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function normalizeTrade(businessType: string | null): string {
  if (!businessType) return "";
  const lower = businessType.toLowerCase();
  if (lower.includes("hvac") || lower.includes("air") || lower.includes("heating") || lower.includes("cooling")) return "HVAC";
  if (lower.includes("plumb")) return "plumbing";
  if (lower.includes("roof")) return "roofing";
  if (lower.includes("electric")) return "electrical";
  if (lower.includes("landscap") || lower.includes("lawn")) return "landscaping";
  return businessType;
}

function extractFirstName(businessName: string | null): string {
  if (!businessName) return "";
  // Try patterns like "John's HVAC", "Mike's Plumbing", "Bob's Roofing"
  const match = businessName.match(/^([A-Z][a-z]+)'s\b/);
  if (match) return match[1];
  return "";
}

function escapeCsv(value: string | number | null | undefined): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const sequence = searchParams.get("sequence");
    const minScore = searchParams.get("minScore");
    const trade = searchParams.get("trade");
    const city = searchParams.get("city");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from("prospects")
      .select("id, email, business_name, city, business_type, website_url, phone, lead_score")
      .not("email", "is", null)
      .eq("status", "new");

    // Sequence filters
    if (sequence === "A") {
      query = query.gte("lead_score", 10).lte("lead_score", 20);
    } else if (sequence === "B") {
      query = query.eq("lead_score", 30);
    }

    // Optional filters
    if (minScore) {
      query = query.gte("lead_score", parseInt(minScore, 10));
    }
    if (trade) {
      query = query.ilike("business_type", `%${trade}%`);
    }
    if (city) {
      query = query.ilike("city", `%${city}%`);
    }

    const { data, error } = await query.order("lead_score", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Build CSV
    const headers = ["Email", "First Name", "Last Name", "Company Name", "city", "trade", "website", "phone", "lead_score"];
    const rows = (data || []).map((p) => [
      escapeCsv(p.email),
      escapeCsv(extractFirstName(p.business_name)),
      "", // Last Name
      escapeCsv(p.business_name),
      escapeCsv(p.city),
      escapeCsv(normalizeTrade(p.business_type)),
      escapeCsv(p.website_url),
      escapeCsv(p.phone),
      escapeCsv(p.lead_score),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const today = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="instantly-leads-${today}.csv"`,
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
