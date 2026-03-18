import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { data, error } = await supabase
      .from("scrape_jobs")
      .select("id, status, result_count, error_message, results, created_at, started_at, completed_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const response: Record<string, unknown> = {
      id: data.id,
      status: data.status,
      result_count: data.result_count,
      error_message: data.error_message,
      created_at: data.created_at,
      started_at: data.started_at,
      completed_at: data.completed_at,
    };

    // Only include results if completed
    if (data.status === "completed") {
      response.results = data.results;
    }

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
