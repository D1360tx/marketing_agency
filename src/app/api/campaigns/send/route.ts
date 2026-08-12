import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  sendEmail,
  sendSMS,
  interpolateTemplate,
  buildTemplateVars,
} from "@/lib/outreach";
import { renderHtmlEmail } from "@/lib/email-templates";
import { buildUnsubscribeUrl } from "@/lib/unsubscribe";
import { logActivity } from "@/lib/activity-log";
import {
  buildTrackingPixelHtml,
  injectClickTracking,
} from "@/lib/tracking";

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 500;

const sendRequestSchema = z.object({
  campaign_id: z.string().uuid(),
  message_ids: z.array(z.string().uuid()).min(1).max(100)
    .refine((ids) => new Set(ids).size === ids.length),
}).strict();

/** Send messages in batches using Promise.allSettled */
async function sendInBatches<T>(
  items: T[],
  handler: (item: T) => Promise<void>,
  batchSize: number,
  delayMs: number
) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.allSettled(batch.map(handler));
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = sendRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Choose one or more reviewed messages to send" },
        { status: 400 }
      );
    }
    const { campaign_id, message_ids } = parsed.data;

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaign_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Fetch pending messages for this campaign with prospect data
    const { data: messages, error: msgError } = await supabase
      .from("campaign_messages")
      .select("*, prospects(*)")
      .eq("campaign_id", campaign_id)
      .eq("status", "pending")
      .in("id", message_ids);

    if (msgError) {
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    if (!messages || messages.length !== message_ids.length) {
      return NextResponse.json(
        { error: "One or more reviewed messages are no longer available to send" },
        { status: 409 }
      );
    }

    // Fetch user settings for API keys
    const { data: settings } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // --- Batch-fetch all website analyses grades upfront (fix N+1) ---
    const prospectIds = messages
      .map((m) => m.prospects?.id)
      .filter(Boolean) as string[];

    const { data: allAnalyses } = await supabase
      .from("website_analyses")
      .select("prospect_id, overall_grade")
      .in("prospect_id", prospectIds);

    const gradeMap = new Map<string, string>();
    if (allAnalyses) {
      for (const a of allAnalyses) {
        if (a.overall_grade && !gradeMap.has(a.prospect_id)) {
          gradeMap.set(a.prospect_id, a.overall_grade);
        }
      }
    }

    const { data: latestPreviews, error: previewsError } = await supabase
      .from("generated_sites")
      .select("prospect_id, share_token, created_at")
      .in("prospect_id", prospectIds)
      .order("created_at", { ascending: false });
    if (previewsError) {
      console.error("Campaign preview lookup failed:", previewsError.message);
      return NextResponse.json({ error: "Could not load approved previews" }, { status: 500 });
    }
    const previewMap = new Map<string, string>();
    for (const preview of latestPreviews || []) {
      if (!previewMap.has(preview.prospect_id)) {
        previewMap.set(preview.prospect_id, preview.share_token);
      }
    }

    // --- Check unsubscribes upfront ---
    const recipientEmails = messages
      .map((m) => m.to_address)
      .filter(Boolean);

    const { data: unsubscribed } = await supabase
      .from("unsubscribes")
      .select("email")
      .eq("user_id", user.id)
      .in("email", recipientEmails);

    const unsubscribedSet = new Set(
      (unsubscribed || []).map((u) => u.email.toLowerCase())
    );

    // Build canonical base URL for unsubscribe, tracking, and preview links.
    const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    if (!configuredBaseUrl && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Outbound links are not configured" },
        { status: 503 }
      );
    }
    const baseUrl = configuredBaseUrl || new URL(request.url).origin;

    async function claimApprovedMessages() {
      const { data: claimed, error: claimError } = await supabase
        .from("campaign_messages")
        .update({ status: "sending", error_message: null })
        .eq("campaign_id", campaign_id)
        .eq("status", "pending")
        .in("id", message_ids)
        .select("id");

      if (!claimError && claimed?.length === message_ids.length) return true;

      const claimedIds = (claimed || []).map((message) => message.id);
      if (claimedIds.length > 0) {
        await supabase
          .from("campaign_messages")
          .update({ status: "pending" })
          .eq("campaign_id", campaign_id)
          .eq("status", "sending")
          .in("id", claimedIds);
      }
      if (claimError) console.error("Campaign message claim failed:", claimError.message);
      return false;
    }

    if (campaign.type === "email") {
      const apiKey = settings?.resend_api_key || process.env.RESEND_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: "Resend API key not configured. Add it in Settings." },
          { status: 400 }
        );
      }

      const senderEmail = settings?.sender_email || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
      const senderName = settings?.sender_name || process.env.RESEND_FROM_NAME || "Booked Out";
      const from = `${senderName} <${senderEmail}>`;

      if (!process.env.TRACKING_SECRET || process.env.TRACKING_SECRET.length < 32) {
        return NextResponse.json({ error: "Email tracking is not configured" }, { status: 503 });
      }
      if (!(await claimApprovedMessages())) {
        return NextResponse.json(
          { error: "One or more reviewed messages are already being sent" },
          { status: 409 }
        );
      }

      let sentCount = 0;
      let skippedCount = 0;

      await sendInBatches(
        messages,
        async (msg) => {
          const prospect = msg.prospects;
          if (!prospect) return;

          // Check unsubscribe
          if (unsubscribedSet.has(msg.to_address.toLowerCase())) {
            await supabase
              .from("campaign_messages")
              .update({
                status: "failed",
                error_message: "Recipient unsubscribed",
              })
              .eq("id", msg.id);
            skippedCount++;
            return;
          }

          const grade = gradeMap.get(prospect.id);
          const shareToken = previewMap.get(prospect.id);
          const previewUrl = shareToken ? `${baseUrl}/preview/${shareToken}` : null;
          const vars = buildTemplateVars(prospect, grade, previewUrl);

          const subject = msg.subject
            ? interpolateTemplate(msg.subject, vars)
            : "A message for your business";
          const body = interpolateTemplate(msg.body, vars);

          const unsubscribeUrl = buildUnsubscribeUrl(
            baseUrl,
            user.id,
            msg.to_address
          );

          const trackingParams = {
            userId: user.id,
            messageType: "campaign" as const,
            messageId: msg.id,
            prospectId: prospect.id,
          };

          const trackingPixel = buildTrackingPixelHtml(baseUrl, trackingParams);

          let html = renderHtmlEmail({
            body,
            senderName,
            unsubscribeUrl,
            previewUrl: vars.preview_url || undefined,
            trackingPixelHtml: trackingPixel,
          });

          // Wrap all links with click tracking
          html = injectClickTracking(html, baseUrl, trackingParams);

          const result = await sendEmail({
            apiKey,
            from,
            to: msg.to_address,
            subject,
            body,
            html,
            unsubscribeUrl,
          });

          // Update message status
          await supabase
            .from("campaign_messages")
            .update({
              status: result.success ? "sent" : "failed",
              sent_at: result.success ? new Date().toISOString() : null,
              error_message: result.error || null,
            })
            .eq("id", msg.id);

          if (result.success) {
            sentCount++;
            // Log activity
            await logActivity(supabase, {
              prospect_id: prospect.id,
              user_id: user.id,
              activity_type: "email_sent",
              description: `Email sent: "${subject}"`,
              metadata: { campaign_id, campaign_name: campaign.name },
            });
          }
        },
        BATCH_SIZE,
        BATCH_DELAY_MS
      );

      // Update campaign stats
      await supabase
        .from("campaigns")
        .update({
          status: "active",
          sent_count: (campaign.sent_count || 0) + sentCount,
        })
        .eq("id", campaign_id);

      return NextResponse.json({
        sent: sentCount,
        failed: messages.length - sentCount - skippedCount,
        skipped_unsubscribed: skippedCount,
        total: messages.length,
      });
    }

    if (campaign.type === "sms") {
      const accountSid =
        settings?.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID;
      const authToken =
        settings?.twilio_auth_token || process.env.TWILIO_AUTH_TOKEN;
      const fromNumber =
        settings?.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        return NextResponse.json(
          { error: "Twilio credentials not configured. Add them in Settings." },
          { status: 400 }
        );
      }

      if (!(await claimApprovedMessages())) {
        return NextResponse.json(
          { error: "One or more reviewed messages are already being sent" },
          { status: 409 }
        );
      }

      let sentCount = 0;
      let skippedNoConsent = 0;

      await sendInBatches(
        messages,
        async (msg) => {
          const prospect = msg.prospects;
          if (!prospect) return;

          if (!prospect.sms_consent_at) {
            await supabase
              .from("campaign_messages")
              .update({
                status: "failed",
                error_message: "SMS blocked: no recorded consent",
              })
              .eq("id", msg.id);
            skippedNoConsent++;
            return;
          }

          const grade = gradeMap.get(prospect.id);
          const shareToken = previewMap.get(prospect.id);
          const previewUrl = shareToken ? `${baseUrl}/preview/${shareToken}` : null;
          const vars = buildTemplateVars(prospect, grade, previewUrl);
          const body = interpolateTemplate(msg.body, vars);

          const result = await sendSMS({
            accountSid,
            authToken,
            from: fromNumber,
            to: msg.to_address,
            body,
          });

          await supabase
            .from("campaign_messages")
            .update({
              status: result.success ? "sent" : "failed",
              sent_at: result.success ? new Date().toISOString() : null,
              error_message: result.error || null,
            })
            .eq("id", msg.id);

          if (result.success) {
            sentCount++;
            await logActivity(supabase, {
              prospect_id: prospect.id,
              user_id: user.id,
              activity_type: "sms_sent",
              description: "SMS sent",
              metadata: { campaign_id, campaign_name: campaign.name },
            });
          }
        },
        BATCH_SIZE,
        BATCH_DELAY_MS
      );

      await supabase
        .from("campaigns")
        .update({
          status: "active",
          sent_count: (campaign.sent_count || 0) + sentCount,
        })
        .eq("id", campaign_id);

      return NextResponse.json({
        sent: sentCount,
        failed: messages.length - sentCount - skippedNoConsent,
        skipped_no_consent: skippedNoConsent,
        total: messages.length,
      });
    }

    return NextResponse.json(
      { error: "Unknown campaign type" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Campaign send error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
