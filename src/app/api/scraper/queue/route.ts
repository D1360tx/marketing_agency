import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const { query, niche, city, limit, enrich } = body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("scrape_jobs")
      .insert({
        user_id: user.id,
        query: query.trim(),
        niche: niche || null,
        city: city || null,
        limit_count: typeof limit === "number" ? Math.min(Math.max(limit, 10), 100) : 60,
        enrich: enrich !== false,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ job_id: data.id });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
