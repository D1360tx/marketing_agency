# Controlled synthetic handoff (no intake alerts)

This mode is **not a global notification kill switch**. It covers the manual prospect → secure client-intake path only. Never enroll these records in campaigns, sequences, client-lead routing, review requests, or other outbound workflows. Do not invoke summary cron routes during QA; unrelated scheduled operational summaries are outside the handoff's transmission count.

## Reserved fixture

An authenticated operator creates a new prospect through the normal `/api/prospects` route (Quick Add Lead):

- Name: `TEST ONLY - Booked Out Synthetic Handoff`
- Source: `Synthetic Handoff QA - No Notifications`
- Email: `bookedout-handoff@example.invalid`
- Phone: empty
- Status: leave `new`; this is historical sandbox evidence, not a paying client.

The server validates these exact identifiers. PATCH cannot assign this mode to an existing real prospect, remove it, or change the synthetic record's fields/status; only notes can be updated. The mode is resolved from the persisted, owner-scoped prospect, never from public intake fields. Failed ownership/policy lookups stop before saving or attempting notifications. No schema change or credential bypass is required.

## Manual agreement/payment correlation

Use notes to identify the existing completed SignWell document and successful-but-refunded Stripe sandbox chain, with links to dated evidence. Do not represent the canceled subscription as active or replay provider events. This app has no payment webhook/unlock; operator-controlled onboarding creation is the intended current path. Correlation does not verify that a contract or payment belongs to a real business.

Generate the prospect-linked link with the normal authenticated `POST /api/onboarding` path. It retains existing owner checks, token generation, bounded expiry, reuse rules and RLS. Submit using the exact reserved name/email and no phone. The existing public endpoint validates and atomically saves once, returns `notification.status=suppressed`, and emits a token-free structured suppression audit containing the onboarding and prospect IDs. It does not call the Telegram provider. The authenticated Clients dashboard is the readback surface.

Synthetic source rows are excluded from daily/weekly prospect counts and follow-up reminder queries. Notes-only activity does not enter status-change summaries. This does not mute summaries about unrelated real activity.

## Verification and release gates

- Run `npm run test:security`, `npm run lint`, and `npm run build`.
- Unit route tests inject local DB/provider doubles and count all provider attempts; these are not production execution evidence.
- Verify exact PR head, merge and canonical deployment before creating production fixtures.
- Record the exact persisted source/name/email/owner/IDs before submission. If any identity differs, stop.
- Preserve response suppression evidence, server audit when available, authenticated dashboard readback, and provider historical cleanup evidence. Redact bearer tokens from artifacts.
- Do not delete any records or send receipts. No new Stripe charge is needed for historical manual correlation.

This feature does not establish database-trigger absence or disable provider-level notifications. Verify environment-specific database hooks before using production records for a strict zero-transmission assertion; if that evidence is unavailable, stop before production writes.
