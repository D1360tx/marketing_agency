import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
        .select("id, status, sent_at, opened_at, replied_at, campaign_id")
        .eq("status", "sent")
        .order("sent_at", { ascending: false }),
      supabase
        .from("drip_messages")
        .select("id, status, sent_at, opened_at, replied_at, step_id")
        .eq("user_id", user.id),
      supabase
        .from("tracked_opens")
        .select("id, opened_at, message_type")
        .eq("user_id", user.id)
        .order("opened_at", { ascending: false }),
      supabase
        .from("tracked_clicks")
        .select("id, clicked_at, message_type, url")
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

    const prospects = prospectsResult.data || [];
    const campaignMsgs = campaignMsgsResult.data || [];
    const dripMsgs = dripMsgsResult.data || [];
    const opens = opensResult.data || [];
    const clicks = clicksResult.data || [];
    const campaigns = campaignsResult.data || [];
    const sequences = sequencesResult.data || [];
    const enrollments = enrollmentsResult.data || [];

    // All messages combined
    const allSent = [
      ...campaignMsgs.filter((m) => ["sent", "delivered", "opened", "replied"].includes(m.status)),
      ...dripMsgs.filter((m) => ["sent", "delivered", "opened", "replied"].includes(m.status)),
    ];
    const allOpened = [
      ...campaignMsgs.filter((m) => ["opened", "replied"].includes(m.status)),
      ...dripMsgs.filter((m) => ["opened", "replied"].includes(m.status)),
    ];
    const allReplied = [
      ...campaignMsgs.filter((m) => m.status === "replied"),
      ...dripMsgs.filter((m) => m.status === "replied"),
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
      total_replied: allReplied.length,
      total_clicks: clicks.length,
      open_rate:
        allSent.length > 0
          ? Math.round((allOpened.length / allSent.length) * 100)
          : 0,
      reply_rate:
        allSent.length > 0
          ? Math.round((allReplied.length / allSent.length) * 100)
          : 0,
      click_rate:
        allSent.length > 0
          ? Math.round((clicks.length / allSent.length) * 100)
          : 0,
    };

    // Per-campaign stats
    const campaignStats = campaigns.map((c) => {
      const msgs = campaignMsgs.filter((m) => m.campaign_id === c.id);
      const cSent = msgs.filter((m) => ["sent", "delivered", "opened", "replied"].includes(m.status)).length;
      const cOpened = msgs.filter((m) => ["opened", "replied"].includes(m.status)).length;
      const cReplied = msgs.filter((m) => m.status === "replied").length;

      return {
        ...c,
        stats: {
          sent: cSent,
          opened: cOpened,
          replied: cReplied,
          open_rate: cSent > 0 ? Math.round((cOpened / cSent) * 100) : 0,
          reply_rate: cSent > 0 ? Math.round((cReplied / cSent) * 100) : 0,
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

    for (const open of opens) {
      const day = open.opened_at.split("T")[0];
      if (dailyActivity[day]) dailyActivity[day].opened++;
    }

    for (const click of clicks) {
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
        uniqueOpens: opens.length,
        uniqueClicks: clicks.length,
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
