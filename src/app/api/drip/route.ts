import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dripSequenceCreateSchema } from "@/types";

// GET — List all drip sequences for the user
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
      .from("drip_sequences")
      .select(`
        *,
        drip_steps(id, step_order, delay_days, subject_template, body_template),
        drip_enrollments(id, status)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add enrollment stats
    const sequences = (data || []).map((seq) => {
      const enrollments = seq.drip_enrollments || [];
      return {
        ...seq,
        drip_steps: (seq.drip_steps || []).sort(
          (a: { step_order: number }, b: { step_order: number }) =>
            a.step_order - b.step_order
        ),
        stats: {
          total_enrolled: enrollments.length,
          active: enrollments.filter(
            (e: { status: string }) => e.status === "active"
          ).length,
          completed: enrollments.filter(
            (e: { status: string }) => e.status === "completed"
          ).length,
          cancelled: enrollments.filter(
            (e: { status: string }) => e.status === "cancelled"
          ).length,
        },
        drip_enrollments: undefined, // don't send raw enrollments
      };
    });

    return NextResponse.json({ sequences });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST — Create a new drip sequence with steps
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
    const parsed = dripSequenceCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, description, channel, steps } = parsed.data;

    // Create the sequence
    const { data: sequence, error: seqError } = await supabase
      .from("drip_sequences")
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        channel,
        status: "draft",
      })
      .select()
      .single();

    if (seqError || !sequence) {
      return NextResponse.json(
        { error: seqError?.message || "Failed to create sequence" },
        { status: 500 }
      );
    }

    // Create the steps
    const stepsToInsert = steps.map((step, index) => ({
      sequence_id: sequence.id,
      step_order: index + 1,
      delay_days: step.delay_days,
      subject_template: step.subject_template || null,
      body_template: step.body_template,
    }));

    const { error: stepsError } = await supabase
      .from("drip_steps")
      .insert(stepsToInsert);

    if (stepsError) {
      // Clean up the sequence if steps failed
      await supabase.from("drip_sequences").delete().eq("id", sequence.id);
      return NextResponse.json(
        { error: stepsError.message },
        { status: 500 }
      );
    }

    // Fetch the full sequence with steps
    const { data: fullSequence } = await supabase
      .from("drip_sequences")
      .select("*, drip_steps(*)")
      .eq("id", sequence.id)
      .single();

    return NextResponse.json({ sequence: fullSequence }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
