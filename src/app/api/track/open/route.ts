import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decodeToken } from "@/lib/tracking";

// 1x1 transparent GIF
const PIXEL_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t");

  if (token) {
    const payload = decodeToken(token);

    if (payload) {
      try {
        const supabase = await createClient();

        // Record the open
        await supabase.from("tracked_opens").insert({
          user_id: payload.u,
          message_type: payload.t,
          message_id: payload.m,
          prospect_id: payload.p,
          user_agent: request.headers.get("user-agent") || null,
          ip_address:
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            null,
        });

        // Update the message status to 'opened'
        const table =
          payload.t === "campaign" ? "campaign_messages" : "drip_messages";

        await supabase
          .from(table)
          .update({
            status: "opened",
            opened_at: new Date().toISOString(),
          })
          .eq("id", payload.m)
          .in("status", ["sent", "delivered"]); // only upgrade, don't downgrade
      } catch (err) {
        console.error("Open tracking error:", err);
      }
    }
  }

  // Always return the pixel image
  return new NextResponse(PIXEL_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL_GIF.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
