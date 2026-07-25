import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyBearerSecret } from "@/lib/server-auth";

async function sendTelegram(token: string, chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (!token || !chatId || !baseUrl) {
      return NextResponse.json({ error: "Reminder routing is not configured" }, { status: 500 });
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

Open: ${baseUrl}/leads/${prospect.id}`;

      await sendTelegram(token, chatId, message);
    }

    return NextResponse.json({ ok: true, sent: prospects.length });
  } catch (err) {
    console.error("Follow-up reminder cron error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
