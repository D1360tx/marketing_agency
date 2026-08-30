import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const onboardingIdSchema = z.string().uuid();

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const onboardingId = new URL(request.url).searchParams.get("onboarding_id");
  if (onboardingId && !onboardingIdSchema.safeParse(onboardingId).success) {
    return NextResponse.json({ error: "Invalid client filter" }, { status: 400 });
  }

  let query = supabase
    .from("client_leads")
    .select(
      "id, onboarding_id, full_name, email, phone, city, service, details, owner_notification_status, acknowledgment_status, owner_notification_attempted_at, owner_notification_accepted_at, owner_notification_delivered_at, acknowledgment_attempted_at, acknowledgment_accepted_at, acknowledgment_delivered_at, created_at"
    )
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (onboardingId) query = query.eq("onboarding_id", onboardingId);

  const { data, error } = await query;
  if (error) {
    console.error("[client-leads] Owner list failed", { code: error.code });
    return NextResponse.json({ error: "Client leads could not be loaded" }, { status: 500 });
  }
  return NextResponse.json(
    { leads: data || [] },
    { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } }
  );
}
