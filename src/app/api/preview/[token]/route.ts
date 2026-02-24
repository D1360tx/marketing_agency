import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createClient();

    const { data: site, error } = await supabase
      .from("generated_sites")
      .select("html_content, business_name")
      .eq("share_token", token)
      .single();

    if (error || !site) {
      return new NextResponse("Site not found", { status: 404 });
    }

    return new NextResponse(site.html_content, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Internal server error", { status: 500 });
  }
}
