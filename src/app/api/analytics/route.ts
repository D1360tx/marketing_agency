import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SENT_STATUSES = ["sent", "delivered", "opened", "replied"];

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all data in parallel
    const [
      prospectsResult,
      campaignMsgsResult,
      dripMsgsResult,
      opensResult,
      clicksResult,
      campaignsResult,
      sequencesResult,
      enrollmentsResult,
    ] = await Promise.all([
      supabase
        .from("prospects")
        .select("id, status, created_at")
        .eq("user_id", user.id),
      supabase
        .from("campaign_messages")
        .select("id, status, sent_at, opened_at, campaign_id")
        .in("status", SENT_STATUSES)
        .order("sent_at", { ascending: false }),
      supabase
        .from("drip_messages")
        .select("id, status, sent_at, opened_at, step_id")
        .eq("user_id", user.id),
      supabase
        .from("tracked_opens")
        .select("id, message_id, opened_at, message_type")
        .eq("user_id", user.id)
        .order("opened_at", { ascending: false }),
      supabase
        .from("tracked_clicks")
        .select("id, message_id, clicked_at, message_type, url")
        .eq("user_id", user.id)
        .order("clicked_at", { ascending: false }),
      supabase
        .from("campaigns")
        .select("id, name, type, status, sent_count, open_count, reply_count, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("drip_sequences")
        .select("id, name, channel, status, created_at")
        .eq("user_id", user.id),
      supabase
        .from("drip_enrollments")
        .select("id, status, sequence_id")
        .eq("user_id", user.id),
    ]);

    const queryResults = [
      prospectsResult,
      campaignMsgsResult,
      dripMsgsResult,
      opensResult,
      clicksResult,
      campaignsResult,
      sequencesResult,
      enrollmentsResult,
    ];
    const failedQuery = queryResults.find((result) => result.error);
    if (failedQuery?.error) {
      console.error("Analytics query failed:", failedQuery.error.message);
      return NextResponse.json(
        { error: "Analytics data is temporarily unavailable" },
        { status: 503 }
      );
    }

    const prospects = prospectsResult.data || [];
    const campaignMsgs = campaignMsgsResult.data || [];
    const dripMsgs = dripMsgsResult.data || [];
    const opens = opensResult.data || [];
    const clicks = clicksResult.data || [];
    const campaigns = campaignsResult.data || [];
    const sequences = sequencesResult.data || [];
    const enrollments = enrollmentsResult.data || [];

    const uniqueOpenMessageIds = new Set(
      opens.map((event) => `${event.message_type}:${event.message_id}`)
    );
    const uniqueClickMessageIds = new Set(
      clicks.map((event) => `${event.message_type}:${event.message_id}`)
    );
    const uniqueOpens = Array.from(
      new Map(
        opens.map((event) => [
          `${event.message_type}:${event.message_id}`,
          event,
        ])
      ).values()
    );
    const uniqueClicks = Array.from(
      new Map(
        clicks.map((event) => [
          `${event.message_type}:${event.message_id}`,
          event,
        ])
      ).values()
    );

    // All messages combined
    const allSent = [
      ...campaignMsgs.filter((m) => ["sent", "delivered", "opened", "replied"].includes(m.status)),
      ...dripMsgs.filter((m) => ["sent", "delivered", "opened", "replied"].includes(m.status)),
    ];
    const allOpened = [
      ...campaignMsgs.filter((m) => ["opened", "replied"].includes(m.status)),
      ...dripMsgs.filter((m) => ["opened", "replied"].includes(m.status)),
    ];

    // Funnel
    const funnel = {
      prospects: prospects.length,
      contacted: prospects.filter((p) =>
        ["contacted", "interested", "client"].includes(p.status)
      ).length,
      interested: prospects.filter((p) =>
        ["interested", "client"].includes(p.status)
      ).length,
      clients: prospects.filter((p) => p.status === "client").length,
    };

    // Email performance
    const emailStats = {
      total_sent: allSent.length,
      total_opened: allOpened.length,
      total_clicks: uniqueClickMessageIds.size,
      open_rate:
        allSent.length > 0
          ? Math.round((allOpened.length / allSent.length) * 100)
          : 0,

      click_rate:
        allSent.length > 0
          ? Math.round((uniqueClickMessageIds.size / allSent.length) * 100)
          : 0,
    };

    // Per-campaign stats
    const campaignStats = campaigns.map((c) => {
      const msgs = campaignMsgs.filter((m) => m.campaign_id === c.id);
      const cSent = msgs.filter((m) => ["sent", "delivered", "opened", "replied"].includes(m.status)).length;
      const cOpened = msgs.filter((m) => ["opened", "replied"].includes(m.status)).length;


      return {
        ...c,
        stats: {
          sent: cSent,
          opened: cOpened,
          open_rate: cSent > 0 ? Math.round((cOpened / cSent) * 100) : 0,
        },
      };
    });

    // Per-sequence stats
    const sequenceStats = sequences.map((s) => {
      const seqEnrollments = enrollments.filter((e) => e.sequence_id === s.id);
      return {
        ...s,
        stats: {
          total_enrolled: seqEnrollments.length,
          active: seqEnrollments.filter((e) => e.status === "active").length,
          completed: seqEnrollments.filter((e) => e.status === "completed").length,
        },
      };
    });

    // Activity over time (last 30 days, daily)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyActivity: Record<string, { sent: number; opened: number; clicked: number }> = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split("T")[0];
      dailyActivity[key] = { sent: 0, opened: 0, clicked: 0 };
    }

    for (const msg of allSent) {
      if (msg.sent_at) {
        const day = msg.sent_at.split("T")[0];
        if (dailyActivity[day]) dailyActivity[day].sent++;
      }
    }

    for (const open of uniqueOpens) {
      const day = open.opened_at.split("T")[0];
      if (dailyActivity[day]) dailyActivity[day].opened++;
    }

    for (const click of uniqueClicks) {
      const day = click.clicked_at.split("T")[0];
      if (dailyActivity[day]) dailyActivity[day].clicked++;
    }

    // Sort daily activity by date
    const activityTimeline = Object.entries(dailyActivity)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));

    return NextResponse.json({
      funnel,
      emailStats,
      campaignStats,
      sequenceStats,
      activityTimeline,
      totals: {
        prospects: prospects.length,
        campaigns: campaigns.length,
        sequences: sequences.length,
        enrollments: enrollments.length,
        uniqueOpens: uniqueOpenMessageIds.size,
        uniqueClicks: uniqueClickMessageIds.size,
      },
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
