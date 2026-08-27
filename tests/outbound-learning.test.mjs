import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  PLANNED_OUTBOUND_VARIANTS,
  parseEvidenceFixture,
  runOutboundLearningLoop,
} from "../src/lib/outbound-learning.ts";

const zeroes = {
  reply_positive: 0,
  reply_objection: 0,
  reply_timing: 0,
  reply_unsubscribe: 0,
  reply_irrelevant: 0,
  reply_unknown: 0,
  audits_accepted: 0,
  meetings: 0,
  clients: 0,
  complaints: 0,
};

const fixture = [
  { campaign_id: "campaign-a", variant_key: "bo2-emerging-inquiry-followup-v1", delivered: 40, ...zeroes, reply_positive: 2, audits_accepted: 1, meetings: 1 },
  { campaign_id: "campaign-b", variant_key: "bo2-emerging-inquiry-followup-v1", delivered: 40, ...zeroes, reply_positive: 2, audits_accepted: 1 },
  { campaign_id: "campaign-c", variant_key: "bo2-emerging-web-gap-v1", delivered: 75, ...zeroes },
  { campaign_id: "campaign-d", variant_key: "bo2-emerging-web-gap-v1", delivered: 75, ...zeroes },
  { campaign_id: "campaign-e", variant_key: "bo2-emerging-review-gap-v1", delivered: 50, ...zeroes, reply_unknown: 5 },
  { campaign_id: "campaign-f", variant_key: "bo2-emerging-review-gap-v1", delivered: 50, ...zeroes, reply_unknown: 5 },
  { campaign_id: "campaign-g", variant_key: "bo2-established-inquiry-followup-v1", delivered: 40, ...zeroes, reply_positive: 3, audits_accepted: 2, meetings: 1, complaints: 1 },
  { campaign_id: "campaign-h", variant_key: "bo2-established-inquiry-followup-v1", delivered: 40, ...zeroes, reply_positive: 2 },
];

test("six controlled variants are stable and split three per Booked Out cohort", () => {
  assert.equal(PLANNED_OUTBOUND_VARIANTS.length, 6);
  assert.equal(new Set(PLANNED_OUTBOUND_VARIANTS.map((variant) => variant.variant_key)).size, 6);
  assert.equal(PLANNED_OUTBOUND_VARIANTS.filter((variant) => variant.cohort === "emerging_operator").length, 3);
  assert.equal(PLANNED_OUTBOUND_VARIANTS.filter((variant) => variant.cohort === "established_under_optimized").length, 3);
  assert.ok(PLANNED_OUTBOUND_VARIANTS.every((variant) => !variant.pain_angle.includes("leakage")));
});

test("learning loop recommends promotion, retires only at separate volume, and emits review-only library candidates", () => {
  const result = runOutboundLearningLoop(fixture);
  const decisions = Object.fromEntries(result.decisions.map((item) => [item.variant_key, item]));

  assert.equal(decisions["bo2-emerging-inquiry-followup-v1"].decision, "recommend_promotion");
  assert.equal(decisions["bo2-emerging-web-gap-v1"].decision, "retire");
  assert.equal(decisions["bo2-emerging-review-gap-v1"].decision, "manual_review");
  assert.match(decisions["bo2-emerging-review-gap-v1"].reasons.join(","), /unknown_reply_share/);
  assert.equal(decisions["bo2-established-inquiry-followup-v1"].decision, "manual_review");
  assert.match(decisions["bo2-established-inquiry-followup-v1"].reasons.join(","), /spam_complaint/);
  assert.equal(result.copy_library.length, 1);
  assert.equal(result.copy_library[0].status, "candidate_pending_human_review");
  assert.equal(result.policy.optimizes_open_rate, false);
  assert.equal(result.policy.retirement_minimum_delivered, 150);
});

test("duplicate campaign and variant snapshots are rejected instead of double counted", () => {
  const duplicate = { campaign_id: "same", variant_key: "bo2-emerging-web-gap-v1", delivered: 10, ...zeroes };
  assert.throws(
    () => runOutboundLearningLoop([duplicate, duplicate]),
    /Duplicate campaign\/variant snapshot/
  );
});

test("impossible funnel counts require manual review and cannot be promoted", () => {
  const impossible = [
    { campaign_id: "bad-a", variant_key: "bo2-emerging-inquiry-followup-v1", delivered: 40, ...zeroes, reply_positive: 4, audits_accepted: 50, meetings: 50, clients: 50 },
    { campaign_id: "bad-b", variant_key: "bo2-emerging-inquiry-followup-v1", delivered: 40, ...zeroes, audits_accepted: 50, meetings: 50, clients: 50 },
  ];
  const decision = runOutboundLearningLoop(impossible).decisions.find(
    (item) => item.variant_key === "bo2-emerging-inquiry-followup-v1"
  );
  assert.equal(decision.decision, "manual_review");
  assert.match(decision.reasons.join(","), /audits_exceed_delivered/);
});

test("CSV fixture parsing uses the same controlled evidence contract", () => {
  const csv = `campaign_id,variant_key,delivered,reply_positive,reply_objection,reply_timing,reply_unsubscribe,reply_irrelevant,reply_unknown,audits_accepted,meetings,clients,complaints\nfirst,bo2-emerging-web-gap-v1,10,1,0,0,0,0,0,0,0,0,0\n`;
  assert.deepEqual(parseEvidenceFixture(csv, "csv"), [{
    campaign_id: "first",
    variant_key: "bo2-emerging-web-gap-v1",
    delivered: 10,
    ...zeroes,
    reply_positive: 1,
  }]);
});

test("CLI processes JSON fixture and writes deterministic decisions and library output", async () => {
  const directory = await mkdtemp(join(tmpdir(), "booked-learning-"));
  const input = join(directory, "evidence.json");
  const output = join(directory, "nested", "decisions.json");
  await writeFile(input, `${JSON.stringify({ observations: fixture })}\n`, "utf8");

  const run = spawnSync(process.execPath, [
    "--experimental-strip-types",
    "scripts/learn-outbound-copy.ts",
    "--input",
    input,
    "--output",
    output,
  ], { cwd: new URL("../", import.meta.url), encoding: "utf8" });

  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /Promotion recommendations: 1/);
  assert.match(run.stdout, /Retire: 1/);
  assert.match(run.stdout, /Manual review: 2/);
  assert.match(run.stdout, /Copy library candidates: 1/);
  const result = JSON.parse(await readFile(output, "utf8"));
  assert.equal(result.copy_library[0].winning_variant_key, "bo2-emerging-inquiry-followup-v1");
  assert.equal(result.copy_library[0].status, "candidate_pending_human_review");
});

test("CLI also processes CSV evidence", async () => {
  const directory = await mkdtemp(join(tmpdir(), "booked-learning-csv-"));
  const input = join(directory, "evidence.csv");
  const output = join(directory, "decisions.json");
  const header = "campaign_id,variant_key,delivered,reply_positive,reply_objection,reply_timing,reply_unsubscribe,reply_irrelevant,reply_unknown,audits_accepted,meetings,clients,complaints";
  await writeFile(input, `${header}\none,bo2-emerging-web-gap-v1,10,0,0,0,0,0,0,0,0,0,0\n`, "utf8");
  const run = spawnSync(process.execPath, ["--experimental-strip-types", "scripts/learn-outbound-copy.ts", "--input", input, "--output", output], {
    cwd: new URL("../", import.meta.url), encoding: "utf8",
  });
  assert.equal(run.status, 0, run.stderr);
  const result = JSON.parse(await readFile(output, "utf8"));
  assert.equal(result.decisions.find((item) => item.variant_key === "bo2-emerging-web-gap-v1").evidence.delivered, 10);
});

test("Phase 2 migration is rerunnable, controlled, owner-scoped, and review-only", async () => {
  const sql = await readFile(
    new URL("../supabase/migrations/032_outbound_copy_learning.sql", import.meta.url),
    "utf8"
  );
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.outbound_copy_variants/);
  assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS campaigns_id_user_id_unique/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS outbound_variant_key/);
  assert.doesNotMatch(sql, /outbound_cohort|outbound_segment/);
  assert.match(sql, /framework_key IN \('gap_audit_direct', 'baseline_then_fix'\)/);
  assert.match(sql, /pain_angle IN \('inquiry_followup_gap', 'mobile_web_presence_gap', 'review_request_process_gap'\)/);
  assert.match(sql, /UNIQUE \(campaign_id, variant_key\)/);
  assert.match(sql, /CHECK \(audits_accepted <= delivered\)/);
  assert.match(sql, /CHECK \(meetings <= audits_accepted\)/);
  assert.match(sql, /CHECK \(clients <= meetings\)/);
  assert.match(sql, /FOREIGN KEY \(campaign_id, user_id\) REFERENCES public\.campaigns\(id, user_id\)/);
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/g);
  assert.match(sql, /DROP POLICY IF EXISTS "Users manage own outbound observations"/);
  assert.match(sql, /USING \(auth\.uid\(\) = user_id\) WITH CHECK \(auth\.uid\(\) = user_id\)/);
  assert.match(sql, /REVOKE ALL ON public\.outbound_learning_observations, public\.outbound_copy_library FROM anon/);
  assert.match(sql, /candidate_pending_human_review/);
  assert.doesNotMatch(sql, /auto[_ -]?send|auto[_ -]?publish/i);
});
