# Controlled synthetic handoff — 2026-09-10

## Outcome: suppression support shipped; full handoff NOT executed

**Do not mark the end-to-end gate passed.** Implemented, tested, reviewed and deployed narrow non-notifying synthetic intake support. Stopped before creating any production prospect/onboarding records because the strict zero-transmission environment preflight was not completely verified. No new Stripe payment/subscription, SignWell document, customer message, owner alert, receipt, or database record deletion was initiated.

## Shipped code

- Original workspace had unrelated dirty invitation/auth/config files and untracked artifacts; none were absorbed or changed.
- Clean worktree: `/home/d1360/workspaces/trybookedout-synthetic-handoff`, created from fresh `origin/main` `e0020d208eeff73e01c3f21ff0fb5f5469a1bda9`.
- PR: https://github.com/D1360tx/marketing_agency/pull/23
- Reviewed head: `1c4a6fc9ca781ee79307c3cd9aa7a63e22fa254e`.
- Squash merge: `7e48624f31374b1bebc77ce8bd75543ecc1dbcac`, merged September 10 at 22:00:24 UTC.
- Head and merge tree both: `bca5d92dc0b7f96bc6d6e02d167e56dd6fe4735b`.
- Both head Vercel checks passed: `marketing_agency/3hsoPgECiV3YEfijbDAB5fAFm6p1`, `agencyflow-audit/4MvCojG8TuJ4UbQ7jeyGGm9xZrNL`.
- Both merge Vercel statuses passed: `marketing_agency/5kAGmsiQKE1HUYmmEeYsLkQS2egh`, `agencyflow-audit/73emDHaKBbvjAPsLskJJ3cpxocq3`.
- Security tests: **119 passed / 0 failed**. Re-executed successfully at the actual merge commit.
- Lint: **0 errors / 10 pre-existing warnings**. Build passed, TypeScript passed, 72 static pages.
- Canonical runtime smoke: `/` 200; malformed onboarding token 404 with `private, no-store`; unauthenticated prospect creation and onboarding creation both 401. These probes created no records.

### Behavior and security review

`src/lib/synthetic-handoff.ts` defines a reserved source plus exact TEST ONLY name, `bookedout-handoff@example.invalid`, and no phone. Authenticated prospect creation validates these values. PATCH cannot assign this source to an existing real prospect or change a synthetic record except notes. The lead detail can generate an intake without falsely marking the synthetic prospect a paying client.

The public submission endpoint resolves mode through a stored, owner-scoped prospect. Public synthetic-looking payload fields cannot suppress a normal prospect's alert. Ownership/policy failure stops before persistence. A valid synthetic save retains the existing atomic one-time token predicates and returns a suppression receipt, with token-free record-ID audit logging and **zero Telegram calls**. Daily/weekly prospect summaries and reminders exclude this source while preserving null-source real records. No schema change, secret, anonymous-access expansion, payment bypass, or fabricated provider event was introduced.

Tests exercise reserved-identity validation, authentication, immutability, missing ownership, spoofed public fields, zero provider calls, lost atomic claims, normal notification behavior, and secondary summary query coverage. Provider and DB calls in these tests are explicit local doubles, **not production handoff proof**. `code-review-graph` was not available in the tool catalog; exact diff, producer/consumer, test and build review was used instead.

Operating limits and the exact procedure are in `docs/operations/CONTROLLED-SYNTHETIC-HANDOFF.md`. This is not a global notification kill switch. Do not enroll synthetic records in campaigns, sequences, review sends or website-lead routing.

## Provider evidence and historical correlation

Reused only existing evidence; no provider mutation was made. The native Stripe readback in this run displayed the TEST ONLY Dallas payment, payment-succeeded and full-refunded activity, exact PaymentIntent and subscription. The detailed durable evidence remains in the earlier September 10 lifecycle report and its evidence directory; this does not create a new prospect relationship.

- SignWell completed controlled document: `f803f9aa-86b4-4bd5-8449-f64d1c358bb9`. Completion is established by the September 9 report; not independently reopened in this run. No repeat signature/send/modification.
- Stripe account: `acct_1QwEinCoAWFNO5BE`, ICDC Ventures Default sandbox.
- Checkout: `cs_test_a1VSjTj2vxAaFF7ObEoSuBrm2FBfpItGIzDd8Mj5tLJT2E00e5FZkbCNjA`.
- Customer: `cus_VEa4UOaxUmm1sM`.
- PaymentIntent: `pi_3UE6uSCoAWFNO5BE0hbirkKp`, historically succeeded for USD 530.94.
- Charge: `ch_3UE6uSCoAWFNO5BE0cqeSrKg`.
- Invoice: `in_1UE6uSCoAWFNO5BEs7wpnpJ1`, historically paid, zero remaining.
- Subscription: `sub_1UE6uUCoAWFNO5BEFDjjOCrA`, canceled in the existing lifecycle evidence.
- Full refund: `re_3UE6uSCoAWFNO5BE0Njy7CgU`, succeeded for USD 530.94 in existing evidence.
- Existing receipt readback: No receipts sent. No receipt action was taken here.

The app currently uses a manual authenticated onboarding generator, not a Stripe webhook/unlock. Historical successful-but-refunded evidence may be correlated explicitly in notes, but must not be described as active paid service.

## Live preflight and stopping point

Enumerated native Chrome windows first. Restricted interaction to Booked Out/provider window PID 1924/window 5835304 and the already-owned MarketingAgency Supabase window 68032. Unrelated Chrome window 12323002 was not used. A new Booked Out tab in 5835304 loaded the authenticated Clients dashboard, showing the two historical synthetic submissions and one pending link; no Generate Link or submit action was taken.

MarketingAgency Supabase project `pjggltqecxhypjisfpvn`, production main, was verified in the native UI. A read-only `pg_trigger` query returned exactly five non-internal triggers, all on `realtime.subscription`, `storage.objects` or `storage.buckets`; none on `prospects`, `prospect_activities`, or `client_onboarding`. All five rows and the declared count are preserved in `database-trigger-readback.json`. This proves absence of table triggers for these records, not absence of every possible database rule, scheduled job, or external consumer.

**Remaining preflight blocker:** public-schema rules and other environment-specific automatic transmissions were not completely verified. Native input repeatedly required escalation, delivered truncated SQL, and displayed delayed edits/pastes. The final screenshot shows a rules-count query followed by an appended partial second query, rather than a stable exact query/result. The earlier malformed read-only query returned SQL syntax error; no DDL/DML was executed. Do not proceed with production fixtures based on assumed silence or blindly retry ambiguous input. Complete a stable read-only rules/automation inventory through the exact owned window or an authorized read-only database/API path first.

The SQL Editor contains only task-authored SELECT text with unsaved edits in a newly created query; no query-save action was deliberately used. The provider UI assigned an untitled query handle while editing. No unrelated saved query was edited. The Booked Out task tab remains open. Native transient captures expired before some early copies could be made; only files actually present in the evidence directory are claimed as durable screenshots.

## Acceptance criteria

| # | Result |
|---|---|
| 1 | **Incomplete:** no new production synthetic prospect created. |
| 2 | **Partial:** exact completed SignWell ID recorded from prior evidence; not bound to a new prospect. |
| 3 | **Partial:** exact historical sandbox chain and cleanup recorded; no new payment and no new relationship. |
| 4 | **Incomplete:** intended authenticated creation route retained/tested; no new live token generated. |
| 5 | **Incomplete:** no new live intake submitted or read back. Existing dashboard baseline only. |
| 6 | **Incomplete:** no new prospect/onboarding relationship to verify. |
| 7 | **Partial safety pass:** this run performed no handoff writes or notification actions. Local synthetic route tests prove zero provider attempts. No claim of a completed silent production linkage. GitHub/Vercel infrastructure traffic and provider/database read requests did occur. |
| 8 | **Pass:** no live Stripe objects changed; no Stripe writes at all. |
| 9 | **Pass:** no business records deleted or modified; unrelated workspace edits preserved. |
| 10 | **Pass:** dated report and durable evidence directory created. |

## Evidence

Directory: `artifacts/provider-readiness/2026-09-10-synthetic-handoff/`.

Includes test/lint/build logs, merge-commit tests, exact PR-head checks, merge deployment status, canonical HTTP smoke, five-row database-trigger readback and screenshot, and native SQL-input blocker screenshot. The local fixture identities inside tests are test doubles, not generated production IDs. No bearer onboarding token or secret is published.
