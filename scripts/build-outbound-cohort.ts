import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  buildOutboundCohort,
  outboundLeadsToCsv,
  parseCsv,
} from "../src/lib/outbound-engine.ts";

const args = process.argv.slice(2);
const option = (name: string): string | undefined => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const input = option("--input");
const output = option("--output");
if (!input || !output) {
  console.error(
    "Usage: npm run outbound:build -- --input <maps.csv> --output <ready.csv>"
  );
  process.exit(1);
}

const inputPath = resolve(input);
const outputPath = resolve(output);
const holdPath = outputPath.replace(/\.csv$/i, "") + ".hold.csv";
const rows = parseCsv(await readFile(inputPath, "utf8"));
const result = buildOutboundCohort(rows);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, outboundLeadsToCsv(result.ready), "utf8");
await writeFile(holdPath, outboundLeadsToCsv(result.hold), "utf8");

console.log(`Input: ${result.input_count}`);
console.log(`Deduped: ${result.deduped_count} (${result.duplicate_count} duplicates)`);
console.log(`Ready: ${result.ready.length}`);
console.log(`Hold: ${result.hold.length}`);
console.log(`Ready export: ${outputPath}`);
console.log(`QA hold export: ${holdPath}`);
