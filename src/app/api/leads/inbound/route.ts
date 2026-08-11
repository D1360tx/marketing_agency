import { after, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { runAudit } from "@/lib/audit-runner";
import { enrollProspect } from "@/lib/drip-engine";
import {
  consumePublicRateLimit,
  inboundLeadSchema,
  PUBLIC_SUBMISSION_HEADERS,
  readBoundedJson,
  verifyTurnstileToken,
} from "@/lib/public-submission-security";

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

function json(body: unknown, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(body, {
    status,
    headers: { ...PUBLIC_SUBMISSION_HEADERS, ...headers },
  });
}

export async function POST(request: Request) {
  try {
    const boundedBody = await readBoundedJson(request);
    if (!boundedBody.ok) {
      return json({ error: boundedBody.error }, boundedBody.status);
    }

    const parsed = inboundLeadSchema.safeParse(boundedBody.value);
    if (!parsed.success) {
      return json(
        {
          error: "Invalid lead submission",
          fields: parsed.error.issues.map((issue) => issue.path.join(".")).filter(Boolean),
        },
        400
      );
    }

    const input = parsed.data;
    // Honeypot submissions get a quiet success response but trigger no side effects.
    if (input.contact_time) return json({ success: true });

    const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[inbound] Missing Supabase server configuration");
      return json({ error: "Lead capture is not configured yet" }, 503);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const rateLimit = await consumePublicRateLimit(
      request,
      supabase as unknown as Parameters<typeof consumePublicRateLimit>[1],
      "inbound-lead",
      10,
      3600
    );
    if (!rateLimit.ok) {
      return json(
        { error: rateLimit.error },
        rateLimit.status,
        rateLimit.status === 429 ? { "Retry-After": "3600" } : undefined
      );
    }

    const turnstile = await verifyTurnstileToken(
      input.turnstileToken,
      request,
      "inbound_lead"
    );
    if (!turnstile.ok) return json({ error: turnstile.error }, turnstile.status);

    const ownerUserId = requiredEnv("BOOKED_OUT_OWNER_USER_ID");
    const defaultSequenceId = requiredEnv("BOOKED_OUT_DEFAULT_SEQUENCE_ID");
    const notificationEmail = requiredEnv("INBOUND_LEAD_TO_EMAIL");
    const fromEmail = requiredEnv("INBOUND_LEAD_FROM_EMAIL");
    if (!ownerUserId || !defaultSequenceId || !notificationEmail || !fromEmail) {
      console.error("[inbound] Missing lead-routing configuration");
      return json({ error: "Lead routing is not configured yet" }, 503);
    }

    const { data: configuredSequence, error: sequenceError } = await supabase
      .from("drip_sequences")
      .select("id")
      .eq("id", defaultSequenceId)
      .eq("user_id", ownerUserId)
      .eq("status", "active")
      .maybeSingle();
    if (sequenceError || !configuredSequence?.id) {
      console.error("[inbound] Default sequence is missing or inactive", sequenceError);
      return json({ error: "Lead routing is not configured yet" }, 503);
    }

    const businessName = input.business_name || input.business;
    const contactName = input.name;
    const emailAddress = input.email;
    const phoneNumber = input.phone;
    const websiteUrl = input.website;
    const sourceName = input.source || "landing page";
    const googleProfileUrl = input.googleProfile;
    const firstName = contactName ? contactName.split(" ")[0] : null;
    const resolvedCity = input.serviceArea || input.city || "Austin";
    const resolvedBusinessType = input.businessType || "service business";

    // Avoid duplicate records from refreshes/double-clicks without requiring a
    // potentially unsafe global unique-index migration over historical data.
    const duplicateCutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("prospects")
      .select("id")
      .eq("user_id", ownerUserId)
      .eq("email", emailAddress)
      .eq("search_query", "Inbound — landing page")
      .gte("created_at", duplicateCutoff)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      const retryEnrollment = await enrollProspect(supabase, {
        sequence_id: defaultSequenceId,
        prospect_id: existing.id,
        user_id: ownerUserId,
      });
      if (
        retryEnrollment.error &&
        retryEnrollment.error !== "Prospect already enrolled in this sequence"
      ) {
        console.error("[inbound] Duplicate enrollment retry failed:", retryEnrollment.error);
        return json({ error: "Lead follow-up is temporarily unavailable" }, 503);
      }
      return json({ success: true });
    }

    const { data: prospect, error: insertError } = await supabase
      .from("prospects")
      .insert({
        user_id: ownerUserId,
        business_name: businessName,
        email: emailAddress,
        phone: phoneNumber || null,
        website_url: websiteUrl || null,
        city: resolvedCity,
        state: "TX",
        business_type: resolvedBusinessType,
        status: "new",
        search_query: "Inbound — landing page",
        sms_consent_at: input.smsConsent ? new Date().toISOString() : null,
        sms_consent_source: input.smsConsent ? sourceName : null,
        notes: [
          `Source: ${sourceName}`,
          `Name: ${contactName || "—"}`,
          `First name: ${firstName || "—"}`,
          `City/service area: ${resolvedCity}`,
          `Business type: ${resolvedBusinessType}`,
          `Website: ${websiteUrl || "none"}`,
          `Google Business Profile: ${googleProfileUrl || "none"}`,
          `SMS consent: ${input.smsConsent ? "yes" : "no"}`,
        ].join("\n"),
      })
      .select("id")
      .single();

    if (insertError || !prospect?.id) {
      console.error("[inbound] Insert error:", insertError);
      return json({ error: "Failed to save lead" }, 500);
    }

    const prospectId = prospect.id;
    // Persist nurture enrollment before returning; Vercel may freeze work after a response.
    const enrollment = await enrollProspect(supabase, {
      sequence_id: defaultSequenceId,
      prospect_id: prospectId,
      user_id: ownerUserId,
    });
    if (enrollment.error) {
      console.error("[inbound] Drip enrollment failed:", enrollment.error);
      return json({ error: "Lead follow-up is temporarily unavailable" }, 503);
    }

    // Next.js after() keeps longer audit/notification work in the supported
    // post-response lifecycle without making the form wait on external services.
    after(async () => {
      await runAudit(prospectId).catch((error) =>
        console.error("[inbound] Audit error:", error)
      );

      const resendKey = process.env.RESEND_API_KEY?.trim();
      if (!resendKey) {
        console.warn("[inbound] RESEND_API_KEY missing; notification skipped");
        return;
      }

      try {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: fromEmail,
          to: notificationEmail,
          subject: "New inbound lead captured",
          html: `
            <h2>New lead from trybookedout.com</h2>
            <p>A new prospect was saved and enrolled in the approved follow-up sequence.</p>
            <p>Contact details are available only inside the authenticated CRM.</p>
            <p><a href="${escapeHtml(requiredEnv("NEXT_PUBLIC_APP_URL") || "https://trybookedout.com")}/app/leads/${escapeHtml(prospectId)}">View lead →</a></p>
          `,
        });
      } catch (error) {
        console.error("[inbound] Notification email error:", error);
      }
    });

    return json({ success: true });
  } catch (error) {
    console.error("[inbound] Unexpected error:", error);
    return json({ error: "Failed to save lead" }, 500);
  }
}
