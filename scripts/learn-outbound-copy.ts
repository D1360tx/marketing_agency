import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";

import {
  parseEvidenceFixture,
  runOutboundLearningLoop,
} from "../src/lib/outbound-learning.ts";

const args = process.argv.slice(2);
const option = (name: string): string | undefined => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const input = option("--input");
const output = option("--output");
if (!input || !output) {
  console.error("Usage: npm run outbound:learn -- --input <evidence.json|csv> --output <decisions.json>");
  process.exit(1);
}

const inputPath = resolve(input);
const outputPath = resolve(output);
const extension = extname(inputPath).toLowerCase();
if (extension !== ".json" && extension !== ".csv") {
  console.error("Evidence input must be .json or .csv");
  process.exit(1);
}

try {
  const rows = parseEvidenceFixture(
    await readFile(inputPath, "utf8"),
    extension === ".json" ? "json" : "csv"
  );
  const result = runOutboundLearningLoop(rows);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  const counts = Object.fromEntries(
    ["recommend_promotion", "keep_testing", "retire", "manual_review"].map((decision) => [
      decision,
      result.decisions.filter((item) => item.decision === decision).length,
    ])
  );
  console.log(`Evidence rows: ${rows.length}`);
  console.log(`Promotion recommendations: ${counts.recommend_promotion}`);
  console.log(`Keep testing: ${counts.keep_testing}`);
  console.log(`Retire: ${counts.retire}`);
  console.log(`Manual review: ${counts.manual_review}`);
  console.log(`Copy library candidates: ${result.copy_library.length}`);
  console.log(`Output: ${outputPath}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Could not process evidence fixture");
  process.exit(1);
}
