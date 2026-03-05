import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { runAudit } from "@/lib/audit-runner";
import { enrollProspect } from "@/lib/drip-engine";

const DIEGO_USER_ID = "8337f5a8-dd50-43c5-8f35-b32e2180492d";
const SEQUENCE_1_ID = "58e2a4a5-8603-44ea-b103-a3eb0c01b4ce";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      business_name: _bn,
      business,
      website,
      email,
      phone,
      name,
      source,
      city,
    } = body;

    const business_name = _bn || business || "Unknown";
    const first_name = name ? name.split(" ")[0] : null;

    if (!business_name || !email) {
      return NextResponse.json(
        { error: "Business name and email are required" },
        { status: 400 }
      );
    }

    // Service role client — bypasses RLS for inbound lead storage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Insert prospect
    const { data: prospect, error: insertError } = await supabase
      .from("prospects")
      .insert({
        user_id: DIEGO_USER_ID,
        business_name,
        email,
        phone: phone || null,
        website_url: website || null,
        city: city || "Austin",
        state: "TX",
        business_type: "service business",
        status: "new",
        search_query: "Inbound — landing page",
        notes: [
          `Source: ${source || "landing page"}`,
          `Name: ${name || "—"}`,
          `First name: ${first_name || "—"}`,
          `City: ${city || "Austin"}`,
          `Website: ${website || "none"}`,
        ].join("\n"),
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[inbound] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save lead" },
        { status: 500 }
      );
    }

    const prospect_id = prospect.id;

    // Fire-and-forget: run audit + enroll in drip sequence
    // We do NOT await these — return 200 immediately
    Promise.all([
      runAudit(prospect_id).catch((err) =>
        console.error("[inbound] Audit error:", err)
      ),
      enrollProspect(supabase, {
        sequence_id: SEQUENCE_1_ID,
        prospect_id,
        user_id: DIEGO_USER_ID,
      }).catch((err) =>
        console.error("[inbound] Drip enrollment error:", err)
      ),
    ]).catch(() => {});

    // Notify Diego
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: `Booked Out <diego@trybookedout.com>`,
        to: "dcamp905@gmail.com",
        subject: `🔥 New inbound lead: ${business_name}`,
        html: `
          <h2>New lead from trybookedout.com</h2>
          <table>
            <tr><td><strong>Business:</strong></td><td>${business_name}</td></tr>
            <tr><td><strong>Name:</strong></td><td>${name || "—"}</td></tr>
            <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
            <tr><td><strong>Phone:</strong></td><td>${phone || "—"}</td></tr>
            <tr><td><strong>Website:</strong></td><td>${website || "—"}</td></tr>
            <tr><td><strong>City:</strong></td><td>${city || "Austin"}</td></tr>
            <tr><td><strong>Source:</strong></td><td>${source || "landing page"}</td></tr>
          </table>
          <p>Audit is running in the background. Check back in a few minutes.</p>
          <p><a href="https://trybookedout.com/leads">View in Booked Out →</a></p>
        `,
      });
    } catch (emailErr) {
      // Non-fatal — lead is already saved
      console.error("[inbound] Notification email error:", emailErr);
    }

    return NextResponse.json({ success: true, prospect_id });
  } catch (err) {
    console.error("[inbound] Unexpected error:", err);
    return NextResponse.json(
      { error: "Failed to save lead" },
      { status: 500 }
    );
  }
}
