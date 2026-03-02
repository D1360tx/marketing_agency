import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processDripQueue } from "@/lib/drip-engine";

// POST — Process all due drip messages for the current user
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (request.headers.get("origin") ?? "http://localhost:3001");

    const result = await processDripQueue(supabase, user.id, baseUrl);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Drip process error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
