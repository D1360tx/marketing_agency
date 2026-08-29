import { NextResponse } from "next/server";
import {
  buildClientLeadDuplicateHash,
  allowedCorsOrigin,
  clientLeadSubmissionSchema,
  isClientLeadDeliveryComplete,
  isLeadRequestOriginAllowed,
  isValidClientLeadToken,
  leadCorsHeaders,
  shouldRetryDuplicateDelivery,
} from "@/lib/client-leads";
import {
  deliverClientLeadEmails,
  getClientLeadServiceClient,
  type ClientLeadRoutingRow,
  type ClientLeadRow,
} from "@/lib/client-lead-delivery";
import {
  consumePublicRateLimit,
  PUBLIC_SUBMISSION_HEADERS,
  readBoundedJson,
  verifyTurnstileToken,
} from "@/lib/public-submission-security";

const DUPLICATE_WINDOW_MS = 15 * 60 * 1000;
const RESPONSE_HEADERS = {
  ...PUBLIC_SUBMISSION_HEADERS,
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};
const LEAD_SELECTION =
  "id, onboarding_id, owner_user_id, submission_id, duplicate_hash, full_name, email, phone, city, service, details, owner_notification_status, acknowledgment_status, owner_notification_attempt_count, acknowledgment_attempt_count, created_at";
const ROUTING_SELECTION =
  "id, user_id, business_name, lead_capture_enabled, lead_notification_email, lead_capture_allowed_origin, lead_capture_revoked_at";

function json(body: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return NextResponse.json(body, {
    status,
    headers: { ...RESPONSE_HEADERS, ...extraHeaders },
  });
}

async function findRouting(token: string): Promise<{
  supabase: NonNullable<ReturnType<typeof getClientLeadServiceClient>>;
  routing: ClientLeadRoutingRow;
} | null> {
  const supabase = getClientLeadServiceClient();
  if (!supabase) {
    console.error("[client-leads] Missing server database configuration");
    return null;
  }
  const { data, error } = await supabase
    .from("client_onboarding")
    .select(ROUTING_SELECTION)
    .eq("lead_capture_token", token)
    .maybeSingle();
  const routing = data as ClientLeadRoutingRow | null;
  if (
    error ||
    !routing?.id ||
    !routing.user_id ||
    !routing.lead_capture_enabled ||
    !routing.lead_notification_email ||
    !routing.lead_capture_allowed_origin ||
    routing.lead_capture_revoked_at
  ) {
    return null;
  }
  return { supabase, routing };
}

function corsForRequest(request: Request, routing: ClientLeadRoutingRow): Record<string, string> | undefined {
  const origin = allowedCorsOrigin(
    request.headers.get("origin"),
    request.url,
    routing.lead_capture_allowed_origin
  );
  return origin ? leadCorsHeaders(origin) : undefined;
}

export async function OPTIONS(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!isValidClientLeadToken(token)) return new NextResponse(null, { status: 404, headers: RESPONSE_HEADERS });
  const found = await findRouting(token);
  if (!found) return new NextResponse(null, { status: 404, headers: RESPONSE_HEADERS });
  const origin = request.headers.get("origin");
  if (!origin || !isLeadRequestOriginAllowed(origin, request.url, found.routing.lead_capture_allowed_origin)) {
    return new NextResponse(null, { status: 403, headers: RESPONSE_HEADERS });
  }
  return new NextResponse(null, {
    status: 204,
    headers: { ...RESPONSE_HEADERS, ...leadCorsHeaders(origin) },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!isValidClientLeadToken(token)) return json({ error: "Lead capture is unavailable" }, 404);

  const found = await findRouting(token);
  if (!found) return json({ error: "Lead capture is unavailable" }, 404);
  const { supabase, routing } = found;
  const corsHeaders = corsForRequest(request, routing);
  if (
    !isLeadRequestOriginAllowed(
      request.headers.get("origin"),
      request.url,
      routing.lead_capture_allowed_origin
    )
  ) {
    return json({ error: "Origin is not allowed" }, 403);
  }

  const boundedBody = await readBoundedJson(request);
  if (!boundedBody.ok) return json({ error: boundedBody.error }, boundedBody.status, corsHeaders);
  const parsed = clientLeadSubmissionSchema.safeParse(boundedBody.value);
  if (!parsed.success) {
    return json(
      {
        error: "Invalid lead submission",
        fields: parsed.error.issues.map((issue) => issue.path.join(".")).filter(Boolean),
      },
      400,
      corsHeaders
    );
  }
  const input = parsed.data;
  if (input.companyWebsite) return json({ accepted: true, saved: false }, 200, corsHeaders);

  const rateLimit = await consumePublicRateLimit(
    request,
    supabase as unknown as Parameters<typeof consumePublicRateLimit>[1],
    "client-lead",
    10,
    3600
  );
  if (!rateLimit.ok) {
    return json(
      { error: rateLimit.error },
      rateLimit.status,
      { ...corsHeaders, ...(rateLimit.status === 429 ? { "Retry-After": "3600" } : {}) }
    );
  }
  const turnstile = await verifyTurnstileToken(input.turnstileToken, request, "client_lead");
  if (!turnstile.ok) return json({ error: turnstile.error }, turnstile.status, corsHeaders);

  const duplicateHash = buildClientLeadDuplicateHash(input);
  const { data: createResult, error: createError } = await supabase.rpc(
    "create_or_get_client_lead",
    {
      p_onboarding_id: routing.id,
      p_owner_user_id: routing.user_id,
      p_submission_id: input.submissionId,
      p_duplicate_hash: duplicateHash,
      p_full_name: input.fullName,
      p_email: input.email,
      p_phone: input.phone,
      p_city: input.city,
      p_service: input.service,
      p_details: input.details,
      p_duplicate_window_seconds: DUPLICATE_WINDOW_MS / 1000,
    }
  );
  const creation = Array.isArray(createResult)
    ? (createResult[0] as { lead_id?: string; duplicate?: boolean } | undefined)
    : undefined;
  if (createError || !creation?.lead_id || typeof creation.duplicate !== "boolean") {
    console.error("[client-leads] Atomic lead creation failed", {
      code: createError?.code || "invalid_response",
    });
    return json({ error: "The request could not be saved" }, 500, corsHeaders);
  }
  const duplicate = creation.duplicate;
  const { data: leadData, error: leadError } = await supabase
    .from("client_leads")
    .select(LEAD_SELECTION)
    .eq("id", creation.lead_id)
    .eq("onboarding_id", routing.id)
    .eq("owner_user_id", routing.user_id)
    .single();
  if (leadError || !leadData) {
    console.error("[client-leads] Atomic lead read-back failed", {
      code: leadError?.code || "not_found",
    });
    return json({ error: "The request was saved but could not be verified" }, 500, corsHeaders);
  }
  const lead = leadData as ClientLeadRow;

  if (
    duplicate &&
    !shouldRetryDuplicateDelivery(
      lead.created_at,
      lead.owner_notification_status,
      lead.acknowledgment_status
    )
  ) {
    return json(
      {
        saved: true,
        duplicate: true,
        delivery: {
          owner: lead.owner_notification_status,
          acknowledgment: lead.acknowledgment_status,
        },
      },
      200,
      corsHeaders
    );
  }

  const delivery = await deliverClientLeadEmails(supabase, routing, lead);
  const complete =
    delivery.owner !== "unknown" &&
    delivery.acknowledgment !== "unknown" &&
    isClientLeadDeliveryComplete(delivery.owner) &&
    isClientLeadDeliveryComplete(delivery.acknowledgment);
  const auditIncomplete = delivery.owner === "unknown" || delivery.acknowledgment === "unknown";
  return json(
    {
      saved: true,
      duplicate,
      delivery,
      ...(complete
        ? {}
        : {
            error: auditIncomplete
              ? "The request was saved, but email processing status could not be fully audited"
              : "The request was saved, but one or more emails were not accepted by the provider",
          }),
    },
    complete ? (duplicate ? 200 : 201) : 207,
    corsHeaders
  );
}
