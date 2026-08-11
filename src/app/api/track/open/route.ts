import { NextRequest, NextResponse } from "next/server";
import { decodeToken } from "@/lib/tracking";
import { recordTrackingEvent } from "@/lib/tracking-store";

const PIXEL_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

function pixelResponse() {
  return new NextResponse(PIXEL_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL_GIF.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t");
  const payload = token
    ? decodeToken(token, process.env.TRACKING_SECRET || "")
    : null;

  if (payload?.k === "open") {
    try {
      await recordTrackingEvent(payload);
    } catch (error) {
      console.error("Open tracking failed:", error);
    }
  }

  return pixelResponse();
}
