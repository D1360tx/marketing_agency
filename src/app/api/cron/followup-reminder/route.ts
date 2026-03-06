import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TELEGRAM_CHAT_ID = "138971046";
const BASE_URL = "https://trybookedout.com";

async function sendTelegram(token: string, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "HTML" }),
  });
}

export async function GET() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });
    }

    const supabase = await createClient();

    const today = new Date().toISOString().split("T")[0];

    const { data: prospects, error } = await supabase
      .from("prospects")
      .select("id, business_name, phone, notes")
      .eq("status", "follow_up")
      .eq("follow_up_date", today);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!prospects || prospects.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    for (const prospect of prospects) {
      const noteSnippet = prospect.notes
        ? prospect.notes.slice(0, 100) + (prospect.notes.length > 100 ? "..." : "")
        : "no notes";

      const message = `🔔 <b>Follow-up due today!</b>

<b>${prospect.business_name}</b>
📞 ${prospect.phone || "no phone"}
📝 ${noteSnippet}

Open: ${BASE_URL}/leads/${prospect.id}`;

      await sendTelegram(token, message);
    }

    return NextResponse.json({ ok: true, sent: prospects.length });
  } catch (err) {
    console.error("Follow-up reminder cron error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
