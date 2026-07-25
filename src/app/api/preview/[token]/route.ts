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
        "Cache-Control": "private, no-store",
        "Content-Security-Policy": [
          "sandbox allow-scripts",
          "default-src 'none'",
          "script-src 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
          "style-src 'unsafe-inline' https://fonts.googleapis.com",
          "img-src https: data: blob:",
          "font-src https://fonts.gstatic.com data:",
          "connect-src 'none'",
          "frame-ancestors 'self'",
          "base-uri 'none'",
          "form-action 'none'",
        ].join("; "),
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch {
    return new NextResponse("Internal server error", { status: 500 });
  }
}
