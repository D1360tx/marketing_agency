import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Group chat + Booked Out topic (thread_id=3). Falls back to direct chat if not set.
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "138971046";
const TELEGRAM_THREAD_ID = process.env.TELEGRAM_THREAD_ID || null;

async function sendTelegram(token: string, text: string) {
  const body: Record<string, unknown> = {
    chat_id: TELEGRAM_CHAT_ID,
    text,
    parse_mode: "HTML",
  };
  if (TELEGRAM_THREAD_ID) {
    body.message_thread_id = TELEGRAM_THREAD_ID;
  }
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized triggers
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });

    const supabase = await createClient();

    // Last 7 days
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    // Leads added this week
    const { data: newLeads } = await supabase
      .from("prospects")
      .select("id, business_name, city, state, status, source")
      .gte("created_at", weekStart.toISOString());

    // Best source this week — by lead count
    const sourceMap: Record<string, number> = {};
    for (const lead of newLeads || []) {
      const src = lead.source || "Unknown";
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    }
    const bestSource = Object.entries(sourceMap).sort((a, b) => b[1] - a[1])[0];
    const bestSourceStr = bestSource ? `${bestSource[0]} (${bestSource[1]} leads)` : "N/A";

    // All status changes this week
    const { data: statusChanges } = await supabase
      .from("prospect_activities")
      .select("id, metadata")
      .eq("activity_type", "status_changed")
      .gte("created_at", weekStart.toISOString());

    const contactedCount = (statusChanges || []).filter(
      (a) => (a.metadata as Record<string, string>)?.new_status === "contacted"
    ).length;

    const convertedCount = (statusChanges || []).filter(
      (a) => (a.metadata as Record<string, string>)?.new_status === "client"
    ).length;

    // Current pipeline snapshot
    const { data: pipeline } = await supabase
      .from("prospects")
      .select("status")
      .neq("status", "not_interested")
      .neq("status", "lost");

    const pipelineByStatus = (pipeline || []).reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Stale leads — no activity in 7+ days, still in early stages
    const { data: stale } = await supabase
      .from("prospects")
      .select("id, business_name")
      .in("status", ["new", "contacted", "follow_up"])
      .lt("updated_at", weekStart.toISOString());

    // Follow-ups due next 7 days
    const nextWeekEnd = new Date();
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
    const { data: upcoming } = await supabase
      .from("prospects")
      .select("id, business_name, follow_up_date")
      .eq("status", "follow_up")
      .gte("follow_up_date", new Date().toISOString().split("T")[0])
      .lte("follow_up_date", nextWeekEnd.toISOString().split("T")[0])
      .order("follow_up_date", { ascending: true })
      .limit(5);

    const weekStr = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} \u2013 ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

    const upcomingList =
      (upcoming || []).map((f) => `  \u2022 ${f.business_name} (${f.follow_up_date})`).join("\n") ||
      "  None";

    const message = `\ud83d\udcca <b>Booked Out \u2014 Weekly Report</b>
<i>${weekStr}</i>

<b>This Week</b>
New leads: ${newLeads?.length ?? 0}
Contacted: ${contactedCount}
Converted to Client: ${convertedCount} \ud83c\udfc6
Best Source: ${bestSourceStr}

<b>Pipeline Snapshot</b>
New: ${pipelineByStatus["new"] ?? 0}
Contacted: ${pipelineByStatus["contacted"] ?? 0}
Interested: ${pipelineByStatus["interested"] ?? 0}
Follow-up: ${pipelineByStatus["follow_up"] ?? 0}
Call Scheduled: ${pipelineByStatus["call_scheduled"] ?? 0}
Clients: ${pipelineByStatus["client"] ?? 0}

<b>Stale Leads (7+ days no activity)</b>
${stale?.length ?? 0} leads need attention

<b>Follow-ups Next 7 Days</b>
${upcomingList}

\ud83d\udcaa Keep pushing. Consistency wins.`;

    await sendTelegram(token, message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Weekly summary error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
