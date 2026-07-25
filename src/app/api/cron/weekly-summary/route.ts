import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyBearerSecret } from "@/lib/server-auth";

async function sendTelegram(token: string, chatId: string, threadId: string | null, text: string) {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };
  if (threadId) {
    body.message_thread_id = threadId;
  }
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
    const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
    const threadId = process.env.TELEGRAM_THREAD_ID?.trim() || null;
    if (!token || !chatId) {
      return NextResponse.json({ error: "Telegram is not configured" }, { status: 500 });
    }

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

    await sendTelegram(token, chatId, threadId, message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Weekly summary error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
