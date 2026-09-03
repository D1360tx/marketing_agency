import { NextResponse } from "next/server";
import { getRevenueDestination } from "@/lib/revenue-redirect";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const destination = getRevenueDestination("BOOKED_OUT_AGREEMENT_URL");
  if (!destination) {
    return NextResponse.json(
      { error: "The service agreement link is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
  return NextResponse.redirect(destination, 307);
}
