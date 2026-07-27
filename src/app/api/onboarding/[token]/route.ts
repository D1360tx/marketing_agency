import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  isAssetPathForOnboarding,
  isPendingOnboardingLinkActive,
  isValidOnboardingToken,
  onboardingSubmissionSchema,
} from "@/lib/onboarding-security";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function sendTelegramNotification(data: {
  business_name: string;
  services_offered: string[];
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text = [
    "🎉 New Client Intake Submitted!",
    `Business: ${data.business_name || "—"}`,
    `Services: ${data.services_offered.length ? data.services_offered.join(", ") : "—"}`,
    "Review contact details securely in the Booked Out dashboard.",
  ].join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...(process.env.TELEGRAM_THREAD_ID
          ? { message_thread_id: Number(process.env.TELEGRAM_THREAD_ID) }
          : {}),
      }),
    });
  } catch (err) {
    console.error("[onboarding] Telegram notification failed:", err);
  }
}

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

function nullable(value: string) {
  return value || null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!isValidOnboardingToken(token)) {
    return noStoreJson({ valid: false, error: "Link not found or expired" }, { status: 404 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return noStoreJson({ valid: false, error: "Onboarding is not configured" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("client_onboarding")
    .select(
      "id, user_id, status, submitted_at, expires_at, revoked_at, business_name, owner_name, phone, prospect_id"
    )
    .eq("token", token)
    .single();

  if (error || !data || data.revoked_at) {
    return noStoreJson({ valid: false, error: "Link not found or expired" }, { status: 404 });
  }

  if (data.submitted_at) {
    return noStoreJson({ valid: true, submitted: true });
  }

  if (!isPendingOnboardingLinkActive(data)) {
    return noStoreJson({ valid: false, error: "Link not found or expired" }, { status: 410 });
  }

  let prefill: Record<string, string | null> = {
    business_name: data.business_name || null,
    owner_name: data.owner_name || null,
    phone: data.phone || null,
  };

  if (data.prospect_id) {
    const { data: prospect } = await supabase
      .from("prospects")
      .select("business_name, phone, email, address, city, state, zip, website_url")
      .eq("id", data.prospect_id)
      .eq("user_id", data.user_id)
      .single();

    if (prospect) {
      prefill = {
        business_name: data.business_name || prospect.business_name || null,
        owner_name: data.owner_name || null,
        phone: data.phone || prospect.phone || null,
        address: prospect.address || null,
        city: prospect.city || null,
        state: prospect.state || null,
        zip: prospect.zip || null,
        existing_website: prospect.website_url || null,
        primary_contact_email: prospect.email || null,
      };
    }
  }

  return noStoreJson({ valid: true, submitted: false, prefill });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!isValidOnboardingToken(token)) {
    return noStoreJson({ error: "Link not found or expired" }, { status: 404 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return noStoreJson({ error: "Onboarding is not configured" }, { status: 503 });
  }

  const { data: existing, error: lookupError } = await supabase
    .from("client_onboarding")
    .select("id, submitted_at, expires_at, revoked_at")
    .eq("token", token)
    .single();

  if (lookupError || !existing || existing.revoked_at) {
    return noStoreJson({ error: "Link not found or expired" }, { status: 404 });
  }
  if (existing.submitted_at) {
    return noStoreJson({ error: "Already submitted" }, { status: 409 });
  }
  if (!isPendingOnboardingLinkActive(existing)) {
    return noStoreJson({ error: "Link not found or expired" }, { status: 410 });
  }

  let rawBody: unknown;
  try {
    const rawText = await request.text();
    if (Buffer.byteLength(rawText, "utf8") > 100 * 1024) {
      return noStoreJson({ error: "Request body is too large" }, { status: 413 });
    }
    rawBody = JSON.parse(rawText);
  } catch {
    return noStoreJson({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = onboardingSubmissionSchema.safeParse(rawBody);
  if (!parsed.success) {
    return noStoreJson(
      { error: "Invalid onboarding details", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const body = parsed.data;
  if (body.logo_url && !isAssetPathForOnboarding(body.logo_url, existing.id)) {
    return noStoreJson({ error: "Invalid logo asset" }, { status: 400 });
  }
  if (body.photo_urls.some((path) => !isAssetPathForOnboarding(path, existing.id))) {
    return noStoreJson({ error: "Invalid photo asset" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from("client_onboarding")
    .update({
      business_name: body.business_name,
      owner_name: nullable(body.owner_name),
      phone: nullable(body.phone),
      address: nullable(body.address),
      city: nullable(body.city),
      state: nullable(body.state),
      zip: nullable(body.zip),
      service_areas: nullable(body.service_areas),
      services_offered: body.services_offered,
      has_google_my_business: body.has_google_my_business,
      google_my_business_url: nullable(body.google_my_business_url),
      existing_website: nullable(body.existing_website),
      brand_colors: nullable(body.brand_colors),
      style_notes: nullable(body.style_notes),
      logo_url: nullable(body.logo_url),
      photo_urls: body.photo_urls,
      primary_contact_name: nullable(body.primary_contact_name),
      primary_contact_email: nullable(body.primary_contact_email),
      primary_contact_phone: nullable(body.primary_contact_phone),
      preferred_contact_method: body.preferred_contact_method,
      review_process_notes: nullable(body.review_process_notes),
      additional_notes: nullable(body.additional_notes),
      submitted_at: now,
      status: "pending",
    })
    .eq("id", existing.id)
    .is("submitted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", now)
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("[onboarding] Update error:", updateError);
    return noStoreJson({ error: "Failed to save submission" }, { status: 500 });
  }
  if (!updated) {
    return noStoreJson({ error: "Link has expired or was already submitted" }, { status: 409 });
  }

  sendTelegramNotification({
    business_name: body.business_name,
    services_offered: body.services_offered,
  }).catch(() => {});

  return noStoreJson({ success: true });
}
