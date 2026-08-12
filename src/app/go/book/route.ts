import { NextResponse } from "next/server";
import { getRevenueDestination } from "@/lib/revenue-redirect";

export const dynamic = "force-dynamic";

export async function GET() {
  const destination = getRevenueDestination("BOOKED_OUT_BOOKING_URL");
  if (!destination) {
    return NextResponse.json(
      { error: "Booking is not configured. Call (737) 260-5332 to schedule." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
  return NextResponse.redirect(destination, 307);
}
