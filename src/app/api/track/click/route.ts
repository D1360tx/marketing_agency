import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decodeToken } from "@/lib/tracking";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t");
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  if (token) {
    const payload = decodeToken(token);

    if (payload) {
      try {
        const supabase = await createClient();

        // Record the click
        await supabase.from("tracked_clicks").insert({
          user_id: payload.u,
          message_type: payload.t,
          message_id: payload.m,
          prospect_id: payload.p,
          url,
          user_agent: request.headers.get("user-agent") || null,
          ip_address:
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            null,
        });

        // Also mark as opened if not already (clicking implies opening)
        const table =
          payload.t === "campaign" ? "campaign_messages" : "drip_messages";

        await supabase
          .from(table)
          .update({
            status: "opened",
            opened_at: new Date().toISOString(),
          })
          .eq("id", payload.m)
          .in("status", ["sent", "delivered"]);
      } catch (err) {
        console.error("Click tracking error:", err);
      }
    }
  }

  // Redirect to the original URL
  return NextResponse.redirect(url, { status: 302 });
}
