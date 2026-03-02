import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enrollProspect, bulkEnrollProspects } from "@/lib/drip-engine";

// POST — Enroll prospect(s) into a drip sequence
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
    const { sequence_id, prospect_id, prospect_ids } = body;

    if (!sequence_id) {
      return NextResponse.json(
        { error: "sequence_id is required" },
        { status: 400 }
      );
    }

    // Verify sequence exists and belongs to user
    const { data: sequence } = await supabase
      .from("drip_sequences")
      .select("id, status")
      .eq("id", sequence_id)
      .eq("user_id", user.id)
      .single();

    if (!sequence) {
      return NextResponse.json(
        { error: "Sequence not found" },
        { status: 404 }
      );
    }

    if (sequence.status !== "active") {
      return NextResponse.json(
        { error: "Sequence must be active to enroll prospects" },
        { status: 400 }
      );
    }

    // Bulk enroll
    if (prospect_ids && Array.isArray(prospect_ids)) {
      const result = await bulkEnrollProspects(supabase, {
        sequence_id,
        prospect_ids,
        user_id: user.id,
      });

      return NextResponse.json(result);
    }

    // Single enroll
    if (prospect_id) {
      const result = await enrollProspect(supabase, {
        sequence_id,
        prospect_id,
        user_id: user.id,
      });

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ enrollment: result.data }, { status: 201 });
    }

    return NextResponse.json(
      { error: "prospect_id or prospect_ids is required" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
