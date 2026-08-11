import { NextRequest, NextResponse } from "next/server";
import { decodeToken } from "@/lib/tracking";
import { recordTrackingEvent } from "@/lib/tracking-store";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t");
  const payload = token
    ? decodeToken(token, process.env.TRACKING_SECRET || "")
    : null;

  if (payload?.k !== "click" || !payload.d) {
    return NextResponse.json(
      { error: "Invalid or expired tracking link" },
      {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  try {
    await recordTrackingEvent(payload);
  } catch (error) {
    console.error("Click tracking failed:", error);
  }

  return NextResponse.redirect(payload.d, {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}
