import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  buildOutboundCohort,
  normalizeMapsRow,
  outboundLeadsToCsv,
  parseCsv,
} from "../src/lib/outbound-engine.ts";
import { calculateBookedOutScore } from "../src/lib/lead-scoring.ts";

const mapsCsv = `name,category,address,phone,website,rating,review_count,email,facebook,maps_url
"Alpha HVAC, LLC",HVAC,1 Main St,(512) 555-0100,,4.8,120,Owner@AlphaHVAC.com,https://facebook.com/alpha,https://maps.example/alpha
Alpha HVAC LLC,HVAC,1 Main St,+1 512-555-0100,,4.8,120,owner@alphahvac.com,,https://maps.example/alpha-duplicate
Beta Plumbing,Plumber,2 Oak Ave,512.555.0200,www.betaplumbing.com/?utm_source=maps,4.6,8,hello@betaplumbing.com,,https://maps.example/beta
Gamma Electric,Electrician,3 Elm St,512-555-0300,,4.2,2,,,https://maps.example/gamma
`;

test("Maps CSV parsing, normalization, and multi-identifier dedupe are deterministic", () => {
  const rows = parseCsv(mapsCsv);
  assert.equal(rows.length, 4);
  assert.equal(rows[0].name, "Alpha HVAC, LLC");

  const normalized = normalizeMapsRow(rows[1]);
  assert.equal(normalized.phone, "+15125550100");
  assert.equal(normalized.email, "owner@alphahvac.com");

  const result = buildOutboundCohort(rows);
  assert.deepEqual(
    {
      input: result.input_count,
      deduped: result.deduped_count,
      duplicates: result.duplicate_count,
      ready: result.ready.length,
      hold: result.hold.length,
    },
    { input: 4, deduped: 3, duplicates: 1, ready: 2, hold: 1 }
  );
});

test("dedupe closes transitive identifier bridges and preserves keyless rows", () => {
  const bridged = buildOutboundCohort([
    { name: "Alpha HVAC", phone: "512-555-0100", email: "" },
    { name: "Alpha Services", phone: "", email: "owner@alpha.example" },
    { name: "Alpha Bridge", phone: "512-555-0100", email: "owner@alpha.example" },
    { name: "" },
    { name: "" },
  ]);
  assert.equal(bridged.deduped_count, 3);
  assert.equal(bridged.duplicate_count, 2);
  assert.equal(bridged.all.filter((lead) => !lead.business_name).length, 2);
});

test("Booked Out score exposes three bounded dimensions and assigns both cohorts", () => {
  const established = calculateBookedOutScore({
    website_url: null,
    email: "owner@example.org",
    phone: "+15125550100",
    rating: 4.8,
    review_count: 120,
    facebook: "https://facebook.com/example",
  });
  assert.deepEqual(established, {
    score: 90,
    breakdown: {
      revenue_leakage: 40,
      ability_to_pay: 30,
      contact_confidence: 20,
    },
    cohort: "established_under_optimized",
  });

  const emerging = calculateBookedOutScore({
    website_url: "https://beta.example",
    email: "hello@beta.example",
    phone: "+15125550200",
    rating: 4.6,
    review_count: 8,
  });
  assert.equal(emerging.score, 49);
  assert.equal(emerging.cohort, "emerging_operator");
});

test("pre-send QA exports ready rows and holds unsafe rows with reasons", () => {
  const result = buildOutboundCohort(parseCsv(mapsCsv));
  assert.deepEqual(
    result.ready.map((lead) => lead.business_name),
    ["Alpha HVAC, LLC", "Beta Plumbing"]
  );
  assert.equal(result.hold[0].business_name, "Gamma Electric");
  assert.deepEqual(result.hold[0].qa_reasons, ["missing_email"]);

  const exported = outboundLeadsToCsv(result.ready);
  assert.match(exported, /revenue_leakage,ability_to_pay,contact_confidence/);
  assert.match(exported, /established_under_optimized/);
  assert.doesNotMatch(exported, /Gamma Electric/);
});

test("CSV export neutralizes spreadsheet formulas from untrusted Maps data", () => {
  const result = buildOutboundCohort([{
    name: "=HYPERLINK(\"https://evil.example\")",
    email: "owner@example.org",
    phone: "512-555-0100",
  }]);
  const exported = outboundLeadsToCsv(result.all);
  assert.match(exported, /'\=HYPERLINK/);
  assert.doesNotMatch(exported, /,=HYPERLINK/);
});

test("CLI creates missing output directories and writes separate ready and QA hold exports", async () => {
  const directory = await mkdtemp(join(tmpdir(), "booked-outbound-"));
  const input = join(directory, "maps.csv");
  const output = join(directory, "nested", "ready.csv");
  await writeFile(input, mapsCsv, "utf8");

  const run = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "scripts/build-outbound-cohort.ts", "--input", input, "--output", output],
    { cwd: new URL("../", import.meta.url), encoding: "utf8" }
  );
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /Deduped: 3 \(1 duplicates\)/);
  assert.match(run.stdout, /Ready: 2/);
  assert.match(run.stdout, /Hold: 1/);

  const ready = await readFile(output, "utf8");
  const hold = await readFile(join(directory, "nested", "ready.hold.csv"), "utf8");
  assert.match(ready, /Alpha HVAC/);
  assert.doesNotMatch(ready, /Gamma Electric/);
  assert.match(hold, /Gamma Electric/);
  assert.match(hold, /missing_email/);
});
