import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { TrackingPayload } from "@/lib/tracking";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// The project does not generate Supabase database types yet. Keep the SDK's
// concrete untyped client signature localized to this server-only adapter.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = SupabaseClient<any, "public", "public", any, any>;

async function ownsMessage(
  admin: AdminClient,
  payload: TrackingPayload
): Promise<boolean> {
  if (payload.t === "drip") {
    const { data, error } = await admin
      .from("drip_messages")
      .select("id")
      .eq("id", payload.m)
      .eq("user_id", payload.u)
      .eq("prospect_id", payload.p)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }

  const { data: message, error: messageError } = await admin
    .from("campaign_messages")
    .select("id, campaign_id")
    .eq("id", payload.m)
    .eq("prospect_id", payload.p)
    .maybeSingle();
  if (messageError) throw messageError;
  if (!message) return false;

  const { data: campaign, error: campaignError } = await admin
    .from("campaigns")
    .select("id")
    .eq("id", message.campaign_id)
    .eq("user_id", payload.u)
    .maybeSingle();
  if (campaignError) throw campaignError;
  return Boolean(campaign);
}

export async function recordTrackingEvent(
  payload: TrackingPayload
): Promise<"recorded" | "ignored" | "unconfigured"> {
  const admin = getAdminClient();
  if (!admin) return "unconfigured";
  if (!(await ownsMessage(admin, payload))) return "ignored";

  const table = payload.t === "campaign" ? "campaign_messages" : "drip_messages";
  const timestamp = new Date().toISOString();

  if (payload.k === "open") {
    const { error } = await admin.from("tracked_opens").upsert(
      {
        user_id: payload.u,
        message_type: payload.t,
        message_id: payload.m,
        prospect_id: payload.p,
      },
      {
        onConflict: "message_type,message_id",
        ignoreDuplicates: true,
      }
    );
    if (error) throw error;
  } else {
    if (!payload.d) return "ignored";
    const { error } = await admin.from("tracked_clicks").upsert(
      {
        user_id: payload.u,
        message_type: payload.t,
        message_id: payload.m,
        prospect_id: payload.p,
        url: payload.d,
      },
      {
        onConflict: "message_type,message_id,url",
        ignoreDuplicates: true,
      }
    );
    if (error) throw error;
  }

  const { error: updateError } = await admin
    .from(table)
    .update({ status: "opened", opened_at: timestamp })
    .eq("id", payload.m)
    .in("status", ["sent", "delivered"]);
  if (updateError) throw updateError;

  return "recorded";
}
