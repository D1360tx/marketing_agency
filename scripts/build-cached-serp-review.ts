import { lstat, mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { buildCachedSerpBatch } from "../src/lib/cached-serp.ts";

const usage = "Usage: npm run outbound:serp -- --input <cached.json> --output <new-review-directory> --now <UTC ISO timestamp>";
let staging: string | undefined;
try {
  const args = process.argv.slice(2);
  const options = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (!["--input", "--output", "--now"].includes(key) || !value || value.startsWith("--") || options.has(key)) throw new Error(usage);
    options.set(key, value);
  }
  if (options.size !== 3) throw new Error(usage);
  const input = resolve(options.get("--input")!);
  const output = resolve(options.get("--output")!);
  if ((await stat(input)).size > 10 * 1024 * 1024) throw new Error("INPUT_TOO_LARGE: maximum 10 MiB");
  const result = buildCachedSerpBatch(JSON.parse(await readFile(input, "utf8")), options.get("--now")!);
  try {
    await lstat(output);
    throw new Error("OUTPUT_EXISTS: choose a new review directory; previous artifacts are immutable");
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error;
  }
  await mkdir(dirname(output), { recursive: true });
  staging = await mkdtemp(join(dirname(output), `.${basename(output)}-`));
  const { ready, hold, ...manifest } = result;
  const blocks = [...ready, ...hold].sort((a, b) => a.input_index - b.input_index).flatMap((row) => row.evidence ? [row.evidence] : []);
  await writeFile(join(staging, "ready.json"), JSON.stringify(ready, null, 2) + "\n", { mode: 0o600 });
  await writeFile(join(staging, "hold.json"), JSON.stringify(hold, null, 2) + "\n", { mode: 0o600 });
  await writeFile(join(staging, "evidence.jsonl"), blocks.map((block) => JSON.stringify(block) + "\n").join(""), { mode: 0o600 });
  // Read back the exact artifacts before publishing the completed directory.
  const readyRead = JSON.parse(await readFile(join(staging, "ready.json"), "utf8"));
  const holdRead = JSON.parse(await readFile(join(staging, "hold.json"), "utf8"));
  const evidenceRead = (await readFile(join(staging, "evidence.jsonl"), "utf8")).split("\n").filter(Boolean).map((line) => JSON.parse(line));
  if (JSON.stringify(readyRead) !== JSON.stringify(ready) || JSON.stringify(holdRead) !== JSON.stringify(hold)
    || JSON.stringify(evidenceRead) !== JSON.stringify(blocks)
    || readyRead.length + holdRead.length !== manifest.counts.input) throw new Error("ARTIFACT_RECONCILIATION_FAILED");
  await writeFile(join(staging, "manifest.json"), JSON.stringify({ ...manifest, evidence_count: blocks.length, reconciled: true }, null, 2) + "\n", { mode: 0o600 });
  await rename(staging, output);
  staging = undefined;
  console.log(JSON.stringify({ ...manifest.counts, evidence_count: blocks.length, reconciled: true, review_only: true, output }));
} catch (error) {
  if (staging) await rm(staging, { recursive: true, force: true });
  console.error(error instanceof Error ? error.message : "Could not process cached SERP fixture");
  process.exitCode = 1;
}
