import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { safeRelativePath } from "../src/lib/safe-redirect.ts";

async function load(path, dependencies) {
  const exports = {};
  const source = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, URL, process: { cwd: () => "/test" }, require(name) {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports;
}

async function callback(error = null) {
  const calls = [];
  const route = await load("src/app/auth/callback/route.ts", {
    "next/server": { NextResponse: { redirect: (location) => ({ location }) } },
    "@/lib/safe-redirect": { safeRelativePath },
    "@/lib/supabase/server": { createClient: async () => ({ auth: {
      verifyOtp: async (args) => { calls.push(["otp", { ...args }]); return { error }; },
      exchangeCodeForSession: async (code) => { calls.push(["pkce", code]); return { error }; },
    } }) },
  });
  return { calls, run: (query) => route.GET(new Request(`https://trybookedout.com/auth/callback${query}`)) };
}

test("dashboard TokenHash invite verifies without a PKCE cookie and goes to password setup", async () => {
  const { calls, run } = await callback();
  for (const next of ["/app", "https://evil.test", "//evil.test"]) {
    assert.equal((await run(`?token_hash=test-invite&type=invite&next=${encodeURIComponent(next)}`)).location,
      "https://trybookedout.com/auth/accept-invite");
  }
  assert.deepEqual(calls, Array.from({ length: 3 }, () => ["otp", { token_hash: "test-invite", type: "invite" }]));
});

test("missing, unsupported and ambiguous invite credentials fail closed without auth calls", async () => {
  const { calls, run } = await callback();
  for (const query of ["", "?type=invite", "?token_hash=x", "?token_hash=x&type=signup", "?token_hash=x&type=recovery", "?token_hash=x&type=invite&code=y", "#access_token=x&refresh_token=y&type=invite"]) {
    assert.equal((await run(query)).location, "https://trybookedout.com/login?error=auth");
  }
  assert.equal(calls.length, 0);
});

test("expired or already-used invite is rejected by Supabase; no successful redirect", async () => {
  const { run } = await callback({ message: "Token has expired" });
  assert.equal((await run("?token_hash=expired&type=invite")).location, "https://trybookedout.com/login?error=auth");
});

test("existing PKCE flow preserves same-origin redirect protection", async () => {
  const { calls, run } = await callback();
  for (const next of ["https://evil.test", "//evil.test", "/\\evil.test"]) {
    assert.equal((await run(`?code=valid&next=${encodeURIComponent(next)}`)).location, "https://trybookedout.com/app");
  }
  assert.equal((await run("?code=valid&next=/app/settings")).location, "https://trybookedout.com/app/settings");
  assert.equal(calls.length, 4);
});

async function passwordAction({ user = { id: "invited-user" }, userError = null, updateError = null } = {}) {
  const updates = [];
  const { setInvitePassword } = await load("src/app/auth/accept-invite/actions.ts", {
    "next/navigation": { redirect: (path) => { throw Error(`redirect:${path}`); } },
    "@/lib/supabase/server": { createClient: async () => ({ auth: {
      getUser: async () => ({ data: { user }, error: userError }),
      updateUser: async (args) => { updates.push({ ...args }); return { error: updateError }; },
    } }) },
  });
  return { updates, run: (password = "long-test-password", confirmation = password) => {
    const data = new FormData();
    data.set("password", password); data.set("confirmation", confirmation);
    return setInvitePassword(null, data);
  } };
}

test("password setup rejects invalid length and mismatch without updating", async () => {
  const { run, updates } = await passwordAction();
  assert.match(await run("short"), /between 12 and 128/);
  assert.match(await run("a".repeat(129)), /between 12 and 128/);
  assert.match(await run("long-test-password", "different-password"), /do not match/);
  assert.equal(updates.length, 0);
});

test("password setup requires a server-verified user, not a claimed session", async () => {
  for (const options of [{ user: null }, { userError: { message: "expired" } }]) {
    const { run, updates } = await passwordAction(options);
    assert.match(await run(), /session has expired/);
    assert.equal(updates.length, 0);
  }
});

test("password update errors stay on setup; success redirects only after update", async () => {
  const rejected = await passwordAction({ updateError: { message: "weak password" } });
  assert.match(await rejected.run(), /Unable to set/);
  const accepted = await passwordAction();
  await assert.rejects(accepted.run(), /redirect:\/app/);
  assert.deepEqual(accepted.updates, [{ password: "long-test-password" }]);
});

test("auth routes are no-store and suppress referrers/indexing", async () => {
  const { default: config } = await load("next.config.ts", {});
  const auth = (await config.headers()).find((entry) => entry.source === "/auth/:path*");
  assert.ok(auth.headers.some((h) => h.key === "Cache-Control" && h.value.includes("no-store")));
  assert.ok(auth.headers.some((h) => h.key === "Referrer-Policy" && h.value === "no-referrer"));
});
