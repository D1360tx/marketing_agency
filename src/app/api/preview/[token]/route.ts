import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidShareToken } from "@/lib/generator-security";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!isValidShareToken(token)) {
      return new NextResponse("Site not found", { status: 404 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!url || !key) {
      return new NextResponse("Preview service unavailable", { status: 503 });
    }

    const service = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: site, error } = await service
      .from("generated_sites")
      .select("html_content")
      .eq("share_token", token)
      .maybeSingle();

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
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  } catch (error) {
    console.error("Preview lookup failed:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
