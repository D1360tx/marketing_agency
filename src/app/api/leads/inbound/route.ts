import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { runAudit } from "@/lib/audit-runner";
import { enrollProspect } from "@/lib/drip-engine";

function requiredEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value || null;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const {
      business_name: _bn,
      business,
      website,
      email,
      phone,
      name,
      source,
      city,
      businessType,
      serviceArea,
      googleProfile,
    } = body;

    const business_name = String(_bn || business || "").trim();
    const contactName = String(name || "").trim();
    const emailAddress = String(email || "").trim();
    const phoneNumber = String(phone || "").trim();
    const websiteUrl = String(website || "").trim();
    const sourceName = String(source || "landing page").trim();
    const googleProfileUrl = String(googleProfile || "").trim();
    const first_name = contactName ? contactName.split(" ")[0] : null;
    const resolvedCity = String(serviceArea || city || "Austin").trim();
    const resolvedBusinessType = String(
      businessType || "service business"
    ).trim();

    if (!business_name || !emailAddress) {
      return NextResponse.json(
        { error: "Business name and email are required" },
        { status: 400 }
      );
    }

    const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[inbound] Missing Supabase server configuration");
      return NextResponse.json(
        { error: "Lead capture is not configured yet" },
        { status: 503 }
      );
    }

    const ownerUserId = requiredEnv("BOOKED_OUT_OWNER_USER_ID");
    const defaultSequenceId = requiredEnv("BOOKED_OUT_DEFAULT_SEQUENCE_ID");
    const notificationEmail = requiredEnv("INBOUND_LEAD_TO_EMAIL");
    const fromEmail = requiredEnv("INBOUND_LEAD_FROM_EMAIL");

    if (!ownerUserId || !defaultSequenceId || !notificationEmail || !fromEmail) {
      console.error("[inbound] Missing lead-routing configuration");
      return NextResponse.json(
        { error: "Lead routing is not configured yet" },
        { status: 503 }
      );
    }

    // Service role client — bypasses RLS for inbound lead storage
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Insert prospect
    const { data: prospect, error: insertError } = await supabase
      .from("prospects")
      .insert({
        user_id: ownerUserId,
        business_name,
        email: emailAddress,
        phone: phoneNumber || null,
        website_url: websiteUrl || null,
        city: resolvedCity,
        state: "TX",
        business_type: resolvedBusinessType,
        status: "new",
        search_query: "Inbound — landing page",
        notes: [
          `Source: ${sourceName}`,
          `Name: ${contactName || "—"}`,
          `First name: ${first_name || "—"}`,
          `City/service area: ${resolvedCity}`,
          `Business type: ${resolvedBusinessType}`,
          `Website: ${websiteUrl || "none"}`,
          `Google Business Profile: ${googleProfileUrl || "none"}`,
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
        sequence_id: defaultSequenceId,
        prospect_id,
        user_id: ownerUserId,
      }).catch((err) =>
        console.error("[inbound] Drip enrollment error:", err)
      ),
    ]).catch(() => {});

    // Notify owner. Non-fatal — lead is already saved.
    const resendKey = process.env.RESEND_API_KEY?.trim();
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: fromEmail,
          to: notificationEmail,
          subject: `New inbound lead: ${business_name}`,
          html: `
          <h2>New lead from trybookedout.com</h2>
          <table>
            <tr><td><strong>Business:</strong></td><td>${escapeHtml(business_name)}</td></tr>
            <tr><td><strong>Name:</strong></td><td>${escapeHtml(contactName || "—")}</td></tr>
            <tr><td><strong>Email:</strong></td><td>${escapeHtml(emailAddress)}</td></tr>
            <tr><td><strong>Phone:</strong></td><td>${escapeHtml(phoneNumber || "—")}</td></tr>
            <tr><td><strong>Business type:</strong></td><td>${escapeHtml(resolvedBusinessType)}</td></tr>
            <tr><td><strong>Website:</strong></td><td>${escapeHtml(websiteUrl || "—")}</td></tr>
            <tr><td><strong>City/service area:</strong></td><td>${escapeHtml(resolvedCity)}</td></tr>
            <tr><td><strong>Google profile:</strong></td><td>${escapeHtml(googleProfileUrl || "—")}</td></tr>
            <tr><td><strong>Source:</strong></td><td>${escapeHtml(sourceName)}</td></tr>
          </table>
          <p>Audit and drip enrollment are running in the background.</p>
          <p><a href="https://trybookedout.com/leads">View in Booked Out →</a></p>
        `,
        });
      } catch (emailErr) {
        console.error("[inbound] Notification email error:", emailErr);
      }
    } else {
      console.warn("[inbound] RESEND_API_KEY missing; notification skipped");
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
