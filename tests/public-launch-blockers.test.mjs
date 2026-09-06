import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const pages = ["src/app/landing_opus/page.tsx", "src/app/es/page.tsx"];

for (const [index, path] of pages.entries()) {
  test(`${path}: public offer stays email-only, capped, and claim-safe`, async () => {
    const source = await read(path);
    const text = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ");
    assert.match(text, /\$499/);
    assert.match(text, index ? /primeros 3 clientes/ : /first 3 clients/);
    for (const pattern of index ? [
      /sin costo de instalación y mes a mes/, /[Hh]asta siete páginas principales/,
      /dos rondas consolidadas/, /[Hh]asta 100 solicitudes elegibles al mes/,
      /hasta 50 prospectos entrantes al mes/, /Growth Desk de 30 minutos/,
      /un negocio, una ubicación, un dominio/, /solo por email/,
      /No garantizamos llamadas/, /restricciones legales y cambios materiales/,
      /tres meses pagados/,
    ] : [
      /setup included/i, /month-to-month/i, /[Uu]p to seven core pages/,
      /two consolidated implementation revision rounds/, /[Uu]p to 100 eligible requests per month/,
      /up to 50 inbound leads per month/, /30-minute Growth Desk review/,
      /one business, one location, one domain/, /email-only review requests/,
      /No calls, leads, reviews, rankings, bookings, sales, or revenue are guaranteed/,
      /legal restrictions, and material scope changes/, /three paid months/,
    ]) assert.match(text, pattern);
    for (const pattern of [
      /text or email|text message|after every|every completed job triggers|for every customer/i,
      /después de cada trabajo|mensaje\/correo|pasa automáticamente|textos automatizados/i,
      /under (?:2|two) seconds|menos de (?:2|dos) segundos|sub-2-second/i,
      /unlimited (?:requests|reviews|pages)|solicitudes ilimitadas/i,
      /1 negocio por oficio|pages that rank|páginas de servicio que posicionan/i,
      /review-request-system\.png/, /—|&mdash;|&#8212;/,
    ]) assert.doesNotMatch(text, pattern);
    assert.match(source, /smsConsent: false/);
    assert.doesNotMatch(source, /setSmsConsent|href="\/signup"/);
  });
}

async function load(path, dependencies) {
  const exports = {};
  const output = ts.transpileModule(await read(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(output, {
    exports, URL,
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}

test("signup redirects before auth setup and drops untrusted query parameters", async () => {
  let authCalls = 0;
  const { updateSession } = await load("src/lib/supabase/middleware.ts", {
    "@supabase/ssr": { createServerClient() { authCalls++; throw Error("Auth must not run"); } },
    "next/server": { NextResponse: {
      redirect: (url, status) => ({ location: String(url), status }),
      next: () => ({ headers: new Headers() }),
    } },
  });
  for (const path of ["/signup", "/signup/", "/signup?next=https://evil.test&code=untrusted"]) {
    const url = `https://trybookedout.com${path}`;
    const response = await updateSession({ url, nextUrl: new URL(url) });
    assert.equal(response.status, 307);
    assert.equal(response.location, "https://trybookedout.com/login");
  }
  for (const path of ["/auth/callback?code=invite&next=/app", "/onboarding/test-token", "/api/onboarding/test-token"]) {
    const url = `https://trybookedout.com${path}`;
    const response = await updateSession({ url, nextUrl: new URL(url) });
    assert.equal(response.location, undefined);
    if (path.startsWith("/onboarding/")) assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  }
  assert.equal(authCalls, 0);
});

test("signup page has no registration path even without middleware; login explains invite access", async () => {
  const page = await load("src/app/(auth)/signup/page.tsx", {
    "next/navigation": { redirect(path) { throw new Error(`redirect:${path}`); } },
  });
  assert.throws(() => page.default(), /redirect:\/login/);
  const login = await read("src/app/(auth)/login/page.tsx");
  assert.doesNotMatch(login, /href="\/signup"|auth\.signUp/);
  assert.match(login, /Invited team members only/);
  assert.match(login, /secure onboarding link/);
  assert.match(login, /auth\.signInWithPassword/);
});

test("invitation callback still exchanges valid codes and uses safe next path", async () => {
  const exchanges = [];
  const { GET } = await load("src/app/auth/callback/route.ts", {
    "next/server": { NextResponse: { redirect: (url) => ({ location: url }) } },
    "@/lib/supabase/server": { createClient: async () => ({ auth: {
      exchangeCodeForSession: async (code) => { exchanges.push(code); return { error: code === "bad" }; },
    } }) },
    "@/lib/safe-redirect": await import("../src/lib/safe-redirect.ts"),
  });
  assert.equal((await GET(new Request("https://trybookedout.com/auth/callback?code=invite&next=/app"))).location, "https://trybookedout.com/app");
  assert.equal((await GET(new Request("https://trybookedout.com/auth/callback?code=invite&next=https://evil.test"))).location, "https://trybookedout.com/app");
  assert.equal((await GET(new Request("https://trybookedout.com/auth/callback?code=bad"))).location, "https://trybookedout.com/login?error=auth");
  assert.deepEqual(exchanges, ["invite", "invite", "bad"]);
});
