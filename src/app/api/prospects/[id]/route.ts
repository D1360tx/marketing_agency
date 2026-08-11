import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [prospectResult, previewResult] = await Promise.all([
      supabase
        .from("prospects")
        .select("*, website_analyses(*)")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("generated_sites")
        .select("id, share_token, business_name, created_at")
        .eq("prospect_id", id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (prospectResult.error || !prospectResult.data) {
      return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
    }
    if (previewResult.error) {
      console.error("Latest preview lookup failed:", previewResult.error.message);
    }

    return NextResponse.json({
      prospect: prospectResult.data,
      latest_preview: previewResult.data || null,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
