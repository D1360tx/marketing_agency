import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — Fetch a single sequence with steps and enrollment stats
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("drip_sequences")
      .select(`
        *,
        drip_steps(*),
        drip_enrollments(*, prospects(business_name, email, phone, status))
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Sequence not found" },
        { status: 404 }
      );
    }

    // Sort steps
    data.drip_steps = (data.drip_steps || []).sort(
      (a: { step_order: number }, b: { step_order: number }) =>
        a.step_order - b.step_order
    );

    // Get message stats per step
    const stepIds = data.drip_steps.map((s: { id: string }) => s.id);
    const { data: messages } = await supabase
      .from("drip_messages")
      .select("step_id, status")
      .in("step_id", stepIds);

    const stepStats: Record<string, { sent: number; opened: number; replied: number; failed: number }> = {};
    for (const msg of messages || []) {
      if (!stepStats[msg.step_id]) {
        stepStats[msg.step_id] = { sent: 0, opened: 0, replied: 0, failed: 0 };
      }
      if (msg.status === "sent" || msg.status === "delivered") stepStats[msg.step_id].sent++;
      if (msg.status === "opened") stepStats[msg.step_id].opened++;
      if (msg.status === "replied") stepStats[msg.step_id].replied++;
      if (msg.status === "failed" || msg.status === "bounced") stepStats[msg.step_id].failed++;
    }

    return NextResponse.json({
      sequence: {
        ...data,
        step_stats: stepStats,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT — Update sequence (name, description, status) or steps
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Update sequence fields
    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (body.name !== undefined) updateFields.name = body.name;
    if (body.description !== undefined) updateFields.description = body.description;
    if (body.status !== undefined) updateFields.status = body.status;

    const { error: updateError } = await supabase
      .from("drip_sequences")
      .update(updateFields)
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // If steps are provided, replace them
    if (body.steps && Array.isArray(body.steps)) {
      // Delete existing steps
      await supabase.from("drip_steps").delete().eq("sequence_id", id);

      // Insert new steps
      const stepsToInsert = body.steps.map(
        (step: { delay_days: number; subject_template?: string; body_template: string }, index: number) => ({
          sequence_id: id,
          step_order: index + 1,
          delay_days: step.delay_days,
          subject_template: step.subject_template || null,
          body_template: step.body_template,
        })
      );

      const { error: stepsError } = await supabase
        .from("drip_steps")
        .insert(stepsToInsert);

      if (stepsError) {
        return NextResponse.json(
          { error: stepsError.message },
          { status: 500 }
        );
      }
    }

    // Fetch updated sequence
    const { data } = await supabase
      .from("drip_sequences")
      .select("*, drip_steps(*)")
      .eq("id", id)
      .single();

    return NextResponse.json({ sequence: data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE — Delete a sequence and all related data (cascades)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("drip_sequences")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

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
