import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prospectUpdateSchema } from "@/types";
import { logActivity } from "@/lib/activity-log";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("prospects")
      .select("*, website_analyses(*)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ prospects: data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = prospectUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;

    // Fetch current prospect for activity log comparison
    const { data: current } = await supabase
      .from("prospects")
      .select("status, notes")
      .eq("id", id)
      .single();

    const { data, error } = await supabase
      .from("prospects")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity for status changes
    if (updates.status && current && updates.status !== current.status) {
      await logActivity(supabase, {
        prospect_id: id,
        user_id: user.id,
        activity_type: "status_changed",
        description: `Status changed from "${current.status}" to "${updates.status}"`,
        metadata: { old_status: current.status, new_status: updates.status },
      });
    }

    // Log activity for notes updates
    if (updates.notes !== undefined && current && updates.notes !== current.notes) {
      await logActivity(supabase, {
        prospect_id: id,
        user_id: user.id,
        activity_type: "notes_updated",
        description: "Notes updated",
      });
    }

    return NextResponse.json({ prospect: data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await supabase.from("prospects").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
