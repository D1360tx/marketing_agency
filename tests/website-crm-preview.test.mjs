import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8').replace(/\s+/g, ' ');
const page = read('src/app/website-crm/page.tsx');
const interactions = read('src/app/website-crm/preview-interactions.tsx');
const middleware = read('src/lib/supabase/middleware.ts');

test('website CRM preview is exactly scoped and noindexed before auth construction', () => {
  const start = middleware.indexOf('request.nextUrl.pathname === "/website-crm"');
  assert.ok(start > 0 && start < middleware.indexOf('const supabase = createServerClient'));
  const handler = middleware.slice(start, middleware.indexOf('// Close public agency registration'));
  assert.match(handler, /X-Robots-Tag.*noindex, nofollow, noarchive/);
  assert.doesNotMatch(handler, /startsWith/);
  assert.match(page, /robots: \{ index: false, follow: false \}/);
});
test('local planner never submits, persists, books or connects CRM', () => {
  assert.doesNotMatch(interactions, /fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|\/api\/|supabase|resend|twilio/i);
  assert.match(interactions, /e\.preventDefault\(\)/);
  assert.match(interactions, /Nothing is transmitted, stored or booked/);
  assert.match(page, /No information from this planner is sent or saved/);
});
test('conceptual CRM is visibly labeled and vendor origin is disclosed', () => {
  assert.match(page, /fictional business and records/);
  assert.match(page, /Powered by HighLevel/);
  assert.match(interactions, /Illustrative interface. No live connection/);
  assert.match(interactions, /EXAMPLE REPLY DRAFT \/ NOT SENT/);
  assert.match(interactions, /No appointment is booked here/);
});
test('proposed offer avoids unauthorized pricing and premature SMS promises', () => {
  assert.doesNotMatch(page, /\$\d|—/);
  assert.match(page, /50% to begin/);
  assert.match(page, /Balance before launch/);
  assert.match(page, /Quoted with your setup/);
  assert.match(page, /A2P registration/);
  assert.match(page, /usage charges are itemized separately/);
  assert.match(page, /Ongoing lead handling, managed campaigns and custom integrations are separate/);
});
