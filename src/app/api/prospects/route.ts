import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prospectUpdateSchema } from "@/types";
import { logActivity } from "@/lib/activity-log";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "100");
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("prospects")
      .select("*, website_analyses(*)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      prospects: data,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
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
      // Extract the newly appended note text (last entry after the separator)
      const noteText = updates.notes.trim();
      const lastSepIdx = noteText.lastIndexOf("\n---\n");
      const newEntry = lastSepIdx >= 0 ? noteText.slice(lastSepIdx + 5).trim() : noteText;
      // Strip the timestamp header line to get just the note body
      const lines = newEntry.split("\n");
      const noteBody = lines.length > 1 ? lines.slice(1).join("\n").trim() : newEntry;
      const photoUrls = [...noteBody.matchAll(/\[img:(https?:\/\/[^\]]+)\]/g)].map(m => m[1]);
      const cleanBody = noteBody.replace(/\[img:https?:\/\/[^\]]+\]/g, "").trim();
      const textPart = cleanBody ? `Note added: ${cleanBody.slice(0, 200)}${cleanBody.length > 200 ? "…" : ""}` : "Screenshot added";
      const photoTag = photoUrls.length > 0 ? `\n[photos:${photoUrls.join("|")}]` : "";
      await logActivity(supabase, {
        prospect_id: id,
        user_id: user.id,
        activity_type: "notes_updated",
        description: `${textPart}${photoTag}`,
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

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { business_name, phone, email, city, state, business_type, notes, source } = body;

    if (!business_name) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("prospects")
      .insert({
        user_id: user.id,
        business_name,
        phone: phone || null,
        email: email || null,
        city: city || null,
        state: state || null,
        business_type: business_type || null,
        notes: notes ? `[${new Date().toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}]\n${notes}` : null,
        status: "new",
        search_query: source || "Manual entry",
        source: source || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logActivity(supabase, {
      prospect_id: data.id,
      user_id: user.id,
      activity_type: "created",
      description: `Manually added via ${source || "manual entry"}`,
      metadata: { source },
    });

    return NextResponse.json({ prospect: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
