import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { clientLeadRoutingSchema } from "@/lib/client-leads";
import { readBoundedJson } from "@/lib/public-submission-security";
import { createClient } from "@/lib/supabase/server";

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}

async function ownedOnboarding(onboardingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { response: noStoreJson({ error: "Unauthorized" }, 401) } as const;

  const { data, error } = await supabase
    .from("client_onboarding")
    .select(
      "id, business_name, lead_capture_token, lead_capture_enabled, lead_notification_email, lead_capture_allowed_origin, lead_capture_revoked_at, lead_capture_token_rotated_at"
    )
    .eq("id", onboardingId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) return { response: noStoreJson({ error: "Client not found" }, 404) } as const;
  return { supabase, user, data } as const;
}

function responseBody(data: {
  id: string;
  business_name: string | null;
  lead_capture_token: string;
  lead_capture_enabled: boolean;
  lead_notification_email: string | null;
  lead_capture_allowed_origin: string;
  lead_capture_revoked_at: string | null;
  lead_capture_token_rotated_at: string | null;
}) {
  return {
    onboarding_id: data.id,
    business_name: data.business_name,
    recipient_email: data.lead_notification_email,
    enabled: data.lead_capture_enabled,
    allowed_origin: data.lead_capture_allowed_origin,
    revoked_at: data.lead_capture_revoked_at,
    token_rotated_at: data.lead_capture_token_rotated_at,
    // This bearer credential is returned only by this owner-authenticated setup route.
    endpoint: `/api/client-leads/${data.lead_capture_token}`,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ onboardingId: string }> }
) {
  const { onboardingId } = await params;
  const owned = await ownedOnboarding(onboardingId);
  if ("response" in owned) return owned.response;
  return noStoreJson(responseBody(owned.data));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ onboardingId: string }> }
) {
  const { onboardingId } = await params;
  const bounded = await readBoundedJson(request);
  if (!bounded.ok) return noStoreJson({ error: bounded.error }, bounded.status);
  const parsed = clientLeadRoutingSchema.safeParse(bounded.value);
  if (!parsed.success) return noStoreJson({ error: "Invalid routing configuration" }, 400);

  const owned = await ownedOnboarding(onboardingId);
  if ("response" in owned) return owned.response;
  const now = new Date().toISOString();
  const patch: Record<string, string | boolean | null> = {
    lead_notification_email: parsed.data.recipient_email,
    lead_capture_enabled: parsed.data.enabled,
    lead_capture_allowed_origin: parsed.data.allowed_origin,
  };
  if (parsed.data.rotate_token) {
    patch.lead_capture_token = randomBytes(32).toString("hex");
    patch.lead_capture_revoked_at = null;
    patch.lead_capture_token_rotated_at = now;
  } else if (parsed.data.revoke_token) {
    patch.lead_capture_enabled = false;
    patch.lead_capture_revoked_at = now;
  } else if (owned.data.lead_capture_revoked_at && parsed.data.enabled) {
    return noStoreJson({ error: "Rotate the revoked endpoint before enabling routing" }, 409);
  }

  const { error: updateError } = await owned.supabase
    .from("client_onboarding")
    .update(patch)
    .eq("id", onboardingId)
    .eq("user_id", owned.user.id);
  if (updateError) {
    console.error("[client-lead-routing] Update failed", { code: updateError.code });
    return noStoreJson({ error: "Routing configuration could not be saved" }, 500);
  }

  // Read back the exact owned target before reporting success.
  const { data: updated, error: readError } = await owned.supabase
    .from("client_onboarding")
    .select(
      "id, business_name, lead_capture_token, lead_capture_enabled, lead_notification_email, lead_capture_allowed_origin, lead_capture_revoked_at, lead_capture_token_rotated_at"
    )
    .eq("id", onboardingId)
    .eq("user_id", owned.user.id)
    .single();
  if (readError || !updated) {
    console.error("[client-lead-routing] Read-back failed", { code: readError?.code || "unknown" });
    return noStoreJson({ error: "Routing configuration could not be verified" }, 500);
  }
  return noStoreJson(responseBody(updated));
}
