import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as synthetic from "../src/lib/synthetic-handoff.ts";
import * as types from "../src/types/index.ts";

const prospect = { source: synthetic.SYNTHETIC_HANDOFF_SOURCE, business_name: synthetic.SYNTHETIC_HANDOFF_NAME, email: synthetic.SYNTHETIC_HANDOFF_EMAIL, phone: "" };
async function route({ user = { id: "owner" }, current = { source: "Manual", status: "new" } } = {}) {
  const writes = [];
  const chain = {
    select() { return this; }, eq() { return this; },
    insert(data) { writes.push(data); return this; },
    update(data) { writes.push(data); return this; },
    async single() { return { data: writes.length ? { id: "fixture", ...writes.at(-1) } : current }; },
  };
  const dependencies = {
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/supabase/server": { createClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) }, from: () => chain }) },
    "@/lib/activity-log": { logActivity: async () => {} },
    "@/lib/synthetic-handoff": synthetic,
    "@/types": types,
  };
  const exports = {};
  const source = await readFile(new URL("../src/app/api/prospects/route.ts", import.meta.url), "utf8");
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports, Date, console,
    fetch: () => { throw Error("Unexpected external transmission"); },
    require: (name) => { assert.ok(Object.hasOwn(dependencies, name)); return dependencies[name]; },
  });
  return { writes, run: (method, body) => exports[method](new Request("https://example.invalid", { method, body: JSON.stringify(body) })) };
}

test("synthetic creation is authenticated and validates reserved non-deliverable identity", async () => {
  for (const [body, user, status] of [
    [prospect, null, 401],
    [prospect, { id: "owner" }, 200],
    [{ ...prospect, email: "real@example.com" }, { id: "owner" }, 400],
    [{ ...prospect, business_name: "Real business" }, { id: "owner" }, 400],
    [{ ...prospect, phone: "5125550100" }, { id: "owner" }, 400],
  ]) {
    const f = await route({ user });
    assert.equal((await f.run("POST", body)).status, status);
    assert.equal(f.writes.length, status === 200 ? 1 : 0);
    if (status === 200) assert.equal(f.writes[0].user_id, "owner");
  }
});

test("synthetic mode cannot be assigned through PATCH or converted to a real client", async () => {
  const id = "550e8400-e29b-41d4-a716-446655440000";
  for (const [current, update, status] of [
    [{ source: "Manual" }, { source: synthetic.SYNTHETIC_HANDOFF_SOURCE }, 400],
    [prospect, { status: "client" }, 400],
    [prospect, { email: "real@example.com" }, 400],
    [prospect, { source: "Manual" }, 400],
    [prospect, { notes: "Historical sandbox correlation only" }, 200],
    [null, { notes: "No accessible record" }, 404],
  ]) {
    const f = await route({ current });
    assert.equal((await f.run("PATCH", { id, ...update })).status, status);
    assert.equal(f.writes.length, status === 200 ? 1 : 0);
  }
});

test("automatic prospect summaries and reminders exclude synthetic source and preserve null sources", async () => {
  for (const name of ["daily-summary", "weekly-summary", "followup-reminder"]) {
    const source = await readFile(new URL(`../src/app/api/cron/${name}/route.ts`, import.meta.url), "utf8");
    const queries = source.split('.from("prospects")').slice(1);
    assert.ok(queries.length > 0);
    for (const query of queries) {
      assert.match(query.split(";")[0], /\.select\([^)]*\)\s*\.or\(`source.is.null,source.neq.\$\{SYNTHETIC_HANDOFF_SOURCE\}`\)/);
    }
  }
});
