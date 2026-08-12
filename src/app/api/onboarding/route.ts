import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createOnboardingSchema = z.object({
  prospect_id: z.string().uuid().optional(),
}).strict();

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawText = await request.text();
    if (Buffer.byteLength(rawText, "utf8") > 4 * 1024) {
      return NextResponse.json({ error: "Request is too large" }, { status: 413 });
    }
    const parsed = createOnboardingSchema.safeParse(rawText ? JSON.parse(rawText) : {});
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid client selection" }, { status: 400 });
    }

    const prospectId = parsed.data.prospect_id;
    let prospect: {
      id: string;
      business_name: string;
      phone: string | null;
    } | null = null;

    if (prospectId) {
      const { data, error } = await supabase
        .from("prospects")
        .select("id, business_name, phone")
        .eq("id", prospectId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error || !data) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }
      prospect = data;

      const now = new Date().toISOString();
      const { data: existing, error: existingError } = await supabase
        .from("client_onboarding")
        .select("token")
        .eq("user_id", user.id)
        .eq("prospect_id", prospectId)
        .is("submitted_at", null)
        .is("revoked_at", null)
        .gt("expires_at", now)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existingError) {
        console.error("Onboarding lookup failed:", existingError.message);
        return NextResponse.json({ error: "Could not create client intake" }, { status: 500 });
      }
      if (existing) {
        return NextResponse.json({ token: existing.token, existing: true });
      }
    }

    const { data: created, error: createError } = await supabase
      .from("client_onboarding")
      .insert({
        user_id: user.id,
        prospect_id: prospect?.id || null,
        business_name: prospect?.business_name || null,
        phone: prospect?.phone || null,
        status: "pending",
      })
      .select("token")
      .single();

    if (createError || !created) {
      console.error("Onboarding creation failed:", createError?.message);
      return NextResponse.json({ error: "Could not create client intake" }, { status: 500 });
    }

    return NextResponse.json({ token: created.token, existing: false }, { status: 201 });
  } catch (error) {
    console.error("Onboarding creation failed:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
