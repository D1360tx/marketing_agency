import { NextResponse } from "next/server";
import { runAudit } from "@/lib/audit-runner";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const auditRequestSchema = z.object({
  prospect_id: z.string().uuid(),
});

/**
 * POST /api/audit/run
 * Body: { prospect_id: string }
 *
 * Runs PageSpeed Insights + Brave competitor search for a prospect,
 * calculates an A–F grade, saves to website_analyses, and returns the results.
 * Requires a signed-in user who owns the requested prospect. The audit runner
 * uses the service-role key only after this ownership check succeeds.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = auditRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Valid prospect_id is required" }, { status: 400 });
    }

    const { prospect_id } = parsed.data;
    const { data: prospect, error: prospectError } = await supabase
      .from("prospects")
      .select("id")
      .eq("id", prospect_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (prospectError) {
      console.error("[audit/run] Ownership check failed:", prospectError);
      return NextResponse.json({ error: "Unable to verify prospect" }, { status: 500 });
    }

    if (!prospect) {
      return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
    }

    const result = await runAudit(prospect_id);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[audit/run] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Audit failed" },
      { status: 500 }
    );
  }
}
