import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateRevenueDestination } from "../src/lib/revenue-url.ts";

const root = new URL("../", import.meta.url);
const read = async (path) => readFile(new URL(path, root), "utf8");

test("revenue destinations require non-placeholder external HTTPS URLs", () => {
  assert.equal(validateRevenueDestination(undefined), null);
  assert.equal(validateRevenueDestination("http://cal.example.org/book"), null);
  assert.equal(validateRevenueDestination("https://example.com/book"), null);
  assert.equal(validateRevenueDestination("https://trybookedout.com/go/book"), null);
  assert.equal(validateRevenueDestination("https://app.trybookedout.com/book"), null);
  assert.equal(
    validateRevenueDestination("https://cal.com/booked-out/audit")?.href,
    "https://cal.com/booked-out/audit"
  );
});

test("revenue provider URLs remain server-side and map to stable redirects", async () => {
  const env = await read(".env.local.example");
  assert.match(env, /^BOOKED_OUT_BOOKING_URL=/m);
  assert.match(env, /^BOOKED_OUT_AGREEMENT_URL=/m);
  assert.match(env, /^BOOKED_OUT_LOCAL_CALL_PAYMENT_URL=/m);
  assert.doesNotMatch(env, /NEXT_PUBLIC_BOOKED_OUT_(BOOKING|AGREEMENT|LOCAL_CALL_PAYMENT|GROWTH)/);

  const mappings = [
    ["src/app/go/book/route.ts", "BOOKED_OUT_BOOKING_URL"],
    ["src/app/go/agreement/route.ts", "BOOKED_OUT_AGREEMENT_URL"],
    ["src/app/go/start/route.ts", "BOOKED_OUT_LOCAL_CALL_PAYMENT_URL"],
  ];
  for (const [path, variable] of mappings) {
    const source = await read(path);
    assert.match(source, new RegExp(variable));
    assert.match(source, /status: 503/);
    assert.match(source, /NextResponse\.redirect\(destination, 307\)/);
  }
});

test("agreement preparation is internal and keeps signing inside SignWell", async () => {
  const [route, lead, env] = await Promise.all([
    read("src/app/go/agreement/route.ts"),
    read("src/app/app/leads/[id]/page.tsx"),
    read(".env.local.example"),
  ]);

  assert.match(route, /supabase\.auth\.getUser\(\)/);
  assert.match(route, /status: 401/);
  assert.match(lead, /Prepare Agreement/);
  assert.match(lead, /Payment After Signing/);
  assert.match(lead, /Open the SignWell template, personalize it, and send it after approving this lead/);
  assert.match(env, /Internal SignWell template\/workflow URL/);
  assert.doesNotMatch(lead, /Sign on Booked Out/);
});

test("canonical public offer sells only the scoped $499 founding system", async () => {
  const homepage = await read("src/app/landing_opus/page.tsx");
  const spanish = await read("src/app/es/page.tsx");
  assert.match(homepage, /Local Call System/);
  assert.match(homepage, /90-Day Booking Foundation/);
  assert.match(homepage, /\$499/);
  assert.match(homepage, /first 3 clients/);
  assert.match(homepage, /review requests by email/i);
  assert.match(homepage, /30-Day Foundation Promise/);
  assert.doesNotMatch(homepage, /Growth Partner/);
  assert.doesNotMatch(homepage, /price: "997"/);
  assert.doesNotMatch(homepage, /Review Engine/);
  assert.doesNotMatch(homepage, /We protect your spot/);
  assert.doesNotMatch(homepage, /1 business per trade/i);
  assert.doesNotMatch(homepage, /Missed-call text-back/i);
  assert.doesNotMatch(homepage, /consented SMS/i);
  assert.doesNotMatch(homepage, /SMS\/email usage/i);
  assert.match(spanish, /Base de Reservas de 90 Días/);
  assert.match(spanish, /Solicitudes de reseñas por email/);
  assert.doesNotMatch(spanish, /SMS autorizado/i);
  assert.doesNotMatch(spanish, /1 por oficio por ciudad/i);
  assert.doesNotMatch(spanish, /Las llamadas llegan solas/i);
});

test("public legal pages name the operator and current contact details", async () => {
  const [privacy, terms, agreement] = await Promise.all([
    read("src/app/privacy/page.tsx"),
    read("src/app/terms/page.tsx"),
    read("docs/context/CLIENT-SERVICE-AGREEMENT.md"),
  ]);
  for (const source of [privacy, terms, agreement]) {
    assert.match(source, /ICDC Ventures LLC/);
    assert.match(source, /1309 Coffeen Avenue/);
    assert.match(source, /Sheridan, Wyoming 82801/);
  }
  assert.match(privacy, /hello@trybookedout\.com/);
  assert.match(terms, /hello@trybookedout\.com/);
  assert.doesNotMatch(privacy, /info@trybookedout\.com/);
  assert.doesNotMatch(terms, /info@trybookedout\.com/);
});

test("public booking and retired partner paths are wired safely", async () => {
  const middleware = await read("src/lib/supabase/middleware.ts");
  const homepage = await read("src/app/landing_opus/page.tsx");
  const spanish = await read("src/app/es/page.tsx");
  const partners = await read("src/app/partners/page.tsx");

  assert.match(middleware, /"\/go"/);
  assert.match(homepage, /href="\/go\/book"/);
  assert.match(spanish, /href="\/go\/book"/);
  assert.match(partners, /permanentRedirect\("\/"\)/);
});
