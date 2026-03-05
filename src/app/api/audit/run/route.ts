import { NextResponse } from "next/server";
import { runAudit } from "@/lib/audit-runner";

/**
 * POST /api/audit/run
 * Body: { prospect_id: string }
 *
 * Runs PageSpeed Insights + Brave competitor search for a prospect,
 * calculates an A–F grade, saves to website_analyses, and returns the results.
 * Uses service role key — no auth required (called from internal triggers).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prospect_id } = body;

    if (!prospect_id) {
      return NextResponse.json(
        { error: "prospect_id is required" },
        { status: 400 }
      );
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
