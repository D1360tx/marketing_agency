# Booked Out Synthetic HVAC Fulfillment Readiness

- **Reviewed:** 2026-08-30 00:35 CDT
- **Environment:** production (`trybookedout.com`)
- **Synthetic client:** `Synthetic HVAC QA LLC - Test Only`
- **Submission ID:** `046e54e4-d928-476e-8b92-686617a3417e`

## Executive verdict

**Controlled synthetic fulfillment: PASS.** The live website endpoint, tenant ownership boundary, durable lead storage, owner notification, lead acknowledgment, and authenticated dashboard readback all worked end to end.

**Paid-client operating readiness: CONDITIONAL.** The lead path is usable for a tightly managed founding client, but deliverability, reporting, cancellation operations, and contractual export fulfillment still need owner-operated procedures or product work before scaling.

## Verified production evidence

- PR #10 (tenant-safe intake/routing) merged as `0a1db1de0a15cb2631bb5db9ef1eb82b385c65ec`.
- PR #11 (synthetic HVAC form connection) merged as `90518bed2566c34ad78384c8f65a129814c85b26`.
- Both production Vercel status contexts completed successfully for the final merge.
- Live POST returned HTTP `201`: `saved=true`, `duplicate=false`, owner notification `accepted`, acknowledgment `accepted`.
- Authenticated **Website Leads** dashboard showed the exact synthetic inquiry with both provider statuses `accepted`.
- Gmail readback confirmed:
  - `We received your request` reached the Inbox.
  - `New website inquiry saved` reached Spam.
- No SMS was sent. No real consumer PII was used.
- The synthetic endpoint remains enabled so the verified QA page stays functional; it should be disabled or rotated when testing ends.

## Remaining gaps

### P1 — Owner-notification deliverability

The owner notification reached Gmail Spam while the acknowledgment reached the Inbox. Gmail's original-message view showed SPF, DKIM, and DMARC all passing; Gmail classified the message because it resembled messages previously identified as spam. Provider acceptance is therefore not sufficient proof of inbox placement.

**Remediation in this release:** replace the repetitive generic subject/body with a client-specific subject, a plain-text alternative, a clear preheader, and a direct authenticated-dashboard call to action while continuing to omit submitted PII. Re-test inbox placement after deployment, mark the known synthetic message as not spam, and test at least one additional mailbox provider before real traffic.

### P1 — Delivery reporting is incomplete

The dashboard honestly reports provider acceptance, but the codebase has no Resend delivery-webhook endpoint that updates the existing `*_delivered_at` fields. Those fields cannot currently advance from `accepted` through application code.

**Required:** authenticated webhook ingestion with signature verification, provider-ID matching, idempotent status transitions, bounce/complaint handling, and an operator alert for terminal failures.

### P1 — Client lead reporting is not implemented

`/api/analytics` reports outbound prospects, campaigns, sequences, opens, and clicks; it does not query `client_leads`. The client-lead screen is a newest-first list capped at 200 records. The lead schema has no disposition, contacted timestamp, booked-job state, revenue, source/UTM, or conversion outcome.

**Required before the first monthly evidence report:** lead volume by client/date/service, delivery/bounce rates, response/disposition workflow, booked and won outcomes, attributable revenue where available, and a reproducible monthly report snapshot.

### P2 — Cancellation is manual-only

The agreement permits cancellation by written notice to `hello@trybookedout.com`, but there is no billing/subscription integration, cancellation request record, renewal cutoff calculation, offboarding checklist, or verified automation for endpoint revocation and service shutdown.

**Founding-client workaround:** maintain a manual cancellation register with request time, renewal date, final service date, billing action, endpoint revocation, data retention/export decision, and written completion confirmation.

### P2 — Contractual website export is not operationalized

The agreement promises eligible clients an export of client-specific website content and core page files after three fully paid months. The repository has no eligibility ledger, request workflow, deterministic website-export builder, manifest, or delivery receipt. `/api/prospects/export` is unrelated to this obligation, and the Website Leads screen has no CSV export.

**Required:** paid-month eligibility tracking, scoped export manifest, secret/third-party/reusable-system exclusions, generated archive validation, owner approval, secure delivery, and receipt logging. Add a tenant-scoped lead CSV export separately for ordinary data portability.

## Launch gate

A single founding client can be serviced only with active owner oversight and documented manual cancellation/export procedures. Do not scale acquisition until owner-email deliverability is corrected and delivery-webhook telemetry is live. Complete client-lead outcomes/reporting before the first promised monthly evidence report.
