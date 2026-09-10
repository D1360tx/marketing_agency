# Controlled synthetic handoff evidence

Outcome: scoped suppression support deployed; end-to-end handoff incomplete and stopped before business-record writes. See `../2026-09-10-controlled-synthetic-handoff.md` for exact acceptance criteria and the environment-preflight blocker.

- `tests.log`, `merge-tests.log`: 119 passing local tests; DB and notification providers are doubles.
- `lint.log`, `build.log`: successful local verification.
- `pr-head-checks.json`, `merge-deployment-status.json`: exact GitHub/Vercel release provenance.
- `runtime-smoke.json`: canonical HTTP fail-closed probes, no authenticated mutations.
- `database-trigger-readback.json` / `.png`: complete five-row non-internal trigger inventory.
- `sql-input-verification-blocker.png`: unstable native rules-query input; not evidence of rules-query success.
- `sha256-manifest.json`: hashes for evidence files (excluding itself).

No generated production prospect/onboarding IDs or bearer tokens exist for this attempt. Historical SignWell/Stripe IDs are documented in the dated report, not represented as a new linked client.
