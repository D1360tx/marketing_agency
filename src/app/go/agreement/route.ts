import { NextResponse } from "next/server";
import { getRevenueDestination } from "@/lib/revenue-redirect";

export const dynamic = "force-dynamic";

export async function GET() {
  const destination = getRevenueDestination("BOOKED_OUT_AGREEMENT_URL");
  if (!destination) {
    return NextResponse.json(
      { error: "The service agreement link is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
  return NextResponse.redirect(destination, 307);
}
