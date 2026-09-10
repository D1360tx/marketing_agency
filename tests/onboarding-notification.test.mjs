import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as security from "../src/lib/onboarding-security.ts";
import * as synthetic from "../src/lib/synthetic-handoff.ts";

// All DB/provider calls are local doubles. These tests must never send alerts.
async function fixture({ send = async () => ({ ok: true }), configured = true, saved = true, prospect, lookupFails = false, submission = {} } = {}) {
  const calls = [], errors = [];
  const row = { id: "550e8400-e29b-41d4-a716-446655440000", submitted_at: null, revoked_at: null, expires_at: "2099-01-01T00:00:00Z" };
  if (prospect) Object.assign(row, { prospect_id: "550e8400-e29b-41d4-a716-446655440001", user_id: "test-owner" });
  const prospectChain = {
    select() { return this; },
    eq(key, value) { calls.push(["scope", key, value]); return this; },
    async single() { return lookupFails ? { data: null, error: {} } : { data: prospect }; },
  };
  const chain = { select() { return this; }, eq() { return this; }, is() { return this; }, gt() { return this; },
    update(data) { calls.push(["save", data]); return this; },
    async single() { return { data: row }; },
    async maybeSingle() { return { data: saved ? { id: row.id } : null }; },
  };
  const dependencies = {
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@supabase/supabase-js": { createClient: () => ({ from: (table) => table === "prospects" ? prospectChain : chain }) },
    "@/lib/onboarding-security": security,
    "@/lib/synthetic-handoff": synthetic,
  };
  const exports = {};
  const source = await readFile(new URL("../src/app/api/onboarding/[token]/route.ts", import.meta.url), "utf8");
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports, Buffer, Date, AbortSignal, process: { env: { NEXT_PUBLIC_SUPABASE_URL: "https://example.invalid", SUPABASE_SERVICE_ROLE_KEY: "local-double", ...(configured ? { TELEGRAM_BOT_TOKEN: "local-double", TELEGRAM_CHAT_ID: "local-double" } : {}) } },
    console: { error: (...args) => errors.push(args), info: (...args) => calls.push(["audit", args]) },
    fetch: async (...args) => { calls.push(["notify", args]); return send(...args); },
    require: (name) => { assert.ok(Object.hasOwn(dependencies, name)); return dependencies[name]; },
  });
  return { calls, errors, run: () => exports.POST(new Request("https://example.invalid", { method: "POST", body: JSON.stringify({ business_name: "Synthetic Revenue QA - Test Only", primary_contact_email: "synthetic@example.invalid", ...submission }) }), { params: Promise.resolve({ token: "a".repeat(32) }) }) };
}

const syntheticProspect = {
  source: synthetic.SYNTHETIC_HANDOFF_SOURCE,
  business_name: synthetic.SYNTHETIC_HANDOFF_NAME,
  email: synthetic.SYNTHETIC_HANDOFF_EMAIL,
  phone: null,
};
const syntheticSubmission = {
  business_name: synthetic.SYNTHETIC_HANDOFF_NAME,
  primary_contact_email: synthetic.SYNTHETIC_HANDOFF_EMAIL,
};

test("persisted owner-scoped synthetic cohort saves and audits with ZERO provider calls", async () => {
  const f = await fixture({ prospect: syntheticProspect, submission: syntheticSubmission });
  const response = await f.run();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, notification: { status: "suppressed", reason: "synthetic_handoff" } });
  assert.equal(f.calls.filter(([kind]) => kind === "notify").length, 0);
  assert.equal(f.calls.filter(([kind]) => kind === "save").length, 1);
  assert.equal(f.calls.filter(([kind]) => kind === "audit").length, 1);
  assert.ok(f.calls.some(([kind, key, value]) => kind === "scope" && key === "user_id" && value === "test-owner"));
  assert.doesNotMatch(JSON.stringify(f.calls.filter(([kind]) => kind === "audit")), /example.invalid|aaaa/);
});

test("synthetic policy lookup and reserved field failures stop BEFORE save or notification", async () => {
  for (const opts of [
    { lookupFails: true },
    { prospect: { ...syntheticProspect, email: "real@example.com" } },
    { submission: { ...syntheticSubmission, phone: "5125550100" } },
    { submission: { ...syntheticSubmission, primary_contact_email: "real@example.com" } },
    { submission: { ...syntheticSubmission, business_name: "Real business" } },
  ]) {
    const f = await fixture({ prospect: syntheticProspect, submission: syntheticSubmission, ...opts });
    assert.equal((await f.run()).status, opts.lookupFails ? 503 : 400);
    assert.equal(f.calls.filter(([kind]) => ["save", "notify"].includes(kind)).length, 0);
  }
});

test("public synthetic-looking fields cannot suppress a normal prospect notification", async () => {
  const f = await fixture({ prospect: { ...syntheticProspect, source: "Manual" }, submission: syntheticSubmission });
  assert.equal((await f.run()).status, 200);
  assert.equal(f.calls.filter(([kind]) => kind === "notify").length, 1);
});

test("lost synthetic atomic claim has no alert and no suppression success audit", async () => {
  const f = await fixture({ prospect: syntheticProspect, submission: syntheticSubmission, saved: false });
  assert.equal((await f.run()).status, 409);
  assert.equal(f.calls.filter(([kind]) => ["notify", "audit"].includes(kind)).length, 0);
});

test("intake response waits for bounded notification after durable save", async () => {
  let release;
  const deferred = new Promise((resolve) => { release = resolve; });
  const f = await fixture({ send: () => deferred });
  let finished = false;
  const result = f.run().then((response) => { finished = true; return response; });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(f.calls.map(([kind]) => kind), ["save", "notify"]);
  const prematurelyFinished = finished;
  release({ ok: true });
  const response = await result;
  assert.equal(prematurelyFinished, false, "response must not finish while notification is pending");
  assert.equal(response.status, 200);
  assert.ok(f.calls[1][1][1].signal, "provider fetch needs a bounded timeout");
  assert.doesNotMatch(f.calls[1][1][1].body, /synthetic@example.invalid/);
});

test("provider rejection is logged safely and does not undo saved intake", async () => {
  const f = await fixture({ send: async () => ({ ok: false, status: 429 }) });
  assert.equal((await f.run()).status, 200);
  assert.equal(f.errors.length, 1);
  assert.match(JSON.stringify(f.errors), /429/);
  assert.doesNotMatch(JSON.stringify(f.errors), /local-double|synthetic@example.invalid/);
});

test("network failures do not leak token-bearing exception URLs", async () => {
  const f = await fixture({ send: async () => { throw Error("https://api.telegram.org/botlocal-double/sendMessage"); } });
  assert.equal((await f.run()).status, 200);
  assert.equal(f.errors.length, 1);
  assert.doesNotMatch(JSON.stringify(f.errors), /local-double/);
});

test("unconfigured notification and lost atomic claim send no alerts", async () => {
  for (const options of [{ configured: false }, { saved: false }]) {
    const f = await fixture(options);
    const response = await f.run();
    assert.equal(response.status, options.saved === false ? 409 : 200);
    assert.equal(f.calls.filter(([kind]) => kind === "notify").length, 0);
  }
});
