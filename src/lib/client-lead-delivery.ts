import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  buildLeadAcknowledgmentHtml,
  buildOwnerNotificationHtml,
  clientLeadIdempotencyKey,
  clientLeadRetryDelaySeconds,
  CLIENT_LEAD_STALE_CLAIM_SECONDS,
  type ClientLeadChannel,
  type ClientLeadDeliveryResult,
  type ClientLeadDeliveryStatus,
} from "@/lib/client-leads";

export type ClientLeadRow = {
  id: string;
  onboarding_id: string;
  owner_user_id: string;
  submission_id: string;
  duplicate_hash: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  service: string;
  details: string;
  owner_notification_status: ClientLeadDeliveryStatus;
  acknowledgment_status: ClientLeadDeliveryStatus;
  owner_notification_attempt_count: number;
  acknowledgment_attempt_count: number;
  created_at: string;
};

export type ClientLeadRoutingRow = {
  id: string;
  user_id: string;
  business_name: string | null;
  lead_capture_enabled: boolean;
  lead_notification_email: string | null;
  lead_capture_allowed_origin: string;
  lead_capture_revoked_at: string | null;
};

export type ClientLeadDeliverySummary = {
  owner: ClientLeadDeliveryResult;
  acknowledgment: ClientLeadDeliveryResult;
};

export function getClientLeadServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function claimChannel(
  supabase: SupabaseClient,
  leadId: string,
  channel: ClientLeadChannel
): Promise<{ claimed: boolean; auditOk: boolean }> {
  const { data, error } = await supabase.rpc("claim_client_lead_delivery", {
    p_lead_id: leadId,
    p_channel: channel,
    p_stale_after_seconds: CLIENT_LEAD_STALE_CLAIM_SECONDS,
  });
  if (error || typeof data !== "boolean") {
    console.error("[client-leads] Delivery claim audit failed", {
      leadId,
      channel,
      code: error?.code || "invalid_response",
    });
    return { claimed: false, auditOk: false };
  }
  return { claimed: data, auditOk: true };
}

async function completeChannel(
  supabase: SupabaseClient,
  leadId: string,
  channel: ClientLeadChannel,
  status: "accepted" | "failed",
  attemptCount: number,
  providerId: string | null,
  errorCode: string | null
): Promise<boolean> {
  const nextAttemptAt =
    status === "failed"
      ? new Date(Date.now() + clientLeadRetryDelaySeconds(attemptCount) * 1000).toISOString()
      : null;
  const { data, error } = await supabase.rpc("complete_client_lead_delivery", {
    p_lead_id: leadId,
    p_channel: channel,
    p_status: status,
    p_provider_id: providerId,
    p_error_code: errorCode,
    p_next_attempt_at: nextAttemptAt,
  });
  if (error || data !== true) {
    console.error("[client-leads] Delivery completion audit failed", {
      leadId,
      channel,
      code: error?.code || "not_completed",
    });
    return false;
  }
  return true;
}

function existingSummary(lead: ClientLeadRow): ClientLeadDeliverySummary {
  return {
    owner: lead.owner_notification_status,
    acknowledgment: lead.acknowledgment_status,
  };
}

export async function deliverClientLeadEmails(
  supabase: SupabaseClient,
  routing: ClientLeadRoutingRow,
  lead: ClientLeadRow
): Promise<ClientLeadDeliverySummary> {
  const [ownerClaim, acknowledgmentClaim] = await Promise.all([
    claimChannel(supabase, lead.id, "owner"),
    claimChannel(supabase, lead.id, "ack"),
  ]);
  const summary = existingSummary(lead);
  if (!ownerClaim.auditOk) summary.owner = "unknown";
  else if (ownerClaim.claimed) summary.owner = "sending";
  if (!acknowledgmentClaim.auditOk) summary.acknowledgment = "unknown";
  else if (acknowledgmentClaim.claimed) summary.acknowledgment = "sending";

  if (!ownerClaim.claimed && !acknowledgmentClaim.claimed) return summary;

  const { data: settingsData, error: settingsError } = await supabase
    .from("user_settings")
    .select("resend_api_key, sender_email, sender_name")
    .eq("user_id", routing.user_id)
    .maybeSingle();
  const settings = settingsData as {
    resend_api_key: string | null;
    sender_email: string | null;
    sender_name: string | null;
  } | null;
  const apiKey = settings?.resend_api_key?.trim() || process.env.RESEND_API_KEY?.trim();
  const fromEmail = settings?.sender_email?.trim() || process.env.RESEND_FROM_EMAIL?.trim();
  const fromName = settings?.sender_name?.trim() || process.env.RESEND_FROM_NAME?.trim() || "Booked Out";
  const recipient = routing.lead_notification_email?.trim();
  const resend = apiKey ? new Resend(apiKey) : null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://trybookedout.com";

  async function processChannel(channel: ClientLeadChannel): Promise<ClientLeadDeliveryResult> {
    const isOwner = channel === "owner";
    const claimed = isOwner ? ownerClaim.claimed : acknowledgmentClaim.claimed;
    if (!claimed) return isOwner ? summary.owner : summary.acknowledgment;
    const attemptCount =
      (isOwner ? lead.owner_notification_attempt_count : lead.acknowledgment_attempt_count) + 1;

    let providerStatus: "accepted" | "failed" = "failed";
    let providerId: string | null = null;
    let errorCode: string | null = settingsError ? "settings_unavailable" : null;
    if (!errorCode && (!resend || !fromEmail || (isOwner && !recipient))) {
      errorCode = "email_not_configured";
    }

    if (!errorCode && resend && fromEmail) {
      try {
        const result = await resend.emails.send(
          isOwner
            ? {
                from: `${fromName} <${fromEmail}>`,
                to: recipient as string,
                subject: "New website inquiry saved",
                html: buildOwnerNotificationHtml(appUrl, lead.id),
              }
            : {
                from: `${fromName} <${fromEmail}>`,
                to: lead.email,
                subject: "We received your request",
                html: buildLeadAcknowledgmentHtml(lead.full_name, routing.business_name),
              },
          { idempotencyKey: clientLeadIdempotencyKey(lead.id, channel) }
        );
        if (result.error) {
          errorCode = "provider_rejected";
        } else if (result.data?.id) {
          providerStatus = "accepted";
          providerId = result.data.id;
        } else {
          errorCode = "provider_response_incomplete";
        }
      } catch {
        errorCode = "provider_request_failed";
      }
    }

    const auditOk = await completeChannel(
      supabase,
      lead.id,
      channel,
      providerStatus,
      attemptCount,
      providerId,
      errorCode
    );
    return auditOk ? providerStatus : "unknown";
  }

  const [owner, acknowledgment] = await Promise.all([
    processChannel("owner"),
    processChannel("ack"),
  ]);
  return { owner, acknowledgment };
}
