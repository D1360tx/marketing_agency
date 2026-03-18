import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function sendTelegramNotification(data: {
  business_name: string;
  owner_name: string;
  phone: string;
  services_offered: string[];
  has_google_my_business: boolean;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text = [
    "🎉 New Client Intake Submitted!",
    `Business: ${data.business_name || "—"}`,
    `Owner: ${data.owner_name || "—"}`,
    `Phone: ${data.phone || "—"}`,
    `Services: ${data.services_offered?.length ? data.services_offered.join(", ") : "—"}`,
    `GBP: ${data.has_google_my_business ? "yes" : "no"}`,
  ].join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (err) {
    console.error("[onboarding] Telegram notification failed:", err);
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("client_onboarding")
    .select("id, status, submitted_at, business_name, owner_name, phone, prospect_id")
    .eq("token", token)
    .single();

  if (error || !data) {
    return NextResponse.json({ valid: false, error: "Link not found or expired" }, { status: 404 });
  }

  if (data.submitted_at) {
    return NextResponse.json({ valid: true, submitted: true });
  }

  // Pre-fill: if linked to a prospect, pull their data
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

  return NextResponse.json({ valid: true, submitted: false, prefill });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const supabase = getServiceClient();

  // Validate token exists and not already submitted
  const { data: existing, error: lookupError } = await supabase
    .from("client_onboarding")
    .select("id, submitted_at")
    .eq("token", token)
    .single();

  if (lookupError || !existing) {
    return NextResponse.json({ error: "Link not found or expired" }, { status: 404 });
  }

  if (existing.submitted_at) {
    return NextResponse.json({ error: "Already submitted" }, { status: 409 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    business_name,
    owner_name,
    phone,
    address,
    city,
    state,
    zip,
    service_areas,
    services_offered,
    has_google_my_business,
    google_my_business_url,
    existing_website,
    brand_colors,
    style_notes,
    logo_url,
    photo_urls,
    primary_contact_name,
    primary_contact_email,
    primary_contact_phone,
    preferred_contact_method,
    review_process_notes,
    additional_notes,
  } = body as Record<string, unknown>;

  const { error: updateError } = await supabase
    .from("client_onboarding")
    .update({
      business_name: business_name || null,
      owner_name: owner_name || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      service_areas: service_areas || null,
      services_offered: Array.isArray(services_offered) ? services_offered : [],
      has_google_my_business: Boolean(has_google_my_business),
      google_my_business_url: google_my_business_url || null,
      existing_website: existing_website || null,
      brand_colors: brand_colors || null,
      style_notes: style_notes || null,
      logo_url: logo_url || null,
      photo_urls: Array.isArray(photo_urls) ? photo_urls : [],
      primary_contact_name: primary_contact_name || null,
      primary_contact_email: primary_contact_email || null,
      primary_contact_phone: primary_contact_phone || null,
      preferred_contact_method: preferred_contact_method || null,
      review_process_notes: review_process_notes || null,
      additional_notes: additional_notes || null,
      submitted_at: new Date().toISOString(),
      status: "pending",
    })
    .eq("token", token);

  if (updateError) {
    console.error("[onboarding] Update error:", updateError);
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
  }

  // Send Telegram notification (fire-and-forget)
  sendTelegramNotification({
    business_name: String(business_name || ""),
    owner_name: String(owner_name || ""),
    phone: String(phone || ""),
    services_offered: Array.isArray(services_offered) ? (services_offered as string[]) : [],
    has_google_my_business: Boolean(has_google_my_business),
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
