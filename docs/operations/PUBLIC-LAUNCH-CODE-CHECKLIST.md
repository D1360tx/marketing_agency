# Public launch code checks

Scope: canonical English landing source (`/` rewrites to `/landing_opus`), Spanish `/es`, and public agency signup. This is local code/build evidence, not production, provider, legal, or revenue-funnel approval.

## Verified locally

- [x] Both landing pages describe the $499 monthly founding offer for the first three clients with setup included.
- [x] Both state seven core pages, two implementation revision rounds, up to 100 eligible review requests per month by email, and supported email/manual-first follow-up for up to 50 inbound leads per month.
- [x] Both state one-business/location/domain/profile scope, monthly conversion improvement, evidence reporting, and the 30-minute Growth Desk review.
- [x] Removed every-job/text-review claims, unsupported mobile speed and ranking promises, and Spanish territorial scarcity. Both public forms explicitly submit `smsConsent: false`.
- [x] Removed the English text-message review illustration in favor of a labeled sample email. Body copy contains no em dashes.
- [x] Both pages qualify the 30-day delivery promise and distinguish it from guaranteed outcomes.
- [x] `/signup` redirects to `/login` before Supabase initialization and discards query parameters. The server page independently redirects rather than rendering a registration form.
- [x] Login identifies internal invited-team access and directs customers to their secure onboarding invitation.
- [x] Regression tests exercise signup redirects, invitation callback success/failure and safe destinations, and unchanged public token-onboarding middleware access. Auth providers are mocked in these tests.
- [x] Focused tests: `node --experimental-strip-types --test tests/public-launch-blockers.test.mjs tests/revenue-readiness.test.mjs`, 11 passed.
- [x] Full available test command: `npm run test:security`, 100 passed. There is no `npm test` script.
- [x] `npm run lint`: exit 0, 0 errors and 10 warnings.
- [x] `npm run build`: exit 0, TypeScript passed, 71 static pages generated. Existing Edge Runtime deprecation/static-generation warnings remain.
- [x] Local production-server HTTP smoke: `/` and `/es` returned 200 with price and caps; `/signup` and `/signup?next=https://evil.test&code=untrusted` returned 307 with `Location: /login`.

## Still requires separate verification

- [ ] Deploy and read back the exact production release, including mobile/browser visual QA.
- [ ] Verify Supabase provider-side public registration is disabled while invitations still work. Closing the application page does not disable the provider's direct Auth API.
- [ ] Exercise a real invited-team login/callback and a real secure customer onboarding link in the intended environment.
- [ ] Complete provider configuration/readback for booking, signing, recurring payment, receipts, cancellation, delivery telemetry, and inbox placement.
- [ ] Obtain counsel/owner approval of the agreement and applicable operating policies.
- [ ] Pass the controlled end-to-end revenue and fulfillment dry run before real outreach/payment.

Do not mark any existing production, legal, provider, or end-to-end launch gate complete based on these local checks. Historical synthetic evidence remains separate in `SYNTHETIC-HVAC-DRYRUN-READINESS.md`.
