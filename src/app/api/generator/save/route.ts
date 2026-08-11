import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const MAX_HTML_BYTES = 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_HTML_BYTES + 128 * 1024;

const saveSchema = z
  .object({
    html_content: z.string().min(1),
    business_name: z.string().trim().min(1).max(120),
    template_id: z
      .enum(["restaurant", "contractor", "professional", "salon", "retail"]),
    prospect_id: z.string().uuid().nullable().optional(),
  })
  .strict();

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody) > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: "Request is too large" }, { status: 413 });
    }

    let json: unknown;
    try {
      json = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = saveSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid site data" }, { status: 400 });
    }
    const body = parsed.data;
    if (Buffer.byteLength(body.html_content) > MAX_HTML_BYTES) {
      return NextResponse.json({ error: "Generated site is too large" }, { status: 413 });
    }

    if (body.prospect_id) {
      const { data: prospect, error: prospectError } = await supabase
        .from("prospects")
        .select("id")
        .eq("id", body.prospect_id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (prospectError || !prospect) {
        return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
      }
    }

    const { data, error } = await supabase
      .from("generated_sites")
      .insert({
        user_id: user.id,
        prospect_id: body.prospect_id || null,
        template_id: body.template_id,
        business_name: body.business_name,
        html_content: body.html_content,
      })
      .select("id, share_token, business_name, template_id, prospect_id, created_at")
      .single();

    if (error) {
      console.error("Generated site save failed:", error.message);
      return NextResponse.json({ error: "Could not save this preview" }, { status: 500 });
    }

    return NextResponse.json({ site: data });
  } catch (error) {
    console.error("Generated site save failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
