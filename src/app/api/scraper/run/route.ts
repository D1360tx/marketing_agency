import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { spawn } from "child_process";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

// Path to the Python scraper CLI
const SCRAPER_CLI = process.env.GMAPS_SCRAPER_PATH ||
  path.join(process.cwd(), "../../workspace/tools/gmaps-scraper/cli.py");

const JOBS_DIR = path.join(process.cwd(), ".scraper-jobs");

function ensureJobsDir() {
  if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true });
}

function writeJob(jobId: string, data: object) {
  ensureJobsDir();
  fs.writeFileSync(path.join(JOBS_DIR, `${jobId}.json`), JSON.stringify(data));
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { query, location, limit = 60, enrich = true, batch } = body;

    // Validate input
    if (!query && !batch) {
      return NextResponse.json({ error: "query or batch is required" }, { status: 400 });
    }

    const jobId = randomUUID();
    const outputPath = path.join(JOBS_DIR, `${jobId}.csv`);

    // Write initial job state
    writeJob(jobId, {
      jobId,
      status: "running",
      query: query || `batch(${batch?.length ?? 0})`,
      startedAt: new Date().toISOString(),
      userId: user.id,
      progress: [],
      total: 0,
      enriched: 0,
    });

    // Build CLI args
    const fullQuery = location ? `${query} ${location}` : query;
    const args = [
      SCRAPER_CLI,
      "--query", fullQuery,
      "--limit", String(limit),
      "--output", outputPath,
    ];
    if (!enrich) args.push("--no-enrich");

    // Spawn scraper process (non-blocking)
    const child = spawn("python3", args, { detached: true, stdio: ["ignore", "pipe", "pipe"] });

    const logLines: string[] = [];

    child.stdout?.on("data", (chunk: Buffer) => {
      const lines = chunk.toString().split("\n").filter(Boolean);
      logLines.push(...lines);
      // Update job progress
      const job = JSON.parse(fs.readFileSync(path.join(JOBS_DIR, `${jobId}.json`), "utf8"));
      job.progress = logLines.slice(-50); // keep last 50 lines
      const match = logLines.join("\n").match(/\[(\d+)\]/g);
      if (match) job.total = parseInt(match[match.length - 1].replace(/[\[\]]/g, ""));
      writeJob(jobId, job);
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      logLines.push(chunk.toString());
    });

    child.on("close", async (code) => {
      const job = JSON.parse(fs.readFileSync(path.join(JOBS_DIR, `${jobId}.json`), "utf8"));

      if (code === 0 && fs.existsSync(outputPath.replace(".csv", ".json"))) {
        // Import results into Supabase
        try {
          const jsonPath = outputPath.replace(".csv", ".json");
          const results = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

          const rows = results.map((b: Record<string, string>) => ({
            user_id: user.id,
            business_name: b.name || "Unknown",
            address: b.address || null,
            phone: b.phone || null,
            email: b.email || null,
            website_url: b.website || null,
            google_maps_url: b.maps_url || null,
            rating: b.rating ? parseFloat(b.rating) : null,
            review_count: b.review_count ? parseInt(b.review_count.replace(/,/g, "")) : null,
            business_type: b.category || null,
            hours: b.hours || null,
            owner_name: b.owner_name || null,
            facebook: b.facebook || null,
            instagram: b.instagram || null,
            linkedin: b.linkedin || null,
            twitter: b.twitter || null,
            yelp: b.yelp || null,
            search_query: fullQuery,
            status: "new",
            source: "gmaps-scraper",
          }));

          // Upsert by phone to avoid dupes
          const { data: inserted, error: dbError } = await supabase
            .from("prospects")
            .upsert(rows, { onConflict: "phone", ignoreDuplicates: true })
            .select("id");

          job.status = "complete";
          job.importedCount = inserted?.length ?? rows.length;
          job.error = dbError?.message || null;
        } catch (err) {
          job.status = "error";
          job.error = String(err);
        }
      } else {
        job.status = code === 0 ? "complete" : "error";
        job.error = code !== 0 ? `Process exited with code ${code}` : null;
      }

      job.completedAt = new Date().toISOString();
      writeJob(jobId, job);
    });

    child.unref();

    return NextResponse.json({ jobId, status: "running" });
  } catch (err) {
    console.error("Scraper run error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
