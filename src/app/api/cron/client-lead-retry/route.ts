import { NextResponse } from "next/server";
import {
  deliverClientLeadEmails,
  getClientLeadServiceClient,
  type ClientLeadRoutingRow,
  type ClientLeadRow,
} from "@/lib/client-lead-delivery";
import { verifyBearerSecret } from "@/lib/server-auth";

const MAX_CANDIDATES = 50;
const MAX_PROCESSED = 20;

export async function GET(request: Request) {
  const authorization = verifyBearerSecret(
    request.headers.get("authorization"),
    process.env.CRON_SECRET
  );
  if (!authorization.ok) {
    const error = authorization.reason === "missing-secret" ? "Server misconfigured" : "Unauthorized";
    return NextResponse.json({ error }, { status: authorization.status });
  }

  const supabase = getClientLeadServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { data, error } = await supabase.rpc("list_client_lead_retry_candidates", {
    p_limit: MAX_CANDIDATES,
    p_stale_after_seconds: 15 * 60,
  });
  if (error) {
    console.error("[client-lead-retry] Candidate read failed", { code: error.code });
    return NextResponse.json({ error: "Retry queue could not be read" }, { status: 500 });
  }

  const routingCache = new Map<string, ClientLeadRoutingRow | null>();
  let processed = 0;
  let fullyAccepted = 0;
  let incomplete = 0;

  for (const rawLead of data || []) {
    if (processed >= MAX_PROCESSED) break;
    const lead = rawLead as ClientLeadRow;
    let routing = routingCache.get(lead.onboarding_id);
    if (routing === undefined) {
      const { data: routingData, error: routingError } = await supabase
        .from("client_onboarding")
        .select(
          "id, user_id, business_name, lead_capture_enabled, lead_notification_email, lead_capture_allowed_origin, lead_capture_revoked_at"
        )
        .eq("id", lead.onboarding_id)
        .maybeSingle();
      if (routingError) {
        console.error("[client-lead-retry] Routing read failed", {
          onboardingId: lead.onboarding_id,
          code: routingError.code,
        });
      }
      routing = (routingData as ClientLeadRoutingRow | null) || null;
      routingCache.set(lead.onboarding_id, routing);
    }
    if (
      !routing ||
      !routing.lead_capture_enabled ||
      !routing.lead_notification_email ||
      routing.lead_capture_revoked_at
    ) {
      incomplete++;
      continue;
    }

    const result = await deliverClientLeadEmails(supabase, routing, lead);
    processed++;
    if (
      (result.owner === "accepted" || result.owner === "delivered") &&
      (result.acknowledgment === "accepted" || result.acknowledgment === "delivered")
    ) {
      fullyAccepted++;
    } else {
      incomplete++;
    }
  }

  return NextResponse.json(
    {
      candidates: (data || []).length,
      processed,
      fullyAccepted,
      incomplete,
      bounded: (data || []).length === MAX_CANDIDATES || processed === MAX_PROCESSED,
    },
    { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }
  );
}
