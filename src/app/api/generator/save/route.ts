import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.html_content || !body.business_name || !body.template_id) {
      return NextResponse.json(
        { error: "html_content, business_name, and template_id are required" },
        { status: 400 }
      );
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
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ site: data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
