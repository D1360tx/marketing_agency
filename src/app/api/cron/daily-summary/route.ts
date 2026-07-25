import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyBearerSecret } from "@/lib/server-auth";

const TELEGRAM_CHAT_ID = "138971046";

async function sendTelegram(token: string, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "HTML" }),
  });
}

export async function GET(request: Request) {
  const authorization = verifyBearerSecret(
    request.headers.get("authorization"),
    process.env.CRON_SECRET
  );
  if (!authorization.ok) {
    const error = authorization.reason === "missing-secret" ? "Server misconfigured" : "Unauthorized";
    return NextResponse.json({ error }, { status: authorization.status });
  }

  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });
    }

    const supabase = await createClient();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // Leads added today
    const { data: newLeads } = await supabase
      .from("prospects")
      .select("id")
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString());

    // Status changes today (activities)
    const { data: statusChanges } = await supabase
      .from("prospect_activities")
      .select("id, metadata")
      .eq("activity_type", "status_changed")
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString());

    // Contacted today (status changed to "contacted")
    const contactedToday = (statusChanges || []).filter(
      (a) => (a.metadata as Record<string, string>)?.new_status === "contacted"
    ).length;

    // Calls booked (status changed to "client")
    const callsBooked = (statusChanges || []).filter(
      (a) => (a.metadata as Record<string, string>)?.new_status === "client"
    ).length;

    // Warm/Interested
    const { data: warmLeads } = await supabase
      .from("prospects")
      .select("id")
      .in("status", ["interested", "follow_up"]);

    // Follow-ups due tomorrow
    const { data: followUpsTomorrow } = await supabase
      .from("prospects")
      .select("id")
      .eq("status", "follow_up")
      .gte("follow_up_date", tomorrowStart.toISOString().split("T")[0])
      .lte("follow_up_date", tomorrowEnd.toISOString().split("T")[0]);

    const dateStr = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const message = `📊 <b>Booked Out Daily Summary — ${dateStr}</b>

New leads added: ${newLeads?.length ?? 0}
Contacted today: ${contactedToday}
Warm/Interested: ${warmLeads?.length ?? 0}
Calls booked: ${callsBooked}
Follow-ups due tomorrow: ${followUpsTomorrow?.length ?? 0}

💪 Keep going!`;

    await sendTelegram(token, message);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Daily summary cron error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
