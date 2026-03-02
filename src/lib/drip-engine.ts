import type { SupabaseClient } from "@supabase/supabase-js";
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

/**
 * Enroll a prospect into a drip sequence.
 * Calculates the first send time and creates the enrollment record.
 */
export async function enrollProspect(
  supabase: SupabaseClient,
  params: {
    sequence_id: string;
    prospect_id: string;
    user_id: string;
  }
) {
  // Get the first step to calculate next_send_at
  const { data: firstStep } = await supabase
    .from("drip_steps")
    .select("delay_days")
    .eq("sequence_id", params.sequence_id)
    .order("step_order", { ascending: true })
    .limit(1)
    .single();

  const now = new Date();
  const nextSend = new Date(now);
  nextSend.setDate(nextSend.getDate() + (firstStep?.delay_days || 0));

  const { data, error } = await supabase
    .from("drip_enrollments")
    .insert({
      sequence_id: params.sequence_id,
      prospect_id: params.prospect_id,
      user_id: params.user_id,
      current_step: 0,
      status: "active",
      next_send_at: nextSend.toISOString(),
    })
    .select()
    .single();

  if (error) {
    // Check for duplicate enrollment
    if (error.code === "23505") {
      return { data: null, error: "Prospect already enrolled in this sequence" };
    }
    return { data: null, error: error.message };
  }

  await logActivity(supabase, {
    prospect_id: params.prospect_id,
    user_id: params.user_id,
    activity_type: "drip_enrolled",
    description: "Enrolled in drip sequence",
    metadata: { sequence_id: params.sequence_id },
  });

  return { data, error: null };
}

/**
 * Bulk enroll multiple prospects into a sequence.
 */
export async function bulkEnrollProspects(
  supabase: SupabaseClient,
  params: {
    sequence_id: string;
    prospect_ids: string[];
    user_id: string;
  }
) {
  let enrolled = 0;
  let skipped = 0;

  for (const prospect_id of params.prospect_ids) {
    const result = await enrollProspect(supabase, {
      sequence_id: params.sequence_id,
      prospect_id,
      user_id: params.user_id,
    });

    if (result.data) {
      enrolled++;
    } else {
      skipped++;
    }
  }

  return { enrolled, skipped };
}

/**
 * Process all due drip messages for a user.
 * This is the main "tick" function — call it periodically (e.g., every 15 min via cron)
 * or on-demand when the user clicks "Process Queue".
 */
export async function processDripQueue(
  supabase: SupabaseClient,
  userId: string,
  baseUrl: string
) {
  const now = new Date().toISOString();

  // Find all active enrollments where next_send_at <= now
  const { data: dueEnrollments, error: fetchError } = await supabase
    .from("drip_enrollments")
    .select(`
      *,
      drip_sequences!inner(*, drip_steps(*)),
      prospects(*)
    `)
    .eq("user_id", userId)
    .eq("status", "active")
    .lte("next_send_at", now)
    .not("next_send_at", "is", null);

  if (fetchError || !dueEnrollments || dueEnrollments.length === 0) {
    return { processed: 0, sent: 0, failed: 0, completed: 0, error: fetchError?.message };
  }

  // Fetch user settings for API keys
  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Pre-fetch unsubscribes
  const recipientEmails = dueEnrollments
    .map((e) => e.prospects?.email)
    .filter(Boolean);

  const { data: unsubscribed } = await supabase
    .from("unsubscribes")
    .select("email")
    .eq("user_id", userId)
    .in("email", recipientEmails);

  const unsubscribedSet = new Set(
    (unsubscribed || []).map((u) => u.email.toLowerCase())
  );

  // Pre-fetch website grades
  const prospectIds = dueEnrollments
    .map((e) => e.prospect_id)
    .filter(Boolean);

  const { data: analyses } = await supabase
    .from("website_analyses")
    .select("prospect_id, overall_grade")
    .in("prospect_id", prospectIds);

  const gradeMap = new Map<string, string>();
  if (analyses) {
    for (const a of analyses) {
      if (a.overall_grade) gradeMap.set(a.prospect_id, a.overall_grade);
    }
  }

  let sent = 0;
  let failed = 0;
  let completed = 0;

  for (const enrollment of dueEnrollments) {
    const sequence = enrollment.drip_sequences;
    const prospect = enrollment.prospects;
    const steps = (sequence?.drip_steps || []).sort(
      (a: { step_order: number }, b: { step_order: number }) =>
        a.step_order - b.step_order
    );

    if (!prospect || steps.length === 0) continue;

    // Find the next step to send
    const nextStepIndex = enrollment.current_step; // 0-based index into sorted steps
    const step = steps[nextStepIndex];

    if (!step) {
      // No more steps — mark enrollment as completed
      await supabase
        .from("drip_enrollments")
        .update({
          status: "completed",
          completed_at: now,
          next_send_at: null,
        })
        .eq("id", enrollment.id);
      completed++;
      continue;
    }

    // Determine recipient address
    const toAddress =
      sequence.channel === "email"
        ? prospect.email
        : prospect.phone;

    if (!toAddress) {
      // Can't send — skip but don't fail
      continue;
    }

    // Check unsubscribe
    if (
      sequence.channel === "email" &&
      unsubscribedSet.has(toAddress.toLowerCase())
    ) {
      await supabase
        .from("drip_enrollments")
        .update({ status: "cancelled", next_send_at: null })
        .eq("id", enrollment.id);
      continue;
    }

    // Build template variables
    const grade = gradeMap.get(prospect.id);
    const vars = buildTemplateVars(prospect, grade);
    const body = interpolateTemplate(step.body_template, vars);
    const subject = step.subject_template
      ? interpolateTemplate(step.subject_template, vars)
      : undefined;

    // Pre-create the message record so we have an ID for tracking
    const { data: dripMsg } = await supabase
      .from("drip_messages")
      .insert({
        enrollment_id: enrollment.id,
        step_id: step.id,
        prospect_id: prospect.id,
        user_id: userId,
        channel: sequence.channel,
        to_address: toAddress,
        subject: subject || null,
        body,
        status: "pending",
      })
      .select("id")
      .single();

    const messageId = dripMsg?.id;
    if (!messageId) {
      failed++;
      continue;
    }

    // Send the message
    let sendResult: { success: boolean; error?: string } = {
      success: false,
      error: "Unknown channel",
    };

    if (sequence.channel === "email") {
      const apiKey = settings?.resend_api_key || process.env.RESEND_API_KEY;
      if (!apiKey) {
        failed++;
        continue;
      }

      const senderEmail = settings?.sender_email || "onboarding@resend.dev";
      const senderName = settings?.sender_name || "Booked Out";
      const from = `${senderName} <${senderEmail}>`;
      const unsubscribeUrl = buildUnsubscribeUrl(baseUrl, userId, toAddress);

      const trackingParams = {
        userId,
        messageType: "drip" as const,
        messageId,
        prospectId: prospect.id,
      };

      const trackingPixel = buildTrackingPixelHtml(baseUrl, trackingParams);

      let html = renderHtmlEmail({
        body,
        senderName,
        unsubscribeUrl,
        trackingPixelHtml: trackingPixel,
      });

      // Wrap links with click tracking
      html = injectClickTracking(html, baseUrl, trackingParams);

      sendResult = await sendEmail({
        apiKey,
        from,
        to: toAddress,
        subject: subject || "Following up on your business",
        body,
        html,
        unsubscribeUrl,
      });
    } else if (sequence.channel === "sms") {
      const accountSid =
        settings?.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID;
      const authToken =
        settings?.twilio_auth_token || process.env.TWILIO_AUTH_TOKEN;
      const fromNumber =
        settings?.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        failed++;
        continue;
      }

      sendResult = await sendSMS({
        accountSid,
        authToken,
        from: fromNumber,
        to: toAddress,
        body,
      });
    }

    // Update the message status
    await supabase
      .from("drip_messages")
      .update({
        status: sendResult.success ? "sent" : "failed",
        sent_at: sendResult.success ? now : null,
        error_message: sendResult.error || null,
      })
      .eq("id", messageId);

    if (sendResult.success) {
      sent++;

      // Log activity
      await logActivity(supabase, {
        prospect_id: prospect.id,
        user_id: userId,
        activity_type:
          sequence.channel === "email" ? "email_sent" : "sms_sent",
        description: `Drip step ${nextStepIndex + 1}/${steps.length}: ${subject || "Follow-up"}`,
        metadata: {
          sequence_id: sequence.id,
          sequence_name: sequence.name,
          step_order: step.step_order,
        },
      });

      // Calculate next step timing
      const nextStep = steps[nextStepIndex + 1];
      if (nextStep) {
        const nextSendAt = new Date();
        nextSendAt.setDate(nextSendAt.getDate() + nextStep.delay_days);

        await supabase
          .from("drip_enrollments")
          .update({
            current_step: nextStepIndex + 1,
            last_sent_at: now,
            next_send_at: nextSendAt.toISOString(),
          })
          .eq("id", enrollment.id);
      } else {
        // Last step sent — mark as completed
        await supabase
          .from("drip_enrollments")
          .update({
            current_step: nextStepIndex + 1,
            last_sent_at: now,
            status: "completed",
            completed_at: now,
            next_send_at: null,
          })
          .eq("id", enrollment.id);
        completed++;
      }
    } else {
      failed++;
    }
  }

  return {
    processed: dueEnrollments.length,
    sent,
    failed,
    completed,
  };
}
