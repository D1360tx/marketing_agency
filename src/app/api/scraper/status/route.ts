import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";

const JOBS_DIR = path.join(process.cwd(), ".scraper-jobs");

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const jobPath = path.join(JOBS_DIR, `${jobId}.json`);
    if (!fs.existsSync(jobPath)) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = JSON.parse(fs.readFileSync(jobPath, "utf8"));

    // Security: only allow job owner to see it
    if (job.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(job);
  } catch (err) {
    console.error("Scraper status error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
