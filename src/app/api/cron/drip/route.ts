import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processDripQueue } from "@/lib/drip-engine";

// Vercel cron job — runs daily at 9am CST
// Configured in vercel.json
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Use service role key to bypass RLS and process all users
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trybookedout.com";

    // Get all distinct user IDs with pending drip enrollments
    const { data: users, error } = await supabase
      .from("drip_enrollments")
      .select("user_id")
      .eq("status", "active");

    if (error) {
      console.error("Cron: failed to fetch users", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const uniqueUserIds = [...new Set((users || []).map((u) => u.user_id))];
    console.log(`Cron: processing drip for ${uniqueUserIds.length} users`);

    const results = await Promise.allSettled(
      uniqueUserIds.map((userId) =>
        processDripQueue(supabase, userId, baseUrl)
      )
    );

    const summary = results.map((r, i) => ({
      user_id: uniqueUserIds[i],
      status: r.status,
      result: r.status === "fulfilled" ? r.value : r.reason?.message,
    }));

    console.log("Cron: drip processing complete", summary);
    return NextResponse.json({ success: true, processed: uniqueUserIds.length, summary });
  } catch (err) {
    console.error("Cron error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
