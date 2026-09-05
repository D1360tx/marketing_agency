import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { growthSchemas, validateContract, validateShape } from "../src/lib/growth-contracts.ts";
import {
  APPROVED_CTA, APPROVED_OFFER, approvedDraftBody, buildCachedSerpBatch,
  buildSerpEvidence, validateSerpDrafts,
} from "../src/lib/cached-serp.ts";

const fixture = JSON.parse(await readFile(new URL("./fixtures/cached-serp.synthetic.json", import.meta.url), "utf8"));
const now = "2026-09-05T12:00:00.000Z";
const fresh = () => structuredClone(fixture.records[0]);
const evaluate = (row = fresh(), time = now) => buildSerpEvidence(row.context, row.evidence_id, row.observations, time);
const draftFor = (row, evidence) => ({ ...row.drafts[0], body: approvedDraftBody(evidence) });
const validate = (drafts, row = fresh(), evidence = evaluate(row).evidence, time = now) => validateSerpDrafts(row.context, evidence, drafts, time);
const removeProspect = (row, channel) => {
  const source = row.observations.find((item) => item.channel === channel);
  source.value.results = source.value.results.filter((item) => item.name !== row.context.identity.business_name).map((item, i) => ({ ...item, position: i + 1 }));
  source.value.depth = source.value.results.length;
};
const setMapsPosition = (row, position) => {
  const source = row.observations[0];
  const target = source.value.results.find((item) => item.name === row.context.identity.business_name);
  source.value.results = Array.from({ length: Math.max(position, 4) }, (_, index) => index + 1 === position
    ? { ...target, position } : { position: index + 1, name: `Competitor ${index + 1}`, url: `https://maps.example/competitor-${index + 1}`, kind: "business" });
  source.value.depth = source.value.results.length;
};

test("versioned contracts validate real outputs and reject malformed shared actions", () => {
  const row = fresh();
  row.observations.forEach((observation) => assert.deepEqual(validateContract("observation", observation), []));
  assert.deepEqual(validateContract("evidence-block", evaluate(row).evidence), []);
  const action = {
    schema_version: "1.0.0", action_id: "action-demo", tenant_id: "demo-booked-out", subject_type: "client", subject_id: "demo-alpha",
    affected_url: "https://alpha.example/", evidence_ids: [row.evidence_id], problem: "Review local search coverage",
    expected_mechanism: "Match relevant service intent", priority: "medium", confidence: 0.8,
    proposed_action: "Prepare a baseline review", owner: "operator", dependencies: [], verification_method: "Compare a fresh bounded capture",
    rollback: null, approval_required: true, status: "proposed",
  };
  assert.deepEqual(validateContract("action-candidate", action), []);
  for (const mutation of [{ approval_required: false }, { evidence_ids: [] }, { status: "sent" }, { tenant_id: "" }, { surprise: true }]) {
    assert.ok(validateContract("action-candidate", { ...action, ...mutation }).length);
  }
  const supported = new Set(["$schema", "$id", "$ref", "title", "type", "additionalProperties", "required", "properties", "const", "enum", "anyOf", "items", "maxItems", "minItems", "minLength", "maxLength", "pattern", "minimum", "maximum", "format"]);
  const walk = (schema) => {
    Object.keys(schema).forEach((key) => assert.ok(supported.has(key), `unsupported runtime schema keyword ${key}`));
    Object.values(schema.properties ?? {}).forEach(walk);
    if (schema.items) walk(schema.items);
    schema.anyOf?.forEach(walk);
  };
  Object.values(growthSchemas).forEach(walk);
});

test("verified near-win evidence preserves source URLs, names, timestamps and bounded positions without mutation", () => {
  const row = fresh();
  const before = structuredClone(row);
  const { evidence, reasons } = evaluate(row);
  assert.deepEqual(reasons, []);
  assert.equal(evidence.classification, "MAPS_NEAR_WIN");
  assert.equal(evidence.maps_position, 4);
  assert.equal(evidence.organic_position, 2);
  assert.deepEqual(evidence.competitors.map((item) => item.name), ["Beta HVAC", "Gamma HVAC", "Delta HVAC", "Beta HVAC"]);
  assert.match(evidence.allowed_wording, /Beta HVAC.*https:\/\/maps.example\/beta/);
  assert.equal(evidence.expires_at, "2026-09-08T12:00:00.000Z");
  assert.deepEqual(row, before);
  assert.deepEqual(evaluate({ ...row, observations: [...row.observations].reverse() }), { evidence, reasons });
});

for (const position of [1, 2, 3, 4, 10, 11]) {
  test(`Maps boundary ${position} is classified conservatively`, () => {
    const row = fresh(); setMapsPosition(row, position);
    const { evidence, reasons } = evaluate(row);
    assert.equal(evidence.classification, position <= 3 ? "TOP_3_WINNER" : position <= 10 ? "MAPS_NEAR_WIN" : null);
    assert.equal(evidence.eligible, position >= 4 && position <= 10);
    if (position <= 3) assert.ok(reasons.includes("TOP_3_WINNER_HOLD"));
    if (position > 10) assert.ok(reasons.includes("NO_SUPPORTED_GAP"));
  });
}

test("ranking gap is explicitly bounded Maps absence, not a universal visibility claim", () => {
  const row = fresh(); removeProspect(row, "maps");
  const { evidence } = evaluate(row);
  assert.equal(evidence.classification, "RANKING_GAP");
  assert.equal(evidence.maps_position, null);
  assert.match(evidence.allowed_wording, /did not include Alpha HVAC within positions 1-3/);
  assert.equal(validate([draftFor(row, evidence)], row, evidence).status, "ready");
});

test("directory dependence requires organic domain absence and a captured directory", () => {
  const row = fresh(); removeProspect(row, "maps"); removeProspect(row, "organic");
  Object.assign(row.observations[1].value.results[0], { name: "Local Directory", kind: "directory", url: "https://directory.example/hvac" });
  const { evidence } = evaluate(row);
  assert.equal(evidence.classification, "DIRECTORY_DEPENDENT");
  assert.equal(evidence.organic_position, null);
  assert.match(evidence.allowed_wording, /cached organic.*Local Directory/);
  assert.equal(validate([draftFor(row, evidence)], row, evidence).status, "ready");
  row.observations[1].value.results[0].kind = "business";
  assert.equal(evaluate(row).evidence.classification, "RANKING_GAP");
});

test("organic-only absence is supported; Maps top-three wins take precedence over directories", () => {
  const row = fresh(); setMapsPosition(row, 11); removeProspect(row, "organic");
  assert.equal(evaluate(row).evidence.classification, "RANKING_GAP");
  assert.match(evaluate(row).evidence.allowed_wording, /cached organic/);
  setMapsPosition(row, 1);
  row.observations[1].value.results[0].kind = "directory";
  assert.equal(evaluate(row).evidence.classification, "TOP_3_WINNER");
});

for (const status of ["unavailable", "blocked", "not_due", "stale"]) {
  test(`${status} is preserved, never classified as zero or absence`, () => {
    const row = fresh(); row.observations[0].source_status = status; row.observations[0].value = null;
    const { evidence, reasons } = evaluate(row);
    assert.equal(evidence.classification, null);
    assert.equal(evidence.eligible, false);
    assert.equal(evidence.maps_position, null);
    assert.equal(evidence.observations[0].source_status, status);
    assert.equal(evidence.observations[0].value, null);
    assert.equal(evidence.allowed_wording, "");
    assert.ok(reasons.includes(`SOURCE_${status.toUpperCase()}`));
    assert.equal(validate(row.drafts, row, evidence).status, "hold");
  });
}

test("expiry boundary holds verified evidence without rewriting its source status", () => {
  const row = fresh();
  const { evidence, reasons } = evaluate(row, row.observations[0].expires_at);
  assert.ok(reasons.includes("EVIDENCE_EXPIRED"));
  assert.equal(evidence.observations[0].source_status, "verified");
  assert.equal(evidence.classification, null);
  assert.equal(validate(row.drafts, row, evaluate(row).evidence, row.observations[0].expires_at).status, "hold");
});

const mutations = [
  ["tenant", (r) => { r.observations[0].tenant_id = "other"; }, "IDENTITY_MISMATCH"],
  ["prospect", (r) => { r.observations[0].identity.subject_id = "other"; }, "IDENTITY_MISMATCH"],
  ["business", (r) => { r.observations[0].identity.business_name = "Wrong"; }, "IDENTITY_MISMATCH"],
  ["query", (r) => { r.observations[0].query = "plumber Austin"; }, "QUERY_MISMATCH"],
  ["city", (r) => { r.observations[0].geography.city = "Dallas"; }, "QUERY_MISMATCH"],
  ["region", (r) => { r.observations[0].geography.region = "CA"; }, "QUERY_MISMATCH"],
  ["service", (r) => { r.context.service = "Plumbing"; }, "QUERY_MISMATCH"],
  ["device", (r) => { r.observations[0].device = "mobile"; }, "SEARCH_CONTEXT_MISMATCH"],
  ["future source", (r) => { r.observations[0].observed_at = "2026-09-07T12:00:00.000Z"; }, "INVALID_SOURCE_TIME"],
  ["inverted expiry", (r) => { r.observations[0].expires_at = r.observations[0].observed_at; }, "INVALID_SOURCE_TIME"],
  ["position", (r) => { r.observations[0].value.results[0].position = 2; }, "INCOMPLETE_RANKING_EVIDENCE"],
  ["ranking URL", (r) => { r.observations[0].value.results[3].url = "https://wrong.example/"; }, "RANKING_IDENTITY_MISMATCH"],
  ["ranking name", (r) => { r.observations[0].value.results[3].name = "Wrong"; }, "RANKING_IDENTITY_MISMATCH"],
  ["missing source", (r) => { r.observations.pop(); }, "OBSERVATION_PAIR_REQUIRED"],
  ["duplicate channel", (r) => { r.observations[1].channel = "maps"; }, "OBSERVATION_PAIR_REQUIRED"],
  ["duplicate observation", (r) => { r.observations[1].observation_id = r.observations[0].observation_id; }, "DUPLICATE_OBSERVATION_ID"],
  ["missing verified data", (r) => { r.observations[0].value = null; }, "VERIFIED_VALUE_REQUIRED"],
  ["unavailable with fabricated data", (r) => { r.observations[0].source_status = "unavailable"; }, "NONVERIFIED_VALUE_PRESENT"],
  ["incomplete capture", (r) => { r.observations[0].value.complete = false; }, "INVALID_CONTRACT"],
  ["missing competitor name", (r) => { r.observations[0].value.results[0].name = ""; }, "INVALID_CONTRACT"],
  ["missing ranking URL", (r) => { delete r.observations[0].value.results[0].url; }, "INVALID_CONTRACT"],
  ["zero position", (r) => { r.observations[0].value.results[0].position = 0; }, "INVALID_CONTRACT"],
  ["credential URL", (r) => { r.observations[0].source_url = "https://user:secret@example.org/"; }, "INVALID_CONTRACT"],
  ["non-http URL", (r) => { r.observations[0].value.results[0].url = "javascript:alert(1)"; }, "INVALID_CONTRACT"],
  ["invalid calendar date", (r) => { r.observations[0].observed_at = "2026-02-30T12:00:00.000Z"; }, "INVALID_CONTRACT"],
];
for (const [name, mutate, code] of mutations) {
  test(`evidence rejects ${name}`, () => {
    const row = fresh(); mutate(row);
    const result = evaluate(row);
    assert.ok(result.reasons.some((reason) => reason.includes(code)), result.reasons.join(","));
    assert.notEqual(result.evidence?.eligible, true);
    if (code === "QUERY_MISMATCH") assert.equal(result.evidence.classification, "QUERY_MISMATCH");
  });
}

test("unknown keys, nulls, unsafe text, invalid timestamps and unknown source status fail closed", () => {
  for (const bad of [null, [], {}, { ...fresh().observations[0], source_status: "missing" }, { ...fresh().observations[0], extra: true }]) {
    assert.ok(validateContract("observation", bad).length);
  }
  assert.ok(validateShape({ type: "number" }, NaN).length);
  assert.ok(validateShape({ type: "string" }, "bad\u0000text").length);
  assert.throws(() => evaluate(fresh(), "September 5"), /INVALID_EVALUATION_TIME/);
});

test("exact supplied draft passes; no model or provider is called", () => {
  const result = validate(fresh().drafts);
  assert.equal(result.status, "ready");
  assert.deepEqual(result.attempts[0].violations, []);
  assert.equal(result.attempts_remaining, 0);
});

for (const [name, replaceFrom, replaceTo] of [
  ["competitor", "Beta HVAC", "Fabricated HVAC"], ["city", "Austin, TX", "Dallas, TX"],
  ["query", "HVAC repair Austin", "plumber Austin"], ["position", "position 4", "position 2"],
  ["URL", "https://maps.example/beta", "https://maps.example/wrong"], ["service", "HVAC repair", "AC installation"],
]) {
  test(`supplied draft rejects mismatched ${name}`, () => {
    const draft = fresh().drafts[0]; draft.body = draft.body.replace(replaceFrom, replaceTo);
    const result = validate([draft]);
    assert.equal(result.status, "retry");
    assert.ok(result.reasons.includes("EVIDENCE_WORDING_MISMATCH"));
  });
}

for (const [suffix, expected] of [
  [" Guaranteed first place.", "PROHIBITED_CLAIM"], [" You lost revenue.", "PROHIBITED_CLAIM"],
  [" You missed calls.", "PROHIBITED_CLAIM"], [" You are invisible in ChatGPT.", "PROHIBITED_CLAIM"],
  [" Improve revenue 50%.", "PROHIBITED_CLAIM"], [" Get 50 leads.", "UNSUPPORTED_NUMBER"],
  [" Get fifty leads.", "EVIDENCE_WORDING_MISMATCH"], [" Get three jobs.", "UNSUPPORTED_NUMBER"],
  [" Better results—fast.", "EM_DASH"], [" hello".repeat(80), "DRAFT_TOO_LONG"],
  [" Results are assured.", "EVIDENCE_WORDING_MISMATCH"],
]) {
  test(`unsupported prose is blocked: ${expected} ${suffix.slice(0, 30)}`, () => {
    const draft = fresh().drafts[0]; draft.body += suffix;
    assert.ok(validate([draft]).reasons.includes(expected));
  });
}

test("approved offer, CTA, subject and evidence identity cannot change", () => {
  for (const [field, value, reason] of [
    ["offer", "Paid audit", "OFFER_NOT_APPROVED"], ["cta", "Book a meeting", "CTA_NOT_APPROVED"],
    ["subject", "Guaranteed leads", "SUBJECT_NOT_APPROVED"], ["evidence_id", "other", "DRAFT_IDENTITY_MISMATCH"],
    ["tenant_id", "other", "DRAFT_IDENTITY_MISMATCH"], ["subject_id", "other", "DRAFT_IDENTITY_MISMATCH"],
  ]) assert.ok(validate([{ ...fresh().drafts[0], [field]: value }]).reasons.includes(reason));
  const draft = fresh().drafts[0]; draft.body = draft.body.replace(APPROVED_OFFER, "Paid audit.").replace(APPROVED_CTA, "Book now.");
  assert.ok(validate([draft]).reasons.includes("CTA_NOT_APPROVED"));
});

test("forged evidence fields are recomputed against source before draft validation", () => {
  for (const mutate of [
    (e) => { e.maps_position = 8; }, (e) => { e.competitors[0].name = "Fake HVAC"; },
    (e) => { e.allowed_wording = "You lost 100 customers."; }, (e) => { e.expires_at = "2027-01-01T00:00:00.000Z"; },
    (e) => { e.classification = "DIRECTORY_DEPENDENT"; },
  ]) {
    const row = fresh(); const evidence = evaluate(row).evidence; mutate(evidence);
    assert.ok(validate([draftFor(row, evidence)], row, evidence).reasons.includes("EVIDENCE_MISMATCH"));
  }
});

test("three failures persist their violations and hold; a fourth draft cannot rescue history", () => {
  const bad = { ...fresh().drafts[0], body: "Guaranteed 50 leads." };
  for (const count of [1, 2, 3]) {
    const result = validate(Array(count).fill(bad));
    assert.equal(result.status, count === 3 ? "hold" : "retry");
    assert.equal(result.attempts_remaining, 3 - count);
    assert.equal(result.attempts.length, count);
    assert.ok(result.attempts.every((attempt, i) => attempt.attempt === i + 1 && attempt.violations.includes("PROHIBITED_CLAIM")));
  }
  assert.ok(validate([bad, bad, bad]).reasons.includes("THIRD_FAILURE_HOLD"));
  assert.ok(validate([bad, bad, bad, fresh().drafts[0]]).reasons.includes("ATTEMPT_LIMIT_EXCEEDED"));
  assert.equal(validate([bad, bad, fresh().drafts[0]]).status, "ready");
  assert.ok(validate([...fresh().drafts, bad]).reasons.includes("ATTEMPTS_AFTER_SUCCESS"));
  assert.equal(validate([]).attempts_remaining, 3);
  assert.equal(validate(null).status, "hold");
});

test("batch partitions all records, retains invalid rows, holds all duplicates, and enforces tenant", () => {
  const batch = structuredClone(fixture);
  batch.records.push(fresh(), null, { ...fresh(), evidence_id: "foreign", context: { ...fresh().context, identity: { ...fresh().context.identity, tenant_id: "foreign", subject_id: "foreign" } } });
  const result = buildCachedSerpBatch(batch, now);
  assert.equal(result.counts.input, batch.records.length);
  assert.equal(result.counts.input, result.ready.length + result.hold.length);
  assert.equal(result.counts.duplicate_rows, 2);
  assert.equal(result.ready.length, 0);
  assert.ok(result.hold.some((row) => row.reasons.includes("BATCH_TENANT_MISMATCH")));
  assert.ok(result.hold.some((row) => row.input === null));
  assert.equal(new Set(result.hold.map((row) => row.input_index)).size, batch.records.length);
  assert.equal(result.safety.send_allowed, false);
  assert.equal(result.safety.import_allowed, false);
  assert.equal(result.safety.provider_calls, 0);
  const backwards = buildCachedSerpBatch({ ...batch, records: [...batch.records].reverse() }, now);
  assert.deepEqual(backwards.counts, result.counts);
});

test("invalid batches and excessive input records fail closed", () => {
  for (const batch of [null, {}, { ...fixture, schema_version: "2" }, { ...fixture, records: Array(1001).fill(null) }, { ...fixture, send: true }]) {
    assert.throws(() => buildCachedSerpBatch(batch, now), /INVALID_BATCH_CONTRACT/);
  }
  assert.deepEqual(buildCachedSerpBatch({ ...fixture, records: [] }, now).counts, { input: 0, ready: 0, hold: 0, duplicate_rows: 0 });
});

const runCli = (input, output, extra = []) => spawnSync(process.execPath, ["--experimental-strip-types", "scripts/build-cached-serp-review.ts", "--input", input, "--output", output, "--now", now, ...extra], { cwd: new URL("../", import.meta.url), encoding: "utf8" });
test("CLI writes verified, reconciled ready/hold/evidence artifacts and refuses overwrite", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "cached-serp-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const input = join(directory, "cached.json"); const output = join(directory, "nested", "review");
  await writeFile(input, JSON.stringify(fixture));
  const run = runCli(input, output);
  assert.equal(run.status, 0, run.stderr);
  const summary = JSON.parse(run.stdout);
  const ready = JSON.parse(await readFile(join(output, "ready.json"), "utf8"));
  const hold = JSON.parse(await readFile(join(output, "hold.json"), "utf8"));
  const manifest = JSON.parse(await readFile(join(output, "manifest.json"), "utf8"));
  const evidence = (await readFile(join(output, "evidence.jsonl"), "utf8")).trim().split("\n").map(JSON.parse);
  assert.deepEqual(manifest.counts, { input: 2, ready: 1, hold: 1, duplicate_rows: 0 });
  assert.equal(summary.input, ready.length + hold.length);
  assert.equal(manifest.evidence_count, evidence.length);
  assert.equal(manifest.reconciled, true);
  assert.ok(hold[0].reasons.includes("SOURCE_UNAVAILABLE"));
  assert.deepEqual(ready[0].draft_validation.attempts[0].violations, []);
  assert.deepEqual(evidence.map((e) => validateContract("evidence-block", e)), [[], []]);
  assert.equal(runCli(input, output).status, 1);
  assert.deepEqual(JSON.parse(await readFile(join(output, "ready.json"), "utf8")), ready);
  const output2 = join(directory, "review2");
  assert.equal(runCli(input, output2).status, 0);
  for (const file of await readdir(output)) assert.equal(await readFile(join(output, file), "utf8"), await readFile(join(output2, file), "utf8"));
});

test("CLI rejects unknown flags and malformed JSON without publishing artifacts", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "cached-serp-invalid-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const input = join(directory, "bad.json"); const output = join(directory, "review");
  await writeFile(input, "not JSON");
  assert.equal(runCli(input, output).status, 1);
  await writeFile(input, JSON.stringify(fixture));
  assert.equal(runCli(input, output, ["--send", "true"]).status, 1);
  assert.equal(runCli(input, output, ["--now", now]).status, 1);
  assert.deepEqual(await readdir(directory), ["bad.json"]);
});
